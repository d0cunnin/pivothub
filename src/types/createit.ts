// Shared types for the CREATE IT — AI Platform Blueprint Generator.

export interface CreateItFormData {
  // Step 1 — Platform Overview
  appName: string;
  platformDescription: string;
  targetAudience: string;
  primaryPurpose: string;
  // Step 2 — Core Features
  features: string[];
  customFeature: string;
  // Step 3 — Platform Type
  platformType: string;
  targetPlatforms: string[];
  // Step 4 — Monetization
  monetizationTypes: string[];
  pricingInfo: string;
  // Step 5 — User Journey
  userJourney: string;
  // Step 6 — Integrations
  integrations: string[];
  customIntegration: string;
  // Step 7 — Builder Skill Level
  skillLevel: string;
}

// Ordered list of the markdown sections the AI returns.
export const BLUEPRINT_SECTIONS: { key: keyof CreateItBlueprint; title: string }[] = [
  { key: "executiveSummary", title: "Executive Summary" },
  { key: "technologyStack", title: "Recommended Technology Stack" },
  { key: "databaseArchitecture", title: "Database Architecture" },
  { key: "applicationArchitecture", title: "Application Architecture" },
  { key: "userFlow", title: "User Flow" },
  { key: "integrations", title: "Integrations" },
  { key: "monetizationStrategy", title: "Monetization Strategy" },
  { key: "developmentRoadmap", title: "Development Roadmap" },
  { key: "buildInstructions", title: "Build Instructions" },
  { key: "githubSetup", title: "GitHub Setup Guide" },
  { key: "aiBuildPrompt", title: "AI Build Prompt" },
];

export interface CreateItBlueprint {
  executiveSummary: string;
  technologyStack: string;
  databaseArchitecture: string;
  applicationArchitecture: string;
  userFlow: string;
  integrations: string;
  monetizationStrategy: string;
  developmentRoadmap: string;
  buildInstructions: string;
  githubSetup: string;
  aiBuildPrompt: string;
}

export const EMPTY_FORM: CreateItFormData = {
  appName: "",
  platformDescription: "",
  targetAudience: "",
  primaryPurpose: "",
  features: [],
  customFeature: "",
  platformType: "",
  targetPlatforms: [],
  monetizationTypes: [],
  pricingInfo: "",
  userJourney: "",
  integrations: [],
  customIntegration: "",
  skillLevel: "",
};
