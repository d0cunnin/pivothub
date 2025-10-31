// Define which tools belong to which subscription packages
export const PACKAGE_TOOLS = {
  'assess-prep-learn': [
    'career-assessment',
    'skills-assessment',
    'personality-assessment',
    'side-income-assessment',
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
    'side-income-assessment',
    'launch-strategy',
    'schedule-it',
    'host-it',
  ],
  'fund-it': [
    'grant-content',        // LOI & Grant Proposal Generator (5 credits)
    'side-income-assessment', // Side Income Assessment (2 credits)
  ],
  'all-access': ['all'],
};

export type SubscriptionPackage = keyof typeof PACKAGE_TOOLS;
export type ToolName = string;

/**
 * Check if a user's subscription package includes access to a specific tool
 * 
 * Note: Explore Mode (free) users have access to all tools, but usage is limited 
 * by their 5 monthly credits. Credit limits are enforced at usage time, not access time.
 */
export function hasToolAccess(
  subscriptionPackage: string | null | undefined,
  toolName: string,
  isSubscribed: boolean = false
): boolean {
  // Explore Mode users (free tier) have access to all tools, limited by credits
  // Credit enforcement happens in the usage check, not here
  if (!isSubscribed || !subscriptionPackage) {
    return true; // Allow access, credits will limit usage
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
