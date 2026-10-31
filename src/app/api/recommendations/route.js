import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import User from "@/models/User";
import Property from "@/models/Property";
import PropertyInteraction from "@/models/PropertyInteraction";
import Favorite from "@/models/Favorite";

export async function GET() {
  console.log("🔥🔥🔥 HYBRID RECOMMENDATIONS API CALLED 🔥🔥🔥");

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
     * GET CURRENT USER
     * ==========================================
     */

    const user = await User.findById(session.user.id).select(
      "city preferredPropertyType minBudget maxBudget currency role",
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 },
      );
    }

    console.log("🔥 RECOMMENDATION USER:", {
      id: session.user.id,
      role: session.user.role,
      user,
    });

    /*
     * ==========================================
     * GET AVAILABLE PROPERTIES
     * ==========================================
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
      user.preferredPropertyType?.trim().toLowerCase() || null;

    const preferredCurrency = user.currency?.trim().toUpperCase() || null;

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
        recommendationType: "hybrid",

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
        recommendationType: "hybrid",

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
     * STEP 1
     * BUDGET ELIGIBILITY
     * ==========================================
     *
     * Budget is a HARD constraint.
     *
     * A property outside the client's budget
     * can never become a recommendation.
     */

    const budgetEligibleProperties = properties.filter((property) => {
      const price = Number(property.price) || 0;

      if (minBudget !== null && maxBudget !== null) {
        return price >= minBudget && price <= maxBudget;
      }

      if (maxBudget !== null) {
        return price <= maxBudget;
      }

      if (minBudget !== null) {
        return price >= minBudget;
      }

      return true;
    });

    console.log("🔥 BUDGET ELIGIBLE:", budgetEligibleProperties.length);

    if (budgetEligibleProperties.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        recommendationType: "hybrid",

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
     * STEP 2
     * GET CURRENT CLIENT BEHAVIOR
     * ==========================================
     *
     * View     = 1
     * Favorite = 5
     *
     * A favorite means stronger interest than
     * simply viewing a property.
     */

    const [currentViews, currentFavorites] = await Promise.all([
      PropertyInteraction.find({
        client: session.user.id,
        type: "view",
      })
        .select("property")
        .lean(),

      Favorite.find({
        client: session.user.id,
      })
        .select("property")
        .lean(),
    ]);

    const currentViewIds = new Set(
      currentViews.map((item) => String(item.property)),
    );

    const currentFavoriteIds = new Set(
      currentFavorites.map((item) => String(item.property)),
    );

    /*
     * Properties already interacted with.
     */

    const alreadyInteractedIds = new Set([
      ...currentViewIds,
      ...currentFavoriteIds,
    ]);

    console.log("🔥 CURRENT VIEWS:", currentViewIds.size);

    console.log("🔥 CURRENT FAVORITES:", currentFavoriteIds.size);

    /*
     * ==========================================
     * STEP 3
     * CONTENT-BASED SCORE
     * ==========================================
     *
     * Location       = 30
     * Property Type  = 30
     * Currency       = 10
     * Budget         = 30
     *
     * Maximum = 100
     */

    const contentScoredProperties = budgetEligibleProperties.map((property) => {
      let contentScore = 0;

      const reasons = [];

      /*
       * LOCATION MATCH
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
          contentScore += 30;

          reasons.push("Matches your preferred location");
        }
      }

      /*
       * PROPERTY TYPE MATCH
       */

      if (
        preferredPropertyType &&
        preferredPropertyType !== "other" &&
        property.propertyType?.toLowerCase() === preferredPropertyType
      ) {
        contentScore += 30;

        reasons.push("Matches your preferred property type");
      }

      /*
       * CURRENCY MATCH
       */

      if (
        preferredCurrency &&
        property.currency?.toUpperCase() === preferredCurrency
      ) {
        contentScore += 10;

        reasons.push("Matches your preferred currency");
      }

      /*
       * BUDGET MATCH
       *
       * Every property here has already
       * passed the hard budget filter.
       */

      contentScore += 30;

      reasons.push("Within your preferred budget");

      return {
        ...property,

        contentScore,

        recommendationReasons: reasons,
      };
    });

    /*
     * ==========================================
     * STEP 4
     * BUILD ALL CLIENT BEHAVIOR
     * ==========================================
     *
     * Used for traditional collaborative
     * filtering.
     */

    const [allInteractions, allFavorites] = await Promise.all([
      PropertyInteraction.find({
        type: "view",
      })
        .select("client property")
        .lean(),

      Favorite.find({}).select("client property").lean(),
    ]);

    /*
     * clientId -> propertyId -> behavior weight
     */

    const clientBehavior = new Map();

    function addBehavior(clientId, propertyId, weight) {
      const clientKey = String(clientId);
      const propertyKey = String(propertyId);

      if (!clientBehavior.has(clientKey)) {
        clientBehavior.set(clientKey, new Map());
      }

      const behavior = clientBehavior.get(clientKey);

      behavior.set(propertyKey, (behavior.get(propertyKey) || 0) + weight);
    }

    /*
     * Add views.
     */

    for (const interaction of allInteractions) {
      addBehavior(interaction.client, interaction.property, 1);
    }

    /*
     * Add favorites.
     */

    for (const favorite of allFavorites) {
      addBehavior(favorite.client, favorite.property, 5);
    }

    /*
     * Current client's behavior.
     */

    const currentClientBehavior =
      clientBehavior.get(String(session.user.id)) || new Map();

    /*
     * ==========================================
     * STEP 5
     * FIND SIMILAR CLIENTS
     * ==========================================
     *
     * Weighted Jaccard similarity.
     */

    const similarClients = [];

    for (const [otherClientId, otherBehavior] of clientBehavior.entries()) {
      if (otherClientId === String(session.user.id)) {
        continue;
      }

      const allPropertyIds = new Set([
        ...currentClientBehavior.keys(),
        ...otherBehavior.keys(),
      ]);

      let intersection = 0;
      let union = 0;

      for (const propertyId of allPropertyIds) {
        const currentWeight = currentClientBehavior.get(propertyId) || 0;

        const otherWeight = otherBehavior.get(propertyId) || 0;

        intersection += Math.min(currentWeight, otherWeight);

        union += Math.max(currentWeight, otherWeight);
      }

      if (union === 0) {
        continue;
      }

      const similarity = intersection / union;

      if (similarity > 0) {
        similarClients.push({
          clientId: otherClientId,
          similarity,
        });
      }
    }

    similarClients.sort((a, b) => b.similarity - a.similarity);

    const topSimilarClients = similarClients.slice(0, 5);

    console.log(
      "🔥 SIMILAR CLIENTS:",
      topSimilarClients.map((item) => ({
        clientId: item.clientId,
        similarity: Math.round(item.similarity * 100) + "%",
      })),
    );

    /*
     * ==========================================
     * STEP 6
     * COLLABORATIVE PROPERTY SCORES
     * ==========================================
     *
     * Score properties that similar clients
     * interacted with.
     */

    const collaborativeScores = new Map();

    for (const similarClient of topSimilarClients) {
      const behavior = clientBehavior.get(similarClient.clientId);

      if (!behavior) {
        continue;
      }

      for (const [propertyId, interactionWeight] of behavior.entries()) {
        /*
         * Don't recommend properties the
         * current client already interacted with.
         */

        if (alreadyInteractedIds.has(propertyId)) {
          continue;
        }

        /*
         * Budget remains a hard constraint.
         */

        const property = budgetEligibleProperties.find(
          (item) => String(item._id) === propertyId,
        );

        if (!property) {
          continue;
        }

        const weightedScore = similarClient.similarity * interactionWeight;

        collaborativeScores.set(
          propertyId,
          (collaborativeScores.get(propertyId) || 0) + weightedScore,
        );
      }
    }

    /*
     * ==========================================
     * STEP 7
     * SIMILAR-PROPERTY BEHAVIOR
     * ==========================================
     *
     * This is the new layer.
     *
     * The client's own views/favorites are
     * used to discover properties similar to
     * what the client already showed interest in.
     *
     * Property similarity:
     *
     * Property Type = 35
     * Location      = 30
     * Currency      = 10
     * Price         = 25
     *
     * Maximum = 100
     */

    const propertyBehaviorScores = new Map();

    /*
     * Get properties that the current client
     * interacted with.
     */

    const interactedProperties = properties.filter((property) =>
      alreadyInteractedIds.has(String(property._id)),
    );

    console.log("🔥 INTERACTED PROPERTIES:", interactedProperties.length);

    /*
     * Calculate similarity between a candidate
     * property and one property the client
     * previously interacted with.
     */

    function calculatePropertySimilarity(candidate, source) {
      let similarity = 0;

      /*
       * PROPERTY TYPE
       */

      if (
        candidate.propertyType &&
        source.propertyType &&
        candidate.propertyType.toLowerCase() ===
          source.propertyType.toLowerCase()
      ) {
        similarity += 35;
      }

      /*
       * LOCATION
       */

      const candidateCity =
        candidate.location?.city?.trim().toLowerCase() || "";

      const candidateSubCity =
        candidate.location?.subCity?.trim().toLowerCase() || "";

      const candidateAddress =
        candidate.location?.address?.trim().toLowerCase() || "";

      const sourceCity = source.location?.city?.trim().toLowerCase() || "";

      const sourceSubCity =
        source.location?.subCity?.trim().toLowerCase() || "";

      const sourceAddress =
        source.location?.address?.trim().toLowerCase() || "";

      const sameLocation =
        (candidateSubCity &&
          sourceSubCity &&
          candidateSubCity === sourceSubCity) ||
        (candidateCity && sourceCity && candidateCity === sourceCity) ||
        (candidateAddress &&
          sourceAddress &&
          candidateAddress === sourceAddress);

      if (sameLocation) {
        similarity += 30;
      }

      /*
       * CURRENCY
       */

      if (
        candidate.currency &&
        source.currency &&
        candidate.currency.toUpperCase() === source.currency.toUpperCase()
      ) {
        similarity += 10;
      }

      /*
       * PRICE SIMILARITY
       *
       * A property closer in price to something
       * the client liked gets a stronger score.
       */

      const candidatePrice = Number(candidate.price) || 0;

      const sourcePrice = Number(source.price) || 0;

      if (candidatePrice > 0 && sourcePrice > 0) {
        const priceDifference = Math.abs(candidatePrice - sourcePrice);

        const averagePrice = (candidatePrice + sourcePrice) / 2;

        const priceDifferenceRatio = priceDifference / averagePrice;

        /*
         * Same price = 25 points.
         *
         * 10% difference = about 22.5 points.
         * 50% difference = about 12.5 points.
         * 100% difference = 0 points.
         */

        const priceScore = Math.max(0, 25 * (1 - priceDifferenceRatio));

        similarity += priceScore;
      }

      return similarity;
    }

    /*
     * Compare every eligible candidate with
     * the client's previously interacted properties.
     */

    for (const candidate of budgetEligibleProperties) {
      const candidateId = String(candidate._id);

      /*
       * Don't recommend the property that the
       * client already viewed or saved.
       */

      if (alreadyInteractedIds.has(candidateId)) {
        continue;
      }

      let strongestSimilarity = 0;
      let strongestSourceWeight = 0;

      for (const sourceProperty of interactedProperties) {
        const sourceId = String(sourceProperty._id);

        /*
         * Determine whether the source was
         * viewed or favorited.
         */

        const sourceWeight = currentFavoriteIds.has(sourceId) ? 5 : 1;

        const similarity = calculatePropertySimilarity(
          candidate,
          sourceProperty,
        );

        /*
         * Favorite properties are stronger
         * preference signals.
         */

        const weightedSimilarity = similarity * sourceWeight;

        if (weightedSimilarity > strongestSimilarity) {
          strongestSimilarity = weightedSimilarity;

          strongestSourceWeight = sourceWeight;
        }
      }

      if (strongestSimilarity > 0) {
        propertyBehaviorScores.set(candidateId, strongestSimilarity);
      }
    }

    /*
     * Normalize similar-property scores
     * to 0-100.
     */

    const propertyBehaviorValues = [...propertyBehaviorScores.values()];

    const maxPropertyBehaviorScore =
      propertyBehaviorValues.length > 0
        ? Math.max(...propertyBehaviorValues)
        : 0;

    const normalizedPropertyBehaviorScores = new Map();

    for (const [propertyId, rawScore] of propertyBehaviorScores.entries()) {
      const normalizedScore =
        maxPropertyBehaviorScore > 0
          ? Math.round((rawScore / maxPropertyBehaviorScore) * 100)
          : 0;

      normalizedPropertyBehaviorScores.set(propertyId, normalizedScore);
    }

    console.log(
      "🔥 SIMILAR PROPERTY SCORES:",
      [...normalizedPropertyBehaviorScores.entries()]
        .slice(0, 10)
        .map(([propertyId, score]) => ({
          propertyId,
          score,
        })),
    );

    /*
     * ==========================================
     * STEP 8
     * NORMALIZE COLLABORATIVE SCORES
     * ==========================================
     */

    const collaborativeValues = [...collaborativeScores.values()];

    const maxCollaborativeScore =
      collaborativeValues.length > 0 ? Math.max(...collaborativeValues) : 0;

    /*
     * ==========================================
     * STEP 9
     * HYBRID SCORE
     * ==========================================
     *
     * Content-based = 70%
     *
     * Behavioral = 30%
     *
     * Behavioral is split:
     *
     * Similar clients   = 15%
     * Similar properties = 15%
     *
     * Total = 100%
     */

    const hybridProperties = contentScoredProperties.map((property) => {
      const propertyId = String(property._id);

      /*
       * Similar-client score.
       */

      const rawCollaborativeScore = collaborativeScores.get(propertyId) || 0;

      const collaborativeScore =
        maxCollaborativeScore > 0
          ? Math.round((rawCollaborativeScore / maxCollaborativeScore) * 100)
          : 0;

      /*
       * Similar-property score.
       */

      const similarPropertyScore =
        normalizedPropertyBehaviorScores.get(propertyId) || 0;

      /*
       * Final hybrid score.
       *
       * 70% content
       * 15% similar clients
       * 15% similar properties
       */

      const hybridScore = Math.round(
        property.contentScore * 0.7 +
          collaborativeScore * 0.15 +
          similarPropertyScore * 0.15,
      );

      const reasons = [...property.recommendationReasons];

      if (collaborativeScore > 0) {
        reasons.push("Recommended based on similar clients");
      }

      if (similarPropertyScore > 0) {
        reasons.push("Similar to properties you viewed or saved");
      }

      return {
        ...property,

        recommendationScore: hybridScore,

        contentScore: property.contentScore,

        collaborativeScore,

        similarPropertyScore,

        recommendationReasons: reasons,
      };
    });

    /*
     * ==========================================
     * STEP 10
     * REMOVE ALREADY INTERACTED PROPERTIES
     * ==========================================
     */

    const freshRecommendations = hybridProperties.filter(
      (property) => !alreadyInteractedIds.has(String(property._id)),
    );

    /*
     * If the client has already interacted
     * with every eligible property, fall back
     * to the eligible properties.
     */

    const rankingPool =
      freshRecommendations.length > 0 ? freshRecommendations : hybridProperties;

    /*
     * ==========================================
     * STEP 11
     * SORT
     * ==========================================
     */

    rankingPool.sort((a, b) => {
      if (b.recommendationScore !== a.recommendationScore) {
        return b.recommendationScore - a.recommendationScore;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    /*
     * ==========================================
     * STEP 12
     * TOP 6
     * ==========================================
     */

    const recommendations = rankingPool.slice(0, 6);

    /*
     * ==========================================
     * DEBUG
     * ==========================================
     */

    console.log("🔥🔥🔥 HYBRID RECOMMENDATION RESULTS 🔥🔥🔥");

    console.table(
      rankingPool.map((property) => ({
        title: property.title,

        price: property.price,

        type: property.propertyType,

        location: property.location?.subCity || property.location?.city,

        contentScore: property.contentScore,

        collaborativeScore: property.collaborativeScore,

        similarPropertyScore: property.similarPropertyScore,

        finalScore: property.recommendationScore,

        reasons: property.recommendationReasons.join(", "),
      })),
    );

    console.log(
      "🔥 FINAL TOP 6:",
      recommendations.map((property) => ({
        title: property.title,

        price: property.price,

        contentScore: property.contentScore,

        collaborativeScore: property.collaborativeScore,

        similarPropertyScore: property.similarPropertyScore,

        recommendationScore: property.recommendationScore,

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

      recommendationType: "hybrid",

      algorithm: {
        contentBasedWeight: 70,

        collaborativeWeight: 30,

        collaborativeBreakdown: {
          similarClientsWeight: 15,
          similarPropertiesWeight: 15,
        },
      },

      preferences: {
        location: user.city || null,

        propertyType: user.preferredPropertyType || null,

        minBudget: user.minBudget ?? null,

        maxBudget: user.maxBudget ?? null,

        currency: user.currency || null,
      },

      collaborativeFiltering: {
        enabled:
          topSimilarClients.length > 0 || interactedProperties.length > 0,

        similarClients: topSimilarClients.length,

        interactedProperties: interactedProperties.length,

        interactionSignals: {
          viewWeight: 1,
          favoriteWeight: 5,
        },
      },
    });
  } catch (error) {
    console.error("❌ Hybrid recommendation API error:", error);

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
