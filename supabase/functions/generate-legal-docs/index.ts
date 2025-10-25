import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { moderateContent } from "../_shared/moderation.ts";
import { guard, logRequest, corsHeaders } from "../_shared/guard.ts";

serve(async (req) => {
  const startTime = Date.now();
  let userId = 'unknown';
  let ip = 'unknown';
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Apply guard for auth, rate limit, and credit deduction
    const guardResult = await guard(req, {
      endpoint: "generate-legal-docs",
      cost: 3,
      requireAuth: true,
      maxReqsPerMinute: 20
    });
    
    userId = guardResult.userId;
    ip = guardResult.ip;
    
    const { docType, businessName, businessType, state, industry, specifics } = await req.json();

    if (!docType || !businessName || !state) {
      return new Response(
        JSON.stringify({ error: 'Document type, business name, and state are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Moderate content before processing (high-risk: fail-closed)
    const moderationInput = `${businessName} ${businessType || ''} ${industry || ''} ${specifics || ''}`.slice(0, 10000);
    const moderationResult = await moderateContent(moderationInput, 'generate-legal-docs', userId, 'high');
    
    // Check for service unavailability
    if (moderationResult.categories?.includes('moderation_service_unavailable') || 
        moderationResult.categories?.includes('moderation_error')) {
      return new Response(
        JSON.stringify({ 
          error: 'Content safety check temporarily unavailable. Please try again in a few moments.',
          code: 'MODERATION_SERVICE_UNAVAILABLE'
        }), 
        { 
          status: 503, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Check for policy violation
    if (moderationResult.flagged) {
      return new Response(
        JSON.stringify({ 
          error: 'Content violates safety policies',
          message: 'Your submission contains inappropriate content. PivotHub provides ethical legal document generation only.',
          categories: moderationResult.categories 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const openAIApiKey = Deno.env.get('relaunch_openai_key');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    let systemPrompt = '';
    
    if (docType === 'terms-of-service') {
      systemPrompt = `You are a business attorney specializing in creating legal documents for small businesses and startups. Generate professional, comprehensive Terms of Service for:

Business Name: ${businessName}
Business Type: ${businessType || 'General business'}
Industry: ${industry || 'General'}
State: ${state}
Additional Details: ${specifics || 'None provided'}

Create a complete Terms of Service document with these sections:
1. Introduction and Acceptance of Terms
2. Description of Services
3. User Responsibilities and Conduct
4. Intellectual Property Rights
5. Payment Terms (if applicable)
6. Privacy and Data Protection
7. Limitation of Liability
8. Dispute Resolution
9. State-Specific Requirements for ${state}
10. Termination
11. Changes to Terms
12. Contact Information

Include:
• Plain language explanations where possible
• State-specific compliance notes for ${state}
• Industry-specific clauses for ${industry || 'general business'}
• [EDITABLE] markers where business owner needs to customize
• Attorney review disclaimer

Format as clean, professional legal text suitable for a website or app.`;
    } else if (docType === 'privacy-policy') {
      systemPrompt = `You are a privacy law attorney specializing in GDPR, CCPA, and US privacy regulations. Generate a comprehensive Privacy Policy for:

Business Name: ${businessName}
Business Type: ${businessType || 'General business'}
Industry: ${industry || 'General'}
State: ${state}
Additional Details: ${specifics || 'None provided'}

Create a complete Privacy Policy with these sections:
1. Information We Collect
2. How We Use Your Information
3. Information Sharing and Disclosure
4. Data Security Measures
5. Your Privacy Rights (including CCPA and GDPR rights)
6. Cookies and Tracking Technologies
7. Third-Party Services
8. Children's Privacy
9. International Data Transfers
10. State-Specific Rights (${state})
11. Changes to Privacy Policy
12. Contact Information

Include:
• GDPR compliance elements
• CCPA compliance for California users
• State-specific requirements for ${state}
• Clear opt-out instructions
• Data retention policies
• [EDITABLE] markers for customization
• Attorney review recommendation

Format as clear, legally-sound privacy policy.`;
    } else if (docType === 'independent-contractor-agreement') {
      systemPrompt = `You are an employment attorney specializing in contractor agreements. Generate an Independent Contractor Agreement for:

Company: ${businessName}
Industry: ${industry || 'General'}
State: ${state}
Additional Details: ${specifics || 'None provided'}

Create a complete Independent Contractor Agreement with these sections:
1. Parties to Agreement
2. Scope of Services
3. Independent Contractor Status (IRS compliance)
4. Compensation and Payment Terms
5. Work Schedule and Deadlines
6. Expenses and Reimbursement
7. Intellectual Property Ownership
8. Confidentiality and Non-Disclosure
9. Non-Compete (if applicable in ${state})
10. Termination
11. Insurance Requirements
12. State-Specific Requirements for ${state}
13. Dispute Resolution
14. Signatures

Include:
• IRS independent contractor classification criteria
• State-specific contractor laws for ${state}
• IP assignment clauses
• [EDITABLE] sections for terms, rates, scope
• Non-compete enforceability note for ${state}

Format as professional contractor agreement.`;
    } else if (docType === 'nda-mutual') {
      systemPrompt = `You are a business attorney specializing in confidentiality agreements. Generate a Mutual Non-Disclosure Agreement (NDA) for:

Party 1: ${businessName}
Industry: ${industry || 'General'}
State: ${state}
Additional Details: ${specifics || 'None provided'}

Create a complete Mutual NDA with these sections:
1. Parties to Agreement
2. Definition of Confidential Information
3. Obligations of Receiving Party
4. Exclusions from Confidentiality
5. Term and Duration
6. Return of Materials
7. No License Granted
8. Remedies and Injunctive Relief
9. State-Specific Provisions (${state})
10. Miscellaneous (Governing Law, Severability, etc.)
11. Signatures

Include:
• Clear definition of what constitutes confidential information
• Standard exclusions (publicly available, independently developed)
• Reasonable term (typically 2-5 years)
• ${state} governing law provisions
• [EDITABLE] markers for parties, term, scope

Format as enforceable mutual NDA.`;
    } else if (docType === 'nda-one-way') {
      systemPrompt = `You are a business attorney specializing in confidentiality agreements. Generate a One-Way Non-Disclosure Agreement for:

Disclosing Party: ${businessName}
Industry: ${industry || 'General'}
State: ${state}
Additional Details: ${specifics || 'None provided'}

Create a complete One-Way NDA (protecting the disclosing party) with these sections:
1. Parties and Recitals
2. Definition of Confidential Information
3. Obligations of Receiving Party
4. Permitted Uses
5. Exclusions from Confidentiality
6. Term and Duration (typically 2-5 years)
7. Return of Materials
8. No License or Rights Granted
9. Remedies, Injunctive Relief, and Damages
10. State-Specific Provisions (${state})
11. Miscellaneous Provisions
12. Signatures

Include:
• Strong protections for disclosing party
• Clear use restrictions for receiving party
• ${state} law compliance
• Injunctive relief language
• [EDITABLE] sections

Format as protective one-way NDA.`;
    } else if (docType === 'llc-operating-agreement') {
      systemPrompt = `You are a business formation attorney specializing in LLC operating agreements. Generate an Operating Agreement for:

LLC Name: ${businessName}
Industry: ${industry || 'General'}
State: ${state}
Additional Details: ${specifics || 'Single-member or multi-member, management structure, etc.'}

Create a comprehensive LLC Operating Agreement with these sections:
1. Formation and Name
2. Purpose and Powers
3. Members (names, ownership percentages, capital contributions)
4. Management Structure (member-managed or manager-managed)
5. Voting Rights and Procedures
6. Capital Contributions and Distributions
7. Allocation of Profits and Losses
8. Transfer of Membership Interests
9. Dissolution and Winding Up
10. Indemnification
11. Meetings and Records
12. ${state}-Specific Requirements
13. Amendments
14. Signatures

Include:
• ${state} LLC Act compliance
• Flexibility for single or multi-member LLCs
• Buy-sell provisions
• [EDITABLE] sections for members, percentages, structure
• Tax classification considerations

Format as formal operating agreement.`;
    } else {
      throw new Error('Invalid document type');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate the complete ${docType} document following professional legal standards and including all required sections.` }
        ],
        max_completion_tokens: 3500,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate legal document');
    }

    let document = data.choices[0].message.content;

    // Sanitize to remove markdown
    document = document
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .trim();

    // Add disclaimer
    const disclaimer = `\n\n${'='.repeat(80)}\nLEGAL DISCLAIMER\n${'='.repeat(80)}\n\nThis document is provided as a template for informational purposes only and does not constitute legal advice. Laws vary by state and situation. It is strongly recommended that you:\n\n1. Have this document reviewed by a qualified attorney licensed in ${state}\n2. Customize all [EDITABLE] sections to your specific situation\n3. Ensure compliance with current ${state} and federal laws\n4. Update this document as your business and laws change\n\n${businessName} and this AI service do not assume any liability for the use of this template. Consult with a licensed attorney before relying on this document for legal protection.\n\n${'='.repeat(80)}`;

    document += disclaimer;

    // Generate compliance checklist
    const complianceChecklist = {
      state: state,
      docType: docType,
      checklist: generateComplianceChecklist(docType, state)
    };

    return new Response(
      JSON.stringify({ 
        document,
        complianceChecklist,
        docType,
        businessName,
        state
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error generating legal document:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function generateComplianceChecklist(docType: string, state: string): string[] {
  const checklists: { [key: string]: string[] } = {
    'terms-of-service': [
      `Review ${state} consumer protection laws`,
      'Ensure GDPR compliance if serving EU users',
      'Include arbitration clause if desired (check enforceability in ' + state + ')',
      'Add clear refund/cancellation policy',
      'Review with attorney before publishing'
    ],
    'privacy-policy': [
      'Verify CCPA compliance for California users',
      'Ensure GDPR compliance for EU users',
      `Check ${state}-specific privacy requirements`,
      'Update cookie consent mechanism',
      'List all third-party services that collect data',
      'Implement user data deletion process'
    ],
    'independent-contractor-agreement': [
      `Verify contractor classification under ${state} law`,
      'Ensure IRS independent contractor criteria are met',
      `Check non-compete enforceability in ${state}`,
      'Require contractor insurance certificates',
      'Include IP assignment clauses',
      'Set up 1099 filing process'
    ],
    'nda-mutual': [
      'Define confidential information clearly',
      `Verify enforceability under ${state} law`,
      'Set reasonable term (2-5 years typical)',
      'Include return/destruction of materials clause',
      'Consider registering with notary'
    ],
    'nda-one-way': [
      'Ensure protections are reasonable and enforceable',
      `Check ${state} blue pencil doctrine for modifications`,
      'Clearly define permitted uses',
      'Include injunctive relief provisions',
      'Have receiving party sign before disclosure'
    ],
    'llc-operating-agreement': [
      `File Articles of Organization with ${state} Secretary of State`,
      `Comply with ${state} LLC Act requirements`,
      'Obtain EIN from IRS',
      'Choose tax classification (default or S-corp)',
      'Keep copy with corporate records',
      'Review annually and update as needed'
    ]
  };

  return checklists[docType] || [
    `Review with attorney licensed in ${state}`,
    'Customize all template sections',
    'Ensure current law compliance',
    'Store securely with business records'
  ];
}
