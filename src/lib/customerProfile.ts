export const customerTypes = ["Individuals", "Businesses", "Organizations / nonprofits", "Government agencies", "Other"] as const;
export type CustomerType = (typeof customerTypes)[number];

export const organizationFields = [
  { key: "sector", label: "Industry, sector, or mission", placeholder: "Healthcare businesses, education nonprofits, public works…" },
  { key: "size", label: "Organization size", placeholder: "Employee count, locations, or population served" },
  { key: "budget", label: "Budget or purchasing capacity", placeholder: "Annual budget or typical spending on your service" },
  { key: "location", label: "Location or service area", placeholder: "Local, regional, national, or specific jurisdictions" },
  { key: "decisionMakers", label: "Decision-makers and buyers", placeholder: "Business owner, program director, procurement officer…" },
  { key: "purchasingProcess", label: "Purchasing process and requirements", placeholder: "Direct purchase, board approval, RFPs, vendor registration…" },
  { key: "needs", label: "Organizational needs and goals", placeholder: "Problems to solve, desired outcomes, or compliance needs" },
] as const;

export type OrganizationProfile = Record<(typeof organizationFields)[number]["key"], string>;
export const emptyOrganizationProfile: OrganizationProfile = {
  sector: "", size: "", budget: "", location: "", decisionMakers: "", purchasingProcess: "", needs: "",
};

export interface IndividualDemographics {
  gender: string[];
  ageRange: string[];
  maritalStatus: string[];
  lgbtqia: boolean;
  religiousAffiliation: string[];
  incomeBracket: string;
  education: string[];
  occupation: string[];
}

export function buildCustomerProfile(types: CustomerType[], demographics: IndividualDemographics, organization: OrganizationProfile): string {
  if (!types.length) return "";
  const sections = [`Customer type: ${types.join(", ")}.`];
  if (types.includes("Individuals")) {
    const fields = [
      ["Gender", demographics.gender.join(", ")],
      ["Age", demographics.ageRange.join(", ")],
      ["Marital Status", demographics.maritalStatus.join(", ")],
      ["Religious Affiliation", demographics.religiousAffiliation.join(", ")],
      ["Income", demographics.incomeBracket],
      ["Education", demographics.education.join(", ")],
      ["Occupation", demographics.occupation.join(", ")],
    ];
    const details = fields.filter(([, value]) => value.trim()).map(([label, value]) => `${label}: ${value}.`);
    if (demographics.lgbtqia) details.push("Inclusive of LGBTQIA+ community.");
    if (details.length) sections.push(`Individual customers:\n${details.join(" ")}`);
  }
  if (types.some(type => type !== "Individuals")) {
    const details = organizationFields.flatMap(({ key, label }) => {
      const value = organization[key].trim();
      return value ? [`${label}: ${value}.`] : [];
    });
    if (details.length) sections.push(`Organizational customers:\n${details.join("\n")}`);
  }
  return sections.join("\n\n");
}