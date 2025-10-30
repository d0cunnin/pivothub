/**
 * Tool Credit Costs - Weighted by actual OpenAI token usage
 * 
 * Cost tiers based on estimated token usage:
 * - HIGH (3-5 credits): 5,000-10,000 tokens
 * - MEDIUM (2 credits): 2,000-5,000 tokens
 * - LOW (1 credit): 500-2,000 tokens
 * - FREE (0 credits): No AI generation
 */

export const TOOL_CREDIT_COSTS: Record<string, number> = {
  // HIGH COST TOOLS (3-5 credits) - Complex generation with 5000-10000 output tokens
  'teaching-materials': 5,        // ~10,000 tokens output
  'business-plan': 4,              // ~8,000 tokens output
  'grant-content': 4,              // ~8,000 tokens output
  'pitch-deck': 3,                 // ~6,000 tokens output
  'marketing-strategy': 3,         // ~6,000 tokens output
  'legal-docs': 3,                 // ~6,000 tokens output
  'launch-strategy': 3,            // ~6,000 tokens output
  
  // MEDIUM COST TOOLS (2 credits) - Moderate generation with 2000-5000 output tokens
  'business-idea': 2,              // ~4,000 tokens output
  'social-media': 2,               // ~3,000 tokens output
  'resume-analyzer': 2,            // ~3,000 tokens with feedback
  'interview-feedback': 2,         // ~3,000 tokens with analysis
  'business-foundation': 2,        // ~3,000 tokens output
  'schedule-it': 2,                // ~3,000 tokens output (Schedule It)
  'host-it': 4,                    // ~8,000 tokens output (Host It)
  'biography': 2,                  // ~3,000 tokens output (Business Biography)
  
  // FREE TOOLS (0 credits) - No AI generation
  'contact-chatbot': 0,            // Static logic only, no AI
  'business-resources': 0,         // Google Places API only, no AI
  
  // LOW COST TOOLS (1 credit) - Chatbot interactions only
  'career-advisor': 1,             // Chatbot, ~1,500 tokens per message
  'business-mentor': 1,            // Chatbot, ~1,500 tokens per message
  
  // MEDIUM COST TOOLS (2 credits) - Non-chatbot tools
  'interview-questions': 2,        // ~1,500 tokens output (Prep It)
  'grant-resources': 2,            // Search + formatting (Fund It)
  'name-checker': 2,               // API calls only (Build It)
  'logo-generator': 2,             // Image generation (Build It)
  'startup-checklist': 2,          // Simple generation (Build It)
  
  // ASSESSMENT TOOLS (2 credits) - One-time assessments (Assess It)
  'career-assessment': 2,
  'skills-assessment': 2,
  'personality-assessment': 2,
  
  // EARN IT ASSESSMENT (3 credits total)
  'side-income-assessment': 3,     // Full Earn It assessment
  
  // LEARNING (0 credits) - No AI generation
  'learn-a-skill': 0,              // Video content only, no AI
  'side-income-report': 0,         // Free - generated after assessment
};

export function getToolCreditCost(toolName: string): number {
  return TOOL_CREDIT_COSTS[toolName] || 1; // Default to 1 credit if not found
}

export function getToolCostTier(toolName: string): 'free' | 'low' | 'medium' | 'high' {
  const cost = getToolCreditCost(toolName);
  if (cost === 0) return 'free';
  if (cost === 1) return 'low';
  if (cost === 2) return 'medium';
  return 'high';
}

export function getToolCostBadgeVariant(toolName: string): 'default' | 'secondary' | 'outline' {
  const tier = getToolCostTier(toolName);
  switch (tier) {
    case 'free':
      return 'outline';
    case 'low':
      return 'secondary';
    case 'medium':
    case 'high':
      return 'default';
  }
}
