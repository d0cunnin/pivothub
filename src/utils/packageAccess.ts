// Define which tools belong to which subscription packages
export const PACKAGE_TOOLS = {
  'assess-prep-learn': [
    'career-assessment',
    'skills-assessment',
    'personality-assessment',
    'interview-questions',
    'interview-feedback',
    'resume-analyzer',
    'learn-a-skill',
  ],
  'build-teach-launch': [
    'business-mentor',
    'business-plan',
    'business-idea',
    'business-foundation',
    'business-resources',
    'pitch-deck',
    'logo-generator',
    'name-checker',
    'legal-docs',
    'marketing-strategy',
    'social-media',
    'teaching-materials',
    'startup-checklist',
  ],
  'fund-it': [
    'grant-finder',
    'grant-content',
    'grant-resources',
  ],
  'all-access': ['all'],
};

export type SubscriptionPackage = keyof typeof PACKAGE_TOOLS;
export type ToolName = string;

/**
 * Check if a user's subscription package includes access to a specific tool
 */
export function hasToolAccess(
  subscriptionPackage: string | null | undefined,
  toolName: string,
  isSubscribed: boolean = false
): boolean {
  // Free users and trial users get no access to tools
  if (!isSubscribed || !subscriptionPackage) {
    return false;
  }

  // All-access package has access to everything
  if (subscriptionPackage === 'all-access') {
    return true;
  }

  // Check if tool is in the package
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
    return Object.values(PACKAGE_TOOLS)
      .flat()
      .filter(tool => tool !== 'all');
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
