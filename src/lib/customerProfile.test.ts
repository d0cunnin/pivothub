import { describe, expect, it } from "vitest";
import { buildCustomerProfile, emptyOrganizationProfile, type IndividualDemographics } from "./customerProfile";

const demographics: IndividualDemographics = {
  gender: ["Female"], ageRange: ["35-44"], maritalStatus: [], lgbtqia: false,
  religiousAffiliation: [], incomeBracket: "", education: [], occupation: [],
};

describe("customer profile helper", () => {
  it.each(["Businesses", "Organizations / nonprofits", "Government agencies", "Other"] as const)("supports %s without leaking individual selections", type => {
    const profile = buildCustomerProfile([type], demographics, { ...emptyOrganizationProfile, decisionMakers: "Procurement director", budget: "$50,000", purchasingProcess: "RFP" });
    expect(profile).toContain(type);
    expect(profile).toContain("Procurement director");
    expect(profile).toContain("$50,000");
    expect(profile).toContain("RFP");
    expect(profile).not.toContain("35-44");
    expect(profile).not.toContain("Female");
  });
  it("supports mixed individual and organizational customers", () => {
    const profile = buildCustomerProfile(["Individuals", "Businesses"], demographics, { ...emptyOrganizationProfile, size: "25 employees" });
    expect(profile).toContain("35-44");
    expect(profile).toContain("25 employees");
  });
  it("excludes organizational details when only individuals are selected", () => {
    expect(buildCustomerProfile(["Individuals"], demographics, { ...emptyOrganizationProfile, size: "25 employees" })).not.toContain("25 employees");
  });
  it("does not append a profile when no customer type is selected", () => {
    expect(buildCustomerProfile([], demographics, emptyOrganizationProfile)).toBe("");
  });
});