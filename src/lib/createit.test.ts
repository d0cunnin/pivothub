import { describe, it, expect } from "vitest";
import { getToolCreditCost, getToolCostTier } from "@/utils/toolCreditWeights";
import {
  BLUEPRINT_SECTIONS,
  CreateItBlueprint,
  CreateItFormData,
  EMPTY_FORM,
} from "@/types/createit";
import { generateCreateItBlueprintPDF } from "@/lib/CreateItBlueprintPDF";

describe("Create It — credit configuration", () => {
  it("charges 70 credits for the blueprint generator", () => {
    expect(getToolCreditCost("create-it-blueprint")).toBe(70);
  });

  it("is classified as a high-cost tool", () => {
    expect(getToolCostTier("create-it-blueprint")).toBe("high");
  });
});

describe("Create It — blueprint contract", () => {
  it("defines all eleven blueprint sections in order", () => {
    expect(BLUEPRINT_SECTIONS).toHaveLength(11);
    expect(BLUEPRINT_SECTIONS[0].key).toBe("executiveSummary");
    expect(BLUEPRINT_SECTIONS.at(-1)?.key).toBe("aiBuildPrompt");
  });

  it("every section key has a human-readable title", () => {
    for (const section of BLUEPRINT_SECTIONS) {
      expect(section.title.length).toBeGreaterThan(0);
    }
  });

  it("EMPTY_FORM provides defaults for every form field", () => {
    const keys: (keyof CreateItFormData)[] = [
      "appName", "platformDescription", "targetAudience", "primaryPurpose",
      "features", "customFeature", "platformType", "targetPlatforms",
      "monetizationTypes", "pricingInfo", "userJourney", "integrations",
      "customIntegration", "skillLevel",
    ];
    for (const key of keys) {
      expect(EMPTY_FORM[key]).toBeDefined();
    }
    expect(EMPTY_FORM.features).toEqual([]);
  });
});

describe("Create It — PDF generation", () => {
  const form: CreateItFormData = {
    ...EMPTY_FORM,
    appName: "SkillBridge",
    platformDescription: "An AI platform that matches workers to roles.",
    targetAudience: "Entrepreneurs",
    primaryPurpose: "Business",
    features: ["Authentication", "Dashboard", "AI Chatbots"],
    platformType: "Web Application",
    skillLevel: "Intermediate",
  };

  const blueprint: CreateItBlueprint = BLUEPRINT_SECTIONS.reduce((acc, { key }) => {
    acc[key] = `## ${key}\n- A meaningful line of content for ${key}.`;
    return acc;
  }, {} as CreateItBlueprint);

  it("produces a multi-page PDF document without throwing", () => {
    const doc = generateCreateItBlueprintPDF({ form, blueprint, userName: "Test User" });
    expect(doc).toBeTruthy();
    // Cover page + summary + sections should span several pages.
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    const output = doc.output("arraybuffer");
    expect(output.byteLength).toBeGreaterThan(1000);
  });

  it("tolerates missing/empty blueprint sections", () => {
    const partial = { ...blueprint, githubSetup: "", aiBuildPrompt: "" } as CreateItBlueprint;
    expect(() =>
      generateCreateItBlueprintPDF({ form, blueprint: partial }),
    ).not.toThrow();
  });
});
