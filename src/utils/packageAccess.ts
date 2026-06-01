// Define which tools belong to which subscription packages.
// Tool names here must match the `toolName` strings passed to <ToolGuard> and
// the credit-cost keys in toolCreditWeights.ts.

export const PACKAGE_TOOLS = {
  // Assess It + Prep It + Learn It bundle
  'assess-prep-learn': [
    // Assess It
    'career-assessment',
    'skills-assessment',
    'personality-assessment',
    'side-income-assessment',
    'tech-readiness-assessment',
    'community-assessment',
    // Prep It
    'interview-questions',
    'interview-feedback',
    'resume-analyzer',
    'resume-builder',
    'career-advisor',
    // Learn It
    'learn-a-skill',
    'prompt-it',
    'code-it',
    'study-it',
  ],

  // Build It + Teach It + Launch It bundle
  'build-teach-launch': [
    // Build It
    'business-mentor',
    'business-plan',
    'business-idea',
    'business-foundation',
    'business-resources',
    'business-docs',
    'pitch-deck',
    'logo-generator',
    'name-checker',
    'biography',
    'legal-docs',
    'marketing-strategy',
    'social-media',
    'startup-checklist',
    // Teach It
    'teaching-materials',
    'lesson-plan',
    'quiz-generator',
    'rubric-builder',
    // Launch It
    'launch-strategy',
    'speak-it',
    // Plan It side-tools (creative)
    'schedule-it',
    'host-it',
    'garden-it',
    'act-it',
  ],

  // Fund It bundle
  'fund-it': [
    'grant-content',
    'grant-finder',
    'grant-readiness',
    'grant-resources',
    'side-income-assessment',
    'side-income-report',
  ],

  // Contract It + Develop It + Earn It (community/contracts bundle)
  // Reuses build-teach-launch for now; surfaced via all-access.
  // Standalone tools that don't fit a tier yet are listed for All Access only.

  'all-access': ['all'],
};

export type SubscriptionPackage = keyof typeof PACKAGE_TOOLS;
export type ToolName = string;

/**
 * Tools that aren't bundled into any tier yet — only All Access users get them.
 * Explore Mode users still get them (credit-limited), per hasToolAccess() below.
 */
const ALL_ACCESS_ONLY_TOOLS = [
  // Contract It
  'capability-statement',
  'contract-readiness',
  // Develop It
  'program-design',
  'stakeholder-plan',
  'community-dev-coach',
  // Deploy It / Create It
  'deploy-it',
  'create-it-blueprint',
  // Free / utility
  'contact-chatbot',
];

/**
 * Check if a user's subscription package includes access to a specific tool.
 *
 * Explore Mode (free) users have access to all tools, limited by their monthly credits.
 * Credit limits are enforced at usage time, not access time.
 */
export function hasToolAccess(
  subscriptionPackage: string | null | undefined,
  toolName: string,
  isSubscribed: boolean = false
): boolean {
  // Explore Mode users — allow access; credits will gate usage.
  if (!isSubscribed || !subscriptionPackage) {
    return true;
  }

  // All-access package gets everything.
  if (subscriptionPackage === 'all-access') {
    return true;
  }

  const packageTools = PACKAGE_TOOLS[subscriptionPackage as SubscriptionPackage];
  if (!packageTools) {
    return false;
  }

  return packageTools.includes(toolName);
}

/**
 * Get all tools accessible by a subscription package
 */
export function getPackageTools(subscriptionPackage: string | null | undefined): string[] {
  if (!subscriptionPackage) {
    return [];
  }

  if (subscriptionPackage === 'all-access') {
    return Array.from(
      new Set([
        ...Object.values(PACKAGE_TOOLS).flat(),
        ...ALL_ACCESS_ONLY_TOOLS,
      ])
    ).filter(tool => tool !== 'all');
  }

  return PACKAGE_TOOLS[subscriptionPackage as SubscriptionPackage] || [];
}

/**
 * Get the display name for a subscription package
 */
export function getPackageDisplayName(subscriptionPackage: string | null | undefined): string {
  const displayNames: Record<string, string> = {
    'assess-prep-learn': 'Assess It + Prep It + Learn It',
    'build-teach-launch': 'Build It + Teach It + Launch It',
    'fund-it': 'Fund It',
    'all-access': 'All Access Pass',
  };

  return displayNames[subscriptionPackage || ''] || 'No Package';
}
