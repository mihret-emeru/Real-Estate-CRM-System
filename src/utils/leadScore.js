export const LEAD_SCORE = {
  CLIENT_REGISTRATION: 10,

  COMPLETE_PROFILE: 10,

  PROPERTY_VIEW: 5,

  FAVORITE_PROPERTY: 10,

  PROPERTY_INQUIRY: 15,

  CONTACT_AGENT: 20,

  REQUEST_SHOWING: 30,

  PURCHASE_COMPLETED: 100,
};

export function calculateLeadLevel(score) {
  if (score >= 61) return "hot";

  if (score >= 31) return "warm";

  return "cold";
}

