import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import User from "@/models/User";
import Property from "@/models/Property";

export async function GET() {
  console.log("🔥🔥🔥 RECOMMENDATIONS API CALLED 🔥🔥🔥");

  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    /*
     * ==========================================
     * GET USER PREFERENCES
     * ==========================================
     */
    const user = await User.findById(session.user.id).select(
      "city preferredPropertyType minBudget maxBudget currency role",
    );

    console.log("🔥 RECOMMENDATION USER:", {
      id: session.user.id,
      role: session.user.role,
      user,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 },
      );
    }

    /*
     * ==========================================
     * GET AVAILABLE PROPERTIES
     * ==========================================
     *
     * Only available properties can be recommended.
     */
    const properties = await Property.find({
      status: "available",
    })
      .populate("assignedAgent", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    console.log("🔥 AVAILABLE PROPERTIES:", properties.length);

    /*
     * ==========================================
     * USER PREFERENCES
     * ==========================================
     */
    const minBudget = user.minBudget != null ? Number(user.minBudget) : null;

    const maxBudget = user.maxBudget != null ? Number(user.maxBudget) : null;

    const preferredLocation = user.city?.trim().toLowerCase() || null;

    const preferredPropertyType =
      user.preferredPropertyType?.toLowerCase() || null;

    const preferredCurrency = user.currency?.toUpperCase() || null;

    const hasPreferences =
      Boolean(preferredLocation) ||
      Boolean(preferredPropertyType && preferredPropertyType !== "other") ||
      minBudget !== null ||
      maxBudget !== null;

    console.log("🔥 USER PREFERENCES:", {
      preferredLocation,
      preferredPropertyType,
      minBudget,
      maxBudget,
      preferredCurrency,
      hasPreferences,
    });

    /*
     * ==========================================
     * NO AVAILABLE PROPERTIES
     * ==========================================
     */
    if (properties.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        recommendationType: "content-based",

        preferences: {
          location: user.city || null,
          propertyType: user.preferredPropertyType || null,
          minBudget: user.minBudget ?? null,
          maxBudget: user.maxBudget ?? null,
          currency: user.currency || null,
        },
      });
    }

    /*
     * ==========================================
     * NO USER PREFERENCES
     * ==========================================
     */
    if (!hasPreferences) {
      return NextResponse.json({
        success: true,
        data: [],
        recommendationType: "content-based",

        message: "No property preferences found for this user.",

        preferences: {
          location: null,
          propertyType: null,
          minBudget: null,
          maxBudget: null,
          currency: preferredCurrency,
        },
      });
    }

    /*
     * ==========================================
     * STEP 1 — BUDGET ELIGIBILITY
     * ==========================================
     *
     * Budget is a HARD constraint.
     *
     * Example:
     *
     * Client maximum = 9,000,000
     * Property price = 49,999,999
     *
     * ❌ Property is excluded.
     *
     * It does NOT matter if its type,
     * currency or location matches.
     */

    const budgetEligibleProperties = properties.filter((property) => {
      const price = Number(property.price) || 0;

      /*
       * Both minimum and maximum budget.
       */
      if (minBudget !== null && maxBudget !== null) {
        return price >= minBudget && price <= maxBudget;
      }

      /*
       * Maximum budget only.
       */
      if (maxBudget !== null) {
        return price <= maxBudget;
      }

      /*
       * Minimum budget only.
       */
      if (minBudget !== null) {
        return price >= minBudget;
      }

      /*
       * No budget preference.
       *
       * In this case every available property
       * remains eligible.
       */
      return true;
    });

    console.log(
      "🔥 BUDGET ELIGIBLE PROPERTIES:",
      budgetEligibleProperties.length,
    );

    /*
     * ==========================================
     * NO PROPERTIES WITHIN BUDGET
     * ==========================================
     */
    if (budgetEligibleProperties.length === 0) {
      return NextResponse.json({
        success: true,

        data: [],

        recommendationType: "content-based",

        message: "No available properties match your budget.",

        preferences: {
          location: user.city || null,
          propertyType: user.preferredPropertyType || null,
          minBudget: user.minBudget ?? null,
          maxBudget: user.maxBudget ?? null,
          currency: user.currency || null,
        },
      });
    }

    /*
     * ==========================================
     * STEP 2 — CONTENT-BASED SCORING
     * ==========================================
     *
     * Location       = 30
     * Property type  = 30
     * Currency       = 10
     * Budget         = 30
     *
     * Maximum = 100
     *
     * NOTE:
     * Budget eligibility has already been checked.
     * Therefore every property reaching this stage
     * is financially eligible.
     */

    const scoredProperties = budgetEligibleProperties.map((property) => {
      let score = 0;

      const reasons = [];

      /*
       * ========================================
       * LOCATION MATCH
       * ========================================
       *
       * The User.city field now represents
       * preferred location.
       *
       * Example:
       *
       * Client preference:
       * "Bole"
       *
       * Property:
       * city = "Addis Ababa"
       * subCity = "Bole"
       *
       * This should match.
       */

      const propertyCity = property.location?.city?.trim().toLowerCase() || "";

      const propertySubCity =
        property.location?.subCity?.trim().toLowerCase() || "";

      const propertyAddress =
        property.location?.address?.trim().toLowerCase() || "";

      if (preferredLocation) {
        const locationMatch =
          propertySubCity.includes(preferredLocation) ||
          propertyCity.includes(preferredLocation) ||
          propertyAddress.includes(preferredLocation);

        if (locationMatch) {
          score += 30;

          reasons.push("Matches your preferred location");
        }
      }

      /*
       * ========================================
       * PROPERTY TYPE MATCH
       * ========================================
       */

      if (
        preferredPropertyType &&
        preferredPropertyType !== "other" &&
        property.propertyType?.toLowerCase() === preferredPropertyType
      ) {
        score += 30;

        reasons.push("Matches your preferred property type");
      }

      /*
       * ========================================
       * CURRENCY MATCH
       * ========================================
       */

      if (
        preferredCurrency &&
        property.currency?.toUpperCase() === preferredCurrency
      ) {
        score += 10;

        reasons.push("Matches your preferred currency");
      }

      /*
       * ========================================
       * BUDGET MATCH
       * ========================================
       *
       * Every property here is already inside
       * the client's allowed budget.
       *
       * Therefore budget gets its 30 points.
       */

      score += 30;

      reasons.push("Within your preferred budget");

      return {
        ...property,

        recommendationScore: score,

        recommendationReasons: reasons,
      };
    });

    /*
     * ==========================================
     * STEP 3 — SORT
     * ==========================================
     *
     * Highest score first.
     *
     * If scores are equal:
     * newest property first.
     */

    scoredProperties.sort((a, b) => {
      if (b.recommendationScore !== a.recommendationScore) {
        return b.recommendationScore - a.recommendationScore;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    /*
     * ==========================================
     * STEP 4 — TOP 6
     * ==========================================
     */
    const recommendations = scoredProperties.slice(0, 6);

    /*
     * ==========================================
     * DEBUG
     * ==========================================
     */

    console.log("🔥🔥🔥 SCORED PROPERTIES 🔥🔥🔥");

    console.table(
      scoredProperties.map((property) => ({
        title: property.title,

        type: property.propertyType,

        city: property.location?.city,

        subCity: property.location?.subCity,

        price: property.price,

        currency: property.currency,

        score: property.recommendationScore,

        reasons: property.recommendationReasons.join(", "),
      })),
    );

    console.log(
      "🔥 FINAL RECOMMENDATIONS:",
      recommendations.map((property) => ({
        title: property.title,

        price: property.price,

        score: property.recommendationScore,

        reasons: property.recommendationReasons,
      })),
    );

    /*
     * ==========================================
     * RESPONSE
     * ==========================================
     */

    return NextResponse.json({
      success: true,

      data: recommendations,

      recommendationType: "content-based",

      preferences: {
        location: user.city || null,

        propertyType: user.preferredPropertyType || null,

        minBudget: user.minBudget ?? null,

        maxBudget: user.maxBudget ?? null,

        currency: user.currency || null,
      },
    });
  } catch (error) {
    console.error("❌ Recommendation API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      },
    );
  }
}
