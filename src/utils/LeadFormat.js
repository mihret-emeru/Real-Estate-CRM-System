export function formatLeadSource(source) {
  const sources = {
    facebook_ad: "Facebook Ad",
    client_registration: "Client Registration",
    phone_call: "Phone Call",
    office_visit: "Office Visit",
    referral: "Referral",
    website: "Website",
  };

  return sources[source] || source;
}

