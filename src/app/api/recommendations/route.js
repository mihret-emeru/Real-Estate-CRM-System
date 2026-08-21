import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import User from "@/models/User";
import Property from "@/models/Property";

export async function GET() {
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
     * The portal is available to both:
     * - registered clients
     * - leads who have portal access
     *
     * We will keep the exact lead/client authorization
     * logic consistent with your authentication setup.
     */

    const user = await User.findById(session.user.id).select(
      "city preferredPropertyType minBudget maxBudget currency role",
    );
    console.log("RECOMMENDATION USER:", {
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
     * Get only properties that can currently be purchased.
     */
    const properties = await Property.find({
      status: "available",
    })
      .populate("assignedAgent", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    /*
     * If there are no available properties,
     * return an empty recommendation list.
     */
    if (properties.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        recommendationType: "content-based",
      });
    }

    /*
     * If the user has no meaningful preferences yet,
     * return the newest available properties.
     */
    const hasPreferences =
      Boolean(user.city) ||
      Boolean(user.preferredPropertyType) ||
      user.minBudget != null ||
      user.maxBudget != null;

    if (!hasPreferences) {
      return NextResponse.json({
        success: true,
        data: [],
        recommendationType: "content-based",
        message: "No property preferences found for this user.",
      });
    }

    /*
     * Calculate a content-based recommendation score.
     */
    const scoredProperties = properties.map((property) => {
      let score = 0;

      const reasons = [];

      /*
       * -----------------------------------------
       * CITY MATCH
       * -----------------------------------------
       */
      if (
        user.city &&
        property.location?.city &&
        user.city.toLowerCase() === property.location.city.toLowerCase()
      ) {
        score += 30;

        reasons.push("Matches your preferred city");
      }

      /*
       * -----------------------------------------
       * PROPERTY TYPE MATCH
       * -----------------------------------------
       */
      if (
        user.preferredPropertyType &&
        user.preferredPropertyType !== "other" &&
        property.propertyType === user.preferredPropertyType
      ) {
        score += 30;

        reasons.push("Matches your preferred property type");
      }

      /*
       * -----------------------------------------
       * CURRENCY MATCH
       * -----------------------------------------
       */
      if (user.currency && property.currency === user.currency) {
        score += 10;

        reasons.push("Matches your preferred currency");
      }

      /*
       * -----------------------------------------
       * BUDGET MATCH
       * -----------------------------------------
       */

      const price = Number(property.price) || 0;

      const minBudget = user.minBudget != null ? Number(user.minBudget) : null;

      const maxBudget = user.maxBudget != null ? Number(user.maxBudget) : null;

      if (minBudget !== null && maxBudget !== null) {
        if (price >= minBudget && price <= maxBudget) {
          score += 30;

          reasons.push("Within your preferred budget");
        }
      } else if (maxBudget !== null) {
        if (price <= maxBudget) {
          score += 30;

          reasons.push("Within your maximum budget");
        }
      } else if (minBudget !== null) {
        if (price >= minBudget) {
          score += 30;

          reasons.push("Above your minimum budget");
        }
      }

      return {
        ...property,

        recommendationScore: score,

        recommendationReasons: reasons,
      };
    });

    /*
     * Highest recommendation score first.
     *
     * If two properties have the same score,
     * newest property comes first.
     */
    scoredProperties.sort((a, b) => {
      if (b.recommendationScore !== a.recommendationScore) {
        return b.recommendationScore - a.recommendationScore;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    /*
     * Return the best six recommendations.
     */
    const recommendations = scoredProperties.slice(0, 6);

    return NextResponse.json({
      success: true,

      data: recommendations,

      recommendationType: "content-based",

      preferences: {
        city: user.city || null,
        propertyType: user.preferredPropertyType || null,
        minBudget: user.minBudget ?? null,
        maxBudget: user.maxBudget ?? null,
        currency: user.currency || null,
      },
    });
  } catch (error) {
    console.error("Recommendation API error:", error);

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

