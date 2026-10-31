import PropertyInteraction from "@/models/PropertyInteraction";
import Favorite from "@/models/Favorite";

/**
 * Calculate behavioral similarity between two clients.
 *
 * Views are a weak signal.
 * Favorites are a strong signal.
 */
export async function calculateClientSimilarity(clientAId, clientBId) {
  const [interactionsA, interactionsB, favoritesA, favoritesB] =
    await Promise.all([
      PropertyInteraction.find({
        client: clientAId,
        type: "view",
      })
        .select("property")
        .lean(),

      PropertyInteraction.find({
        client: clientBId,
        type: "view",
      })
        .select("property")
        .lean(),

      Favorite.find({
        client: clientAId,
      })
        .select("property")
        .lean(),

      Favorite.find({
        client: clientBId,
      })
        .select("property")
        .lean(),
    ]);

  const viewsA = new Set(interactionsA.map((item) => String(item.property)));

  const viewsB = new Set(interactionsB.map((item) => String(item.property)));

  const favoritesSetA = new Set(
    favoritesA.map((item) => String(item.property)),
  );

  const favoritesSetB = new Set(
    favoritesB.map((item) => String(item.property)),
  );

  /*
   * Find properties viewed by both clients.
   */
  const commonViews = [...viewsA].filter((propertyId) =>
    viewsB.has(propertyId),
  );

  /*
   * Find properties favorited by both clients.
   */
  const commonFavorites = [...favoritesSetA].filter((propertyId) =>
    favoritesSetB.has(propertyId),
  );

  /*
   * Calculate a simple behavioral similarity.
   *
   * Shared views = 1 point
   * Shared favorites = 3 points
   */
  const sharedScore = commonViews.length + commonFavorites.length * 3;

  const totalUniqueProperties = new Set([
    ...viewsA,
    ...viewsB,
    ...favoritesSetA,
    ...favoritesSetB,
  ]).size;

  if (totalUniqueProperties === 0) {
    return 0;
  }

  /*
   * Normalize to approximately 0–100.
   */
  const similarity = Math.min(
    100,
    Math.round((sharedScore / totalUniqueProperties) * 100),
  );

  return similarity;
}

/**
 * Find clients who behave similarly to the current client.
 */
export async function findSimilarClients(clientId) {
  const otherClients = await PropertyInteraction.distinct("client", {
    client: {
      $ne: clientId,
    },
  });

  const similarClients = [];

  for (const otherClientId of otherClients) {
    const similarity = await calculateClientSimilarity(clientId, otherClientId);

    if (similarity > 0) {
      similarClients.push({
        client: otherClientId,
        similarity,
      });
    }
  }

  similarClients.sort((a, b) => b.similarity - a.similarity);

  return similarClients;
}

/**
 * Get properties interacted with by similar clients.
 */
export async function getCollaborativeProperties(clientId) {
  const similarClients = await findSimilarClients(clientId);

  if (similarClients.length === 0) {
    return [];
  }

  const similarClientIds = similarClients.map((item) => item.client);

  /*
   * Properties viewed by similar clients.
   */
  const interactions = await PropertyInteraction.find({
    client: {
      $in: similarClientIds,
    },
    type: "view",
  })
    .select("client property")
    .lean();

  /*
   * Properties favorited by similar clients.
   */
  const favorites = await Favorite.find({
    client: {
      $in: similarClientIds,
    },
  })
    .select("client property")
    .lean();

  /*
   * Don't recommend properties that the current
   * client has already viewed or favorited.
   */
  const currentViews = await PropertyInteraction.find({
    client: clientId,
    type: "view",
  })
    .select("property")
    .lean();

  const currentFavorites = await Favorite.find({
    client: clientId,
  })
    .select("property")
    .lean();

  const excludedProperties = new Set([
    ...currentViews.map((item) => String(item.property)),
    ...currentFavorites.map((item) => String(item.property)),
  ]);

  /*
   * Score properties based on similar-client behavior.
   */
  const propertyScores = new Map();

  for (const interaction of interactions) {
    const propertyId = String(interaction.property);

    if (excludedProperties.has(propertyId)) {
      continue;
    }

    const similarClient = similarClients.find(
      (item) => String(item.client) === String(interaction.client),
    );

    if (!similarClient) {
      continue;
    }

    const currentScore = propertyScores.get(propertyId) || 0;

    propertyScores.set(propertyId, currentScore + similarClient.similarity);
  }

  /*
   * Favorites have a stronger signal than views.
   */
  for (const favorite of favorites) {
    const propertyId = String(favorite.property);

    if (excludedProperties.has(propertyId)) {
      continue;
    }

    const similarClient = similarClients.find(
      (item) => String(item.client) === String(favorite.client),
    );

    if (!similarClient) {
      continue;
    }

    const currentScore = propertyScores.get(propertyId) || 0;

    propertyScores.set(propertyId, currentScore + similarClient.similarity * 3);
  }

  return [...propertyScores.entries()]
    .map(([property, score]) => ({
      property,
      collaborativeScore: score,
    }))
    .sort((a, b) => b.collaborativeScore - a.collaborativeScore);
}
