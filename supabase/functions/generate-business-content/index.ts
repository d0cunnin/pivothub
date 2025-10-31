import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { guard, logRequest, corsHeaders } from "../_shared/guard.ts";
import { moderateContent } from "../_shared/moderation.ts";

// Validation schema
const businessContentSchema = z.object({
  type: z.enum(['business-ideas', 'business-plan', 'pitch-deck', 'legal-docs', 'biography']),
  data: z.record(z.any()).refine((obj) => Object.keys(obj).length <= 50, "Data must contain at most 50 fields")
});

serve(async (req) => {
  const startTime = Date.now();
  let userId = 'unknown';
  let ip = 'unknown';
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Apply guard for auth, rate limit, and credit deduction
    const guardResult = await guard(req, {
      endpoint: "generate-business-content",
      cost: 3,
      requireAuth: true,
      maxReqsPerMinute: 20
    });
    
    userId = guardResult.userId;
    ip = guardResult.ip;
    
    const rawBody = await req.json();
    
    // Validate input
    const validation = businessContentSchema.safeParse(rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.format() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { type, data } = validation.data;
    
    // Moderate content before processing (high-risk: fail-closed)
    const moderationInput = JSON.stringify(data).slice(0, 10000);
    const moderationResult = await moderateContent(moderationInput, 'generate-business-content', userId, 'high');
    
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
          message: 'Your submission contains inappropriate content. PivotHub provides ethical business planning services only.',
          categories: moderationResult.categories 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const openaiApiKey = Deno.env.get('relaunch_openai_key')
    if (!openaiApiKey) {
      throw new Error('relaunch_openai_key not found in environment variables')
    }

    let prompt = ''
    let systemMessage = 'You are a PROFESSIONAL TECHNICAL WRITER with 25+ years of experience crafting executive-level biographies, vision statements, and mission statements for Fortune 500 executives, founders, and organizations. Your writing is polished, professional, and appropriate for investor materials, board presentations, and high-stakes communications. CRITICAL WRITING STANDARDS: 1) Use ONLY executive-level language, 2) NEVER use em-dashes (—), 3) NEVER use contractions (write "do not" instead of "don\'t"), 4) Maintain formal, professional tone unless otherwise specified. Provide responses in clean, plain text format without markdown formatting.'

    switch (type) {
      case 'business-ideas':
        prompt = `Generate 5 personalized business ideas based on:
Skills: ${data.skills}
Interests: ${data.interests}
Budget: ${data.budget}

For EACH business idea, provide:
1. Business concept and why it fits their profile (2-3 sentences)
2. VALIDATION TOOLS to test the idea:
   • Market Research: Google Trends (free), Answer The Public (free), SimilarWeb
   • Competitor Analysis: SEMrush, Ahrefs, SimilarWeb
   • Survey Tools: Typeform, SurveyMonkey, Google Forms (free)
3. MVP BUILDING TOOLS:
   • No-Code Platforms: Bubble, Webflow, Softr, Airtable
   • Landing Pages: Carrd ($19/year), Unbounce, Instapage
   • E-commerce: Shopify (14-day trial), Gumroad (digital), Etsy
4. EARLY CUSTOMER CHANNELS:
   • Launch Platforms: Product Hunt, BetaList, Hacker News
   • Communities: Reddit, indie hacker forums
5. ESTIMATED STARTUP COSTS with specific tool costs

Format as simple numbered list without markdown. Each idea should include concept, validation approach, tools needed, and costs.`
        break

      case 'business-plan':
        prompt = `PIVOTHUB MASTER PROMPT FRAMEWORK - BUSINESS PLAN GENERATOR

=== CONTEXT RETENTION PROTOCOL ===
Remember ALL business details provided. Cross-reference user data across all sections. Personalize every recommendation to their specific business type, industry, target market, and budget. Never use generic business plan language.

=== CORE IDENTITY ===
You are a senior business consultant and strategic advisor who has written 500+ business plans that have raised over $200M in funding and launched successful businesses across all industries.

=== QUALITY STANDARDS ($3,000+ CONSULTING VALUE) ===
• This business plan must rival a $3,000+ professional consulting deliverable
• Every section must be detailed, specific, and actionable
• Include actual numbers, timelines, and financial projections
• Provide industry-specific insights and competitive intelligence
• All recommendations must be implementable within stated timeline
• Zero placeholders - all examples must be complete and realistic

=== CHAIN-OF-THOUGHT REASONING ===
Before creating the plan, analyze:
1. What's the realistic market opportunity for ${data.businessType} in ${data.industry}?
2. What are 3 critical success factors for this specific business?
3. What's the optimal go-to-market strategy given ${data.startupCosts} budget?
4. What are the top 3 risks and realistic mitigation strategies?
5. What's the most compelling narrative for investors/lenders?

=== ERROR PREVENTION ===
• NEVER use placeholders like "[Insert company name]" or "[Add detail]"
• All financial projections must be realistic for ${data.industry}
• All competitor examples must be real or highly specific
• All timelines must account for real-world constraints
• All resource recommendations must be real tools/services with costs
• All metrics must be industry-standard KPIs

=== INDUSTRY-SPECIFIC INTELLIGENCE ===
For ${data.industry} / ${data.businessType}, provide:
• Industry-specific KPIs and success metrics
• Typical profit margins and unit economics for this business model
• Common pitfalls in this industry (with failure rate statistics)
• Regulatory requirements and compliance considerations
• Industry-specific tools, platforms, and technology stack
• Real competitor examples and market positioning
• Network effects and strategic partnerships in this sector
• Current industry trends and future outlook

=== COMPETITIVE DIFFERENTIATION (INVESTOR-GRADE DETAIL) ===
Provide analysis that impresses investors:
• Detailed competitive positioning and defensible moats
• Unit economics breakdown with industry benchmarks
• Customer acquisition cost analysis with channel-specific CAC
• Lifetime value modeling with cohort retention curves
• Financial sensitivity analysis (best/base/worst case)
• Strategic inflection points and milestone triggers
• Exit strategy options with comparable transactions

=== SAFETY & CONTENT RESTRICTIONS ===
Refuse requests for: Illegal businesses, pyramid schemes, deceptive practices, or unethical business models. Respond: "I can't provide guidance on that business type. PivotHub provides ethical business planning only."

Create a COMPREHENSIVE, investor-grade business plan for:

BUSINESS DETAILS:
• Business Name: ${data.businessName}
• Industry: ${data.industry}
• Business Type: ${data.businessType}
• Target Market: ${data.targetMarket}
• Value Proposition: ${data.uniqueValue}
• Startup Costs: ${data.startupCosts}
• Business Model: ${data.businessModel}

This business plan must be detailed, professional, and actionable - worth $3,000+ of consulting value.

=== RESOURCE RECOMMENDATIONS PROTOCOL ===
For EVERY section, include specific tools, platforms, and resources to implement the advice:
• MUST include tool names with pricing tiers (free, $X/month, $Y/month)
• MUST provide website URLs when recommending platforms
• MUST differentiate free vs paid options clearly
• MUST organize by budget level (bootstrapped, moderate, well-funded)
• MUST include alternative options (e.g., "Use QuickBooks ($30/month) OR Wave (free)")

REQUIRED RESOURCE CATEGORIES:
• Business Registration: LegalZoom, Incfile, state-specific websites
• Accounting/Finance: QuickBooks, FreshBooks, Wave (free), Bench
• Marketing: HubSpot, Mailchimp (free tier), Canva (free), Buffer, Hootsuite
• Website Building: WordPress, Wix, Squarespace, Shopify (e-commerce)
• CRM: Salesforce, HubSpot CRM (free), Zoho, Pipedrive
• Project Management: Asana, Trello (free basic), Monday.com, ClickUp
• Communication: Slack (free basic), Microsoft Teams, Zoom
• Payment Processing: Stripe, Square, PayPal, Wise (international)

=======
STRUCTURE - Include ALL of these sections with substantial detail:
=======

1. EXECUTIVE SUMMARY (2-3 paragraphs)
• Business concept and unique value in 2-3 sentences
• Market opportunity size and current growth trends
• Competitive advantage and defensibility
• Financial highlights (3-year revenue projection, profitability timeline, funding needs)
• Key success factors
[Make this compelling enough that an investor would read further]

2. BUSINESS DESCRIPTION (3-4 paragraphs)
• Detailed explanation of ${data.businessName} and what problem it solves
• Origin story and founder motivation if applicable
• Legal structure (recommend specific entity type with justification)
• Location and facilities requirements
• Products/services offered in detail
• Current stage and traction
• Mission, vision, and core values aligned with ${data.businessType}
• Long-term strategic goals (3-5 year vision)

3. MARKET ANALYSIS

Industry Overview:
• ${data.industry} current industry analysis
• Market size: TAM, SAM, SOM with specific numbers
• Growth rate and trends (past 5 years and next 5 years)
• Key industry drivers and dynamics
• Regulatory environment and compliance requirements
• Technology trends affecting ${data.industry}
• Industry challenges and opportunities

Target Market Deep Dive:
• Primary customer segment: ${data.targetMarket}
  - Demographics with specific characteristics
  - Psychographics (values, behaviors, pain points)
  - Geographic distribution
  - Size of segment (number of potential customers)
  - Buying behaviors and decision criteria
  - Price sensitivity and willingness to pay

• Secondary customer segments if applicable
  [Same detail for 2-3 additional segments]

Market Needs Analysis:
• Unmet needs in ${data.industry}
• Pain points ${data.targetMarket} currently experience
• How existing solutions fall short
• Why timing is right for this business now
• Market gaps this business will fill

4. COMPETITIVE ANALYSIS

Direct Competitors:
• Competitor 1: [Name, strengths, weaknesses, market share]
• Competitor 2: [Same detail]
• Competitor 3: [Same detail]
[Analyze 5-7 direct competitors]

Indirect Competitors:
• [Alternative solutions customers currently use]
• [Substitute products or services]

Competitive Advantages:
• Advantage 1: [Specific differentiation with proof points]
• Advantage 2: [Unique capability competitors can't replicate]
• Advantage 3: [Resource or relationship advantage]
• Advantage 4: [Technology or process advantage]
• Advantage 5: [Brand or positioning advantage]

Competitive Positioning:
• How ${data.businessName} is uniquely positioned
• Value proposition vs competitors
• Defensible moats being built
• Competitive response playbook

Barriers to Entry:
• [Barrier 1 protecting market position]
• [Barrier 2 making it hard for new entrants]
• First-mover advantages if applicable

5. PRODUCTS & SERVICES

Core Offerings:
• Product/Service 1: ${data.businessType}
  - Detailed description (features and benefits)
  - Pricing: $X with justification
  - Production/delivery process
  - Unique selling points
  - Development stage

• Product/Service 2 if applicable
  [Same detail]

Product Development Roadmap:
• Current: [What's available now]
• 6 months: [Enhancements and new features]
• 12 months: [Major product expansion]
• 24 months: [Strategic product evolution]

Intellectual Property:
• Trademarks: [What to trademark and when]
• Patents: [If applicable]
• Trade secrets: [Proprietary processes or data]
• Copyrights: [Creative assets to protect]

Suppliers & Partners:
• Key supplier 1: [Name, what they provide, terms]
• Key supplier 2: [Same detail]
• Strategic partners: [Partnerships that enhance offering]

Quality Control:
• Quality assurance processes
• Customer satisfaction mechanisms
• Continuous improvement approach

6. MARKETING & SALES STRATEGY

Brand Positioning:
• Brand personality and voice
• Key messaging pillars
• Tagline and positioning statement
• Visual identity approach

MARKETING TOOLS BY CHANNEL:
• Social Media Management: Buffer (free basic), Hootsuite ($49+/month), Later ($18+/month)
• Design Tools: Canva (free), Adobe Creative Cloud ($55/month), Figma (free)
• Email Marketing: Mailchimp (free <2K), ConvertKit ($9+/month), Klaviyo (email + SMS)
• SEO Tools: Google Analytics (free), Google Search Console (free), Ahrefs ($99+/month), SEMrush ($120+/month)
• Content Creation: Grammarly (free/$12/month), Hemingway Editor (free), Jasper AI ($39+/month)
• CRM Systems: HubSpot CRM (free), Pipedrive ($14+/user), Salesforce ($25+/user), Zoho CRM (free tier)
• Landing Pages: Unbounce ($90+/month), Leadpages ($37+/month), Carrd ($19/year)
• Analytics: Google Analytics (free), Mixpanel (free tier), Amplitude (free tier)

Marketing Channels (Prioritized):
1. [Channel 1 - e.g., "Digital Marketing - SEO & Content"]
   • Specific tactics and implementation
   • Budget allocation: $X/month
   • Expected ROI and metrics
   • Timeline to results

2. [Channel 2]
   [Same detail for 7-10 channels]

Customer Acquisition Strategy:
• CAC target: $X
• Acquisition funnel stages and conversion rates
• Lead generation tactics with volumes
• Nurture process and timeline
• Conversion strategies

Sales Process:
• Sales cycle length: X days/weeks
• Sales methodology (consultative, transactional, etc.)
• Sales team structure and compensation
• CRM and sales tools
• Key sales metrics and targets

Pricing Strategy:
• Pricing model: [subscription, one-time, tiered, etc.]
• Price points with justification
• Competitor price comparison
• Discount and promotion strategy
• Price optimization plan

Customer Retention:
• Onboarding process
• Customer success approach
• Retention metrics target: X% per year
• Upsell and cross-sell strategy
• Loyalty programs

12-Month Marketing Budget:
• Channel 1: $X (X% of budget)
• Channel 2: $X (X% of budget)
[Break down full marketing budget by channel]
Total Year 1 Marketing: $X

7. OPERATIONS PLAN

Location & Facilities:
• Physical location requirements
• Remote vs office strategy
• Equipment and technology needs
• Costs: $X setup, $X monthly

Production/Service Delivery:
• Step-by-step process for delivering ${data.businessType}
• Capacity planning (units per month)
• Scalability approach
• Quality control measures
• Technology stack and systems

OPERATIONS TOOLS & RESOURCES:
• Project Management: Asana (free basic), Trello (free), Monday.com ($8+/user), ClickUp (free tier)
• Communication: Slack (free basic), Microsoft Teams, Zoom ($15/month), Google Workspace ($6-18/user)
• Document Management: Google Drive (free 15GB), Dropbox ($12/month), Notion (free personal)
• Accounting: QuickBooks ($30-200/month), Wave (free), FreshBooks ($17+/month), Xero ($13+/month)
• Payment Processing: Stripe (2.9% + 30¢), Square (2.6% + 10¢), PayPal (2.9% + 30¢)
• E-commerce Platforms: Shopify ($29-299/month), WooCommerce (free plugin), BigCommerce ($29+/month)
• Email Marketing: Mailchimp (free <2K contacts), ConvertKit ($9+/month), SendGrid (free 100/day)

Supply Chain:
• Suppliers and vendors with backup options
• Inventory management approach
• Lead times and order quantities
• Supply chain risks and mitigation

Staffing Plan:

Year 1 Team:
• Founder(s): [Roles and time commitment]
• Hire 1: [Position] - Month X - Salary: $X - Responsibilities
• Hire 2: [Position] - Month X - Salary: $X - Responsibilities
[Detail first 3-5 hires]

Year 2-3 Team Growth:
• [Additional roles and timing]
• Organizational chart evolution
• Total headcount: X employees by Year 3

Outsourcing Strategy:
• Functions to outsource: [Accounting, legal, etc.]
• Contractor needs and costs
• When to bring in-house

Key Metrics & KPIs:
• Operational efficiency metrics
• Unit economics targets
• Customer service metrics
• Quality metrics

8. MANAGEMENT & ORGANIZATION

Founder(s):
• [Name]: Background, expertise, role, %equity
• [If co-founders, same detail]
• Why this team is uniquely qualified
• Gaps in team and hiring plan

Advisory Board:
• Advisor 1: [Name if known, or profile] - Expertise
• Advisor 2: [Same]
• Advisor 3: [Same]
• Advisor equity/compensation: X%

Board of Directors:
• Structure and composition
• Meeting cadence
• Key responsibilities

Organizational Culture:
• Core values in action
• Work environment and policies
• Decision-making approach
• Performance management

Legal Structure:
• Entity type: [LLC, C-Corp, etc.] - Why this structure
• State of incorporation
• Cap table and equity distribution
• Vesting schedules

9. FINANCIAL PROJECTIONS

Assumptions:
• [Key assumption 1 with justification]
• [Key assumption 2]
• [Assumption 3]
[List 10-15 critical assumptions]

Startup Costs Breakdown:
• Legal & registration: $X
• Initial inventory: $X (if applicable)
• Equipment & technology: $X
• Marketing & branding: $X
• Website & digital assets: $X
• Insurance: $X
• Working capital: $X
• Contingency (10%): $X
Total Startup Capital: ${data.startupCosts}

Revenue Model:
• Revenue stream 1: [Description] - % of total revenue
• Revenue stream 2: [Description] - % of total revenue
• Pricing: $X per [unit, month, transaction]
• Volume assumptions: X units/customers per month

3-Year Financial Projections:

YEAR 1:
Month-by-Month for first 12 months:
• Month 1: Revenue $X, Expenses $X, Profit/Loss ($X)
• Month 2: Revenue $X, Expenses $X, Profit/Loss ($X)
[Detail all 12 months]

Year 1 Summary:
• Total Revenue: $X
• Total Expenses: $X
• Net Profit/Loss: ($X)
• Key metrics: X customers, X units sold, X% growth

YEAR 2:
Quarterly breakdown:
• Q1: Revenue $X, Profit $X
• Q2: Revenue $X, Profit $X
• Q3: Revenue $X, Profit $X
• Q4: Revenue $X, Profit $X

Year 2 Summary:
• Total Revenue: $X
• Total Expenses: $X
• Net Profit: $X
• Year-over-year growth: X%

YEAR 3:
Quarterly breakdown:
[Same structure]

Year 3 Summary:
• Total Revenue: $X
• Net Profit: $X
• Profit margin: X%

Break-Even Analysis:
• Break-even point: Month X or $X in revenue
• Fixed costs: $X/month
• Variable costs: X% of revenue
• Contribution margin: X%

Cash Flow Projections:
• Opening cash: $X
• Monthly burn rate: $X (first 12 months)
• Cash runway: X months
• When additional funding needed: Month X
• Minimum cash balance: $X

Unit Economics:
• Customer Acquisition Cost (CAC): $X
• Lifetime Value (LTV): $X
• LTV:CAC Ratio: X:1
• Gross margin: X%
• Payback period: X months

Key Financial Metrics:
• Monthly Recurring Revenue (if applicable): $X by Month 12
• Annual Recurring Revenue: $X
• Customer churn: X%
• Revenue per customer: $X

10. FUNDING REQUIREMENTS

Capital Needed: ${data.startupCosts}

Use of Funds:
• Operations (X%): $X - [Specific use]
• Marketing (X%): $X - [Specific campaigns]
• Product Development (X%): $X - [Specific features]
• Team (X%): $X - [Specific hires]
• Working Capital (X%): $X - [Buffer]
• Legal/Professional (X%): $X - [Specific services]

Funding Sources:
1. [Source 1]: $X - Terms and timeline
2. [Source 2]: $X - Terms and timeline
3. [Source 3]: $X - Terms and timeline

Return on Investment:
• Expected valuation: $X in Year 3
• Investor return: X multiple
• Exit opportunities: [M&A targets, IPO potential, etc.]

Future Funding Needs:
• Series A timing: [When and why]
• Amount needed: $X
• Milestones to achieve first: [Specific metrics]

11. RISK ANALYSIS

Critical Risks & Mitigation:

Market Risks:
• Risk 1: [Specific market risk for ${data.industry}]
  - Probability: High/Medium/Low
  - Impact: High/Medium/Low
  - Mitigation: [3-4 specific strategies]
  - Contingency: [What to do if it happens]

• Risk 2: [Competition risk]
  [Same structure for 3-4 market risks]

Operational Risks:
• [Supply chain, production, key person, etc.]
  [Same structure for 3-4 operational risks]

Financial Risks:
• [Cash flow, pricing, unit economics, etc.]
  [Same structure for 3-4 financial risks]

Strategic Risks:
• [Market timing, technology, regulatory, etc.]
  [Same structure for 3-4 strategic risks]

Risk Monitoring:
• Key indicators to watch
• Early warning signs
• Quarterly risk review process

Insurance Coverage:
• General liability: $X coverage - Cost: $X/year
• Professional liability: $X coverage - Cost: $X/year
• [Other relevant insurance]

12. MILESTONES & TIMELINE

90-Day Milestones:
• Day 1-30: [Specific achievements]
• Day 31-60: [Specific achievements]
• Day 61-90: [Specific achievements]

6-Month Milestones:
• Revenue: $X
• Customers: X
• Product: [Development stage]
• Team: [Hiring progress]
• Marketing: [Key metric]

12-Month Milestones:
• Revenue: $X
• Customers: X
• Market share: X%
• Product: [Version 2.0 or expansion]
• Funding: [Next round or profitability]

Year 2-3 Strategic Goals:
• [Major milestone 1 with metric]
• [Major milestone 2 with metric]
• [Major milestone 3 with metric]

13. EXIT STRATEGY

Potential Exit Paths:
1. [Exit path 1 - e.g., "Acquisition by strategic buyer"]
   • Likely acquirers in ${data.industry}
   • Typical valuation multiples: XxRevenue or XxEBITDA
   • Timeline: Year X
   • Value creation focus: [What increases acquisition value]

2. [Exit path 2]
   [Same detail]

3. [Exit path 3]
   [Same detail]

Value Creation Strategy:
• [What makes this business attractive to buyers]
• [Strategic assets to build]
• [Market position to achieve]

14. CONCLUSION & CALL TO ACTION

Summary:
• Recap the opportunity: [2-3 sentences]
• Why this business will succeed: [3-4 key reasons]
• Competitive advantages: [Core differentiators]
• Financial potential: [3-year outlook]

Next Steps:
• Immediate actions: [Week 1 priorities]
• 30-day goals: [First month milestones]
• Funding approach: [Capital raising timeline]

Investment Opportunity (if seeking funding):
• Amount: $X
• Terms: [Equity, debt, etc.]
• Expected return: [Multiple and timeline]
• Contact: [How to get involved]

=======
FORMATTING RULES:
=======
• Use clear section headers
• Bullet points (•) for all lists
• NO markdown (###, **, *)
• Specific numbers and data throughout
• Professional, confident tone
• Every claim backed by logic or data
• Comprehensive yet scannable
• Ready to present to investors or lenders`
        break

      case 'marketing-strategy':
        prompt = `=== MARKETING LEGEND IDENTITY ===
You are a WORLD-CLASS MARKETING SPECIALIST with:
- 25+ years of marketing strategy and execution experience across Fortune 500 companies and startups
- $200M+ portfolio of successful campaigns generating measurable ROI
- Global marketing firm with teams across 20+ countries
- Deep expertise in marketing psychology and consumer behavior
- Mastery of digital marketing across all channels and platforms
- Track record of creating strategies that generate real results when properly implemented

=== MARKETING PSYCHOLOGY EXPERTISE ===
You understand the science behind why customers buy:
- Consumer decision-making psychology (Cialdini's 6 principles of influence)
- Emotional triggers that drive purchases (fear, desire, urgency, scarcity, social proof)
- Brand positioning and perception management (Ries & Trout positioning theory)
- Customer journey mapping and touchpoint optimization
- Behavioral economics and choice architecture (Kahneman & Tversky)
- Storytelling frameworks that convert (StoryBrand, Hero's Journey)
- Neuroscience of marketing (limbic system activation, dopamine loops)

=== BEGINNER-FRIENDLY APPROACH ===
This strategy is designed for someone with ZERO marketing experience:
- Every step explained in simple, actionable terms (no jargon or assumed knowledge)
- Specific tools recommended with exact pricing and links
- Templates and frameworks provided
- Common mistakes highlighted and how to avoid them
- Hand-holding through implementation with day-by-day guidance
- Focus on strategies that work with limited budgets

=== CLIENT DETAILS ===
Business Type: ${data.businessType}
Target Market: ${data.targetMarket}
Budget: ${data.budget}
Goals: ${data.goals}
Current Stage: ${data.currentStage || 'Early stage'}

=== COMPREHENSIVE MARKETING STRATEGY OUTPUT ===

Create a professional marketing strategy document worth $5,000+ in consulting value.

STRATEGIC FOUNDATION
• Brand Positioning Statement: One sentence that defines who you are, what you do, who it's for, and why it matters
• Unique Value Proposition (UVP): What makes you different from competitors (based on customer psychology)
• Brand Personality: How you want customers to perceive you (5 descriptive words)
• Core Messaging Pillars: 3 key messages that resonate with target audience psychology

CUSTOMER PERSONA DEVELOPMENT (Psychology-Based)
Create 2-3 detailed customer personas:

PERSONA 1: [Name] (Primary Target)
Demographics:
• Age range, gender, income level, location, education, job title

Psychographics:
• Values and beliefs (what drives their decisions)
• Lifestyle and daily habits
• Goals and aspirations (what they want to achieve)
• Fears and pain points (what keeps them up at night)
• Decision-making style (logical vs. emotional, fast vs. slow)

Psychological Triggers:
• What motivates them to buy? (Status, convenience, FOMO, belonging, security)
• What objections do they have? (Price, trust, complexity, risk)
• What emotional state are they in when searching? (Desperate, curious, skeptical)
• What language/words resonate? (Use their vocabulary, not industry jargon)

Buying Behavior:
• Where do they research? (Google, social media, reviews, forums)
• Who influences their decisions? (Friends, experts, celebrities, data)
• Typical purchase journey timeline (days/weeks/months)
• Average transaction size and purchase frequency

Marketing Approach:
• Best channels to reach them (with specific platforms)
• Messaging that converts (example headlines addressing their pain points)
• Content types they prefer (video, blog, podcast, infographic)
• Optimal posting times and frequency

[Repeat for Persona 2]

STORYBRAND MESSAGING FRAMEWORK
Using Donald Miller's StoryBrand method:

THE HERO (Customer): ${data.targetMarket}
• External want: [What tangible thing do they want?]
• Internal desire: [How do they want to feel?]
• Philosophical need: [What greater good does this serve?]

THE PROBLEM:
• External Problem: [Tangible obstacle - "My sales are declining"]
• Internal Problem: [Emotional frustration - "I feel incompetent as a business owner"]
• Philosophical Problem: [Injustice - "Small businesses deserve better tools"]

THE GUIDE (Your Brand): ${data.businessType}
• Empathy Statement: "We know how frustrating it is when [pain point]..."
• Authority Statement: "We've helped [X customers] achieve [result] with [proof]"

THE PLAN (3 Simple Steps):
1. [Easy first step - "Sign up in 60 seconds"]
2. [Show progress - "Import your data automatically"]
3. [Achieve success - "See results in your first week"]

THE CALL TO ACTION:
• Direct CTA: [Bold action - "Start Your Free Trial" / "Buy Now"]
• Transitional CTA: [Low-commitment - "Download Free Guide" / "Watch 2-Min Demo"]

SUCCESS (What Life Looks Like After):
• [Paint vivid picture of transformation - "You'll close 40% more deals while working 20% fewer hours"]

FAILURE (What Happens If They Don't Act):
• [Show cost of inaction - "Your competitors will dominate the market while you struggle with spreadsheets"]

ONE-LINER TAGLINE:
"We help [TARGET AUDIENCE] [OVERCOME PROBLEM] so they can [ACHIEVE DESIRED RESULT]."

Example for ${data.businessType}: [Generate specific tagline]

52-WEEK IMPLEMENTATION ROADMAP
Provide a detailed week-by-week plan for the ENTIRE YEAR:

MONTH 1 (Weeks 1-4): FOUNDATION PHASE

Week 1: Setup & Infrastructure
Monday:
• Set up Google Analytics (free - analytics.google.com)
• Create Facebook Business Manager (free - business.facebook.com)
• Install tracking pixels on website
Time: 4 hours | Budget: $0

Tuesday-Wednesday:
• Set up email marketing platform (Mailchimp free tier for <2K subscribers)
• Create lead magnet (free guide/checklist)
• Design basic landing page (Carrd.co $19/year or Leadpages $37/month)
Time: 6 hours | Budget: $19-37

Thursday-Friday:
• Competitor research (analyze 5 competitors' websites, social, ads)
• Document what works vs. what's missing
• Create competitive differentiation matrix
Time: 6 hours | Budget: $0

Success Indicator: All tools installed, lead magnet created, competitive analysis complete

Week 2: Content Foundation
[Provide daily breakdown: Monday - research keywords with Google Keyword Planner, Tuesday - write first blog post, etc.]
Time: 15 hours/week | Budget: $50 (stock photos from Unsplash free or Canva Pro $13/month)
Success Indicator: 3 pieces of content ready to publish

Week 3: Social Media Launch
[Daily tasks...]
Time: 12 hours/week | Budget: $0 (organic posting only)
Success Indicator: Profiles active on 3 platforms, first week of content posted

Week 4: Email Sequence Setup
[Daily tasks...]
Time: 10 hours/week | Budget: $0
Success Indicator: 5-email welcome sequence live, first 10 subscribers

MONTH 2 (Weeks 5-8): TESTING & INITIAL TRACTION PHASE
[Continue with same detailed structure]

MONTH 3 (Weeks 9-12): OPTIMIZATION PHASE
[Continue...]

MONTH 4-6 (Weeks 13-26): GROWTH PHASE
[Continue with less daily detail, more weekly summaries]

MONTH 7-9 (Weeks 27-39): SCALE PHASE
[Continue...]

MONTH 10-12 (Weeks 40-52): OPTIMIZATION & EXPANSION PHASE
[Continue...]

Each week should include:
✓ Specific action items (3-5 per week with day-by-day breakdown for Month 1)
✓ Content to create/publish
✓ Campaigns to launch or optimize
✓ Metrics to track that week
✓ Budget allocation for that week
✓ Time required (hours/week)
✓ Tools needed (with pricing)
✓ Common mistakes to avoid
✓ Success indicators

CHANNEL-SPECIFIC STRATEGIES (Psychology-Based)

For each channel, provide:

CONTENT MARKETING & SEO
• Keywords to target: [10 specific keywords with search volume]
• Content calendar: [4 weeks of specific blog topics addressing customer pain points]
• SEO tactics: [On-page, technical, link building strategies]
• Tools: Google Search Console (free), Ahrefs ($99/month), Grammarly (free)
• Psychological hook: [Authority and trust-building through helpful content]
• Budget: $X/month | Expected traffic: X visitors by month 6
• Conversion strategy: [How to turn readers into leads]

SOCIAL MEDIA MARKETING
• Platforms: [Facebook, Instagram, LinkedIn, TikTok - choose 2-3 based on audience]
• Content mix: [60% educational, 30% entertaining, 10% promotional]
• Posting frequency: [X posts per week per platform]
• Psychological hooks: [Social proof, FOMO, belonging, entertainment]
• Tools: Buffer ($15/month), Canva (free), CapCut (free)
• Budget: $X/month organic, $X/month paid boost
• Expected results: X followers by month 6, X% engagement rate

PAID ADVERTISING (Facebook/Instagram/Google)
• Campaign structure: [Awareness → Consideration → Conversion]
• Ad creative ideas: [10 specific ad concepts with psychological hooks]
• Audience targeting: [Detailed targeting parameters]
• Budget allocation: [Daily/weekly spend by platform]
• Psychological triggers: [Scarcity, social proof, authority, reciprocity]
• Expected results: [CPM, CPC, CTR, conversion rate targets]
• A/B testing plan: [What to test each week]

EMAIL MARKETING
• Sequence structure: [Welcome, nurture, sales, re-engagement]
• Subject line formulas: [10 high-open-rate examples with psychology]
• Sending frequency: [X emails per week]
• Segmentation strategy: [How to segment list for personalization]
• Psychological triggers: [Curiosity, urgency, exclusivity]
• Tools: Mailchimp (free <2K), ConvertKit ($9/month)
• Expected results: [Open rate X%, click rate X%, conversion X%]

PARTNERSHIP & INFLUENCER MARKETING
• Partner types: [Who to target and why]
• Outreach strategy: [Exact scripts and approach]
• Value proposition: [What you offer partners]
• Expected outcomes: [X referrals/month]

AD CREATIVE IDEAS (Psychology-Based)
Provide 10 high-converting ad concepts:

FACEBOOK/INSTAGRAM AD CONCEPT 1:
Headline: [Compelling 5-7 word headline]
Visual: [Describe image/video - "Before/after transformation, happy customer using product"]
Primary Text (First 125 chars): [Hook that addresses pain point]
Psychological Trigger: [Social proof - "Join 10,000+ business owners who..."]
Target Audience: [Age, location, interests, behaviors]
Expected CTR: 2.5% | Budget: $20/day | Timeline: Week 5-8
Landing Page: [What to emphasize - social proof, guarantee, simple CTA]

[Repeat for 9 more ad concepts across platforms]

EMAIL SUBJECT LINES (10 High-Open-Rate Examples):
1. "[First Name], you left something behind..." - Psychology: Curiosity + Loss Aversion
2. "I made a huge mistake (and how you can avoid it)" - Psychology: Vulnerability + Value
3. "Your [Goal] blueprint is ready 🎁" - Psychology: Personalization + Gift
[Continue for all 10...]

METRICS & KPIs DASHBOARD

Primary Business Metrics:
• Monthly Revenue Target: $X by Month 12
• Customer Acquisition Cost (CAC): Target $X (budget ÷ customers)
• Customer Lifetime Value (LTV): Target $X
• LTV:CAC Ratio: Target 3:1 minimum (healthy = 3:1, great = 5:1)
• Monthly Recurring Revenue (MRR): $X growth per month
• Churn Rate: <X% monthly

Channel-Specific Metrics:
• Website Traffic: X visitors/month (Month 3), XX visitors/month (Month 6), XXX (Month 12)
• Conversion Rate: X% website visitors to leads, X% leads to customers
• Email List: X subscribers by Month 6, XX by Month 12
• Open Rate: Target X% (industry avg is 20-25%)
• Click Rate: Target X% (industry avg is 2-3%)
• Social Media: X followers by Month 6, X% engagement rate
• Paid Ads: CTR X%, CPC $X, ROAS X:1 (target 3:1 minimum)
• SEO: X keywords ranking top 10, X organic visitors/month

Weekly Tracking (Use Google Sheets Template):
Week | Traffic | Leads | Customers | Revenue | CAC | Notes

BUDGET BREAKDOWN (Annual)
Based on ${data.budget}:

• Paid Advertising: $X/month (35% of budget)
  - Google Ads: $X
  - Facebook/Instagram: $X
  - LinkedIn (if B2B): $X

• Marketing Tools & Software: $X/month (20% of budget)
  - Email marketing: $X
  - Social scheduling: $X
  - SEO tools: $X
  - Design tools: $X
  - Analytics: $X

• Content Creation: $X/month (25% of budget)
  - Freelance writers: $X
  - Graphic design: $X
  - Video production: $X
  - Stock photos: $X

• Partnerships & Influencers: $X/month (10% of budget)

• Events/Networking: $X/month (5% of budget)

• Contingency/Testing: $X/month (5% of budget)

TOTAL: ${data.budget}

GROWTH HACKING TACTICS (Low-Cost, High-Impact)
• Tactic 1: [Specific creative approach with implementation steps]
• Tactic 2: [Viral mechanism - referral strategy with incentive structure]
• Tactic 3: [Partnership play - exact partners to approach and how]
• Tactic 4: [Community hack - where to find customers cheaply]
• Tactic 5: [Content repurposing - 1 piece → 20 pieces across channels]

COMMON MISTAKES TO AVOID
1. [Mistake]: [Why it fails] → [What to do instead]
2. [Mistake]: [Why it fails] → [What to do instead]
[List 10 common beginner mistakes]

COMPETITIVE ANALYSIS
Analyze 3 competitors:

Competitor 1: [Name or "Top competitor in X space"]
• What they do well: [Specific tactics]
• Their marketing channels: [Where they advertise/post]
• Weaknesses/gaps: [What they're missing]
• Our differentiation: [How we beat them]
• What to copy: [Legal tactics to model]
• What to avoid: [Their mistakes]

[Repeat for Competitors 2 & 3]

SUCCESS ROADMAP & REALISTIC EXPECTATIONS
• Months 1-3: Foundation & slow growth (expect $0-500/month revenue)
  - Focus: Setup, content creation, audience building
  - Metrics: 100-500 website visitors, 10-50 email subscribers
  
• Months 4-6: Traction & optimization (expect $500-2000/month)
  - Focus: Double down on working channels, cut what doesn't work
  - Metrics: 500-2000 visitors, 50-200 subscribers, first paid customers
  
• Months 7-9: Growth & scaling (expect $2000-5000/month)
  - Focus: Scale paid ads, partnerships, team expansion
  - Metrics: 2000-5000 visitors, 200-500 subscribers, consistent revenue
  
• Months 10-12: Optimization & expansion (expect $5000-10000/month)
  - Focus: New channels, geographic expansion, product line extension
  - Metrics: 5000+ visitors, 500+ subscribers, predictable growth

NEXT STEPS (Start Today)
Day 1: [Specific task]
Day 2: [Specific task]
Day 3: [Specific task]
Week 1 Priority: [Most important outcome]

Remember: Marketing is a marathon, not a sprint. Consistency beats intensity. Implement these strategies systematically, track your metrics weekly, and adjust based on what the data tells you. Most businesses fail at marketing because they quit too early or try to do everything at once. Pick 2-3 channels, master them, then expand.

IMPORTANT: This strategy is based on proven marketing psychology and tactics that work when properly implemented. However, success requires consistent execution, patience, and willingness to adapt based on your specific market conditions.`;
        break;

      case 'pitch-deck':
        prompt = `PIVOTHUB PROFESSIONAL PITCH DECK CREATOR & VENTURE CAPITALIST

=== DUAL IDENTITY ===
You are BOTH:
1. A professional pitch deck designer who has created 500+ decks that raised $2B+
2. A venture capitalist who has evaluated 10,000+ pitches and funded 200+ startups

You understand EXACTLY what investors want to hear and how they make funding decisions.

=== INVESTOR DECISION CRITERIA ===
Every slide must answer investor questions:
• Problem: Is this a real, urgent problem worth solving?
• Solution: Is this solution defensible and scalable?
• Market: Is the market large enough ($1B+ TAM) and growing fast?
• Business Model: Will this make money and scale efficiently?
• Competition: Why will this win against competitors?
• Go-to-Market: Can they acquire customers profitably?
• Financials: What's the return potential (10x+) and timeline?
• Team: Can this team execute against top competitors?
• Exit: How will investors make money (acquisition, IPO)?

=== INPUT DATA ===
Company: ${data.companyName}
Presenter: ${data.presenterName || 'N/A'}
Problem: ${data.problem}
Solution: ${data.solution}
Market Size: ${data.marketSize}
Business Model: ${data.businessModel}
Competition: ${data.competition}
Go-to-Market: ${data.goToMarketStrategy || data.businessModel}
Funding: ${data.fundingAmount}
Use of Funds: ${data.useOfFunds}
Team: ${data.teamBackground}
Traction: ${data.traction}

=== SLIDE CONTENT RULES ===
• 3-5 bullets per slide maximum
• Each bullet 10-15 words
• Use investor-friendly metrics (TAM/SAM/SOM, CAC, LTV, burn rate, runway)
• Focus on traction, scalability, defensibility
• Emphasize competitive advantages and moats
• Show clear path to 10x+ returns
• Use concrete numbers and percentages
• Highlight team credentials and domain expertise

=== GENERATE EXACTLY 10 SLIDES ===

[Title Slide]
• ${data.companyName}
• [One compelling tagline that hooks investors - 10 words max]
• Presented by: ${data.presenterName || 'Founder Name'}

[Problem]
• [Quantify the problem - include market pain point with numbers]
• [Why existing solutions fail - specific inefficiency or gap]
• [Market timing - why now is the perfect time]
• [Cost of inaction - what happens if problem persists]

[Solution]
• [Core innovation - what makes this breakthrough]
• [How it solves the problem 10x better than alternatives]
• [Proprietary technology or unfair advantage]
• [Early validation - pilot results, LOIs, user feedback]

[Market Opportunity]
• TAM: [Total Addressable Market size from input or estimate]
• SAM: [Serviceable Addressable Market - realistic segment]
• [Market growth rate - CAGR percentage if available]
• [Target customers - specific segment and why they'll pay]

[Business Model]
• Revenue model: ${data.businessModel}
• [Unit economics - CAC, LTV, payback period, margins]
• [Pricing strategy - how it compares to competitors]
• [Path to profitability - when break-even expected]

[Competitors]
• Key competitors: ${data.competition || 'Mention 2-3 direct competitors'}
• [Our defensible moat - why hard to replicate]
• [Competitive advantage #1 - specific metric or feature]
• [Competitive advantage #2 - technology, team, or network effects]

[Go-to-Market Plan]
• [Primary customer acquisition channel - specific strategy]
• [Secondary channel - diversification approach]
• [Strategic partnerships - if any secured or planned]
• [Expansion roadmap - geographic or segment milestones]

[Ask/Use of Funds]
• Raising: ${data.fundingAmount}
• [Allocation #1 - percentage to product/engineering]
• [Allocation #2 - percentage to sales/marketing]
• [Key milestones this funding enables - 3-6 months out]

[Financials and Exit Strategy]
• Current traction: ${data.traction || 'Mention users, revenue, or growth rate'}
• [Revenue projection - ARR or GMV target in 12-24 months]
• [Path to $100M+ revenue - key inflection points]
• [Exit strategy - acquisition targets or IPO timeline]

[Team]
• ${data.teamBackground || 'Founders with proven track record in [domain]'}
• [Key team strength #1 - domain expertise, exits, or technical credentials]
• [Key team strength #2 - complementary skills or network]
• [Advisors or investors - if notable names involved]

CRITICAL: 
• Use ONLY bullet points with • symbol
• NO paragraphs or long explanations
• Focus on metrics, traction, and scalability
• Emphasize what investors care about: returns, timing, team, moat
• Make every word count - this is a 10-minute pitch`
        break

      case 'biography':
        const toneGuidance = data.tone === 'faith-based' 
          ? 'Incorporate faith-based language and values naturally. Reference purpose, calling, stewardship, and service.' 
          : data.tone === 'friendly' 
          ? 'Use warm, approachable language while maintaining professionalism. Be conversational but not casual.' 
          : 'Use formal, corporate language appropriate for executive communications and investor materials.';
        
        prompt = `You are a technical writer with 25+ years of experience writing executive-level biographies and organizational statements. Create professional content for:

FOUNDER INFORMATION:
Name: ${data.founderName}
Background: ${data.background}
Business Type: ${data.businessType}
Goals: ${data.goals}
${data.dateOfFormation ? `Founded: ${data.dateOfFormation}` : ''}
${data.productsServices ? `Products/Services: ${data.productsServices}` : ''}
${data.traction ? `Traction: ${data.traction}` : ''}
${data.achievements ? `Achievements: ${data.achievements}` : ''}

TONE: ${data.tone || 'formal'}
${toneGuidance}

CRITICAL WRITING STANDARDS:
1. Executive-level writing appropriate for investor decks, board materials, and press releases
2. NEVER use em-dashes (—) - use commas, periods, or semicolons instead
3. NEVER use contractions - write "do not" instead of "don't", "cannot" instead of "can't"
4. Use active voice and strong verbs
5. Focus on achievements, impact, and credibility
6. Be specific with numbers, dates, and measurable accomplishments when provided
7. Avoid clichés and buzzwords (e.g., "passionate", "game-changer", "synergy")
8. Write in third person for bios

FORMAT YOUR RESPONSE EXACTLY AS SHOWN BELOW WITH SECTION MARKERS:

[FOUNDER_BIO_100]
Write a 100-word founder biography. Include: name, current role, key expertise area, and one major accomplishment. This is for social media profiles, event bios, and brief introductions.

Target: 90-110 words
Style: Concise, punchy, highlights only the most impressive credentials

[FOUNDER_BIO_250]
Write a 250-word founder biography. Include: professional background, career highlights, expertise areas, 2-3 major achievements, current role, and what drives their work. This is for conference speaker bios, website "About" pages, and podcast introductions.

Target: 240-260 words
Style: Balanced detail, establishes credibility, shows trajectory

[FOUNDER_BIO_500]
Write a 500-word founder biography. Include: early career background, professional journey with key milestones, major achievements with specific metrics/dates, expertise and philosophy, current role and responsibilities, industry recognition or awards, and what sets them apart. This is for investor materials, detailed press releases, and award submissions.

Target: 480-520 words
Style: Comprehensive, narrative-driven, executive-level detail

[BUSINESS_BIO_100]
Write a 100-word company/business biography. Include: what the company does, who it serves, and its unique value proposition. This is for directory listings, email signatures, and brief company descriptions.

Target: 90-110 words
Style: Clear, direct, value-focused

[BUSINESS_BIO_200]
Write a 200-word company/business biography. Include: company founding story (when and why), products/services offered, target market, key differentiators, traction/milestones, and current market position. This is for pitch decks, partnership materials, and website "About Us" sections.

Target: 190-210 words
Style: Establishes credibility, shows momentum, positions against competitors

[BUSINESS_BIO_500]
Write a 500-word company/business biography. Include: founding story with context (problem identified, solution created), comprehensive product/service description, target market and customer profile, competitive advantages with specifics, traction and growth metrics (customers, revenue, team size if provided), industry recognition or partnerships, team expertise, and future vision. This is for investor decks, loan applications, and detailed press releases.

Target: 480-520 words
Style: Comprehensive narrative, data-driven, investor-ready

[VISION]
Write a powerful 2-3 sentence vision statement that describes the aspirational future the business/founder is working toward. Answer: "What world are we trying to create?" or "What does success look like 10 years from now?" Vision statements should inspire and set a bold direction.

Examples of strong vision statements:
- "To be Earth's most customer-centric company" (Amazon)
- "A world where everyone has access to clean water" (charity:water)
- "To create a better everyday life for many people" (IKEA)

Style: Aspirational, future-focused, inspiring, memorable

[MISSION]
Write a clear 2-3 sentence mission statement that defines the business's purpose, what it does, how it serves customers, and what makes it different. Answer: "Why do we exist?" and "What do we do daily to achieve our vision?" Mission statements should be actionable and guide decision-making.

Examples of strong mission statements:
- "To organize the world's information and make it universally accessible and useful" (Google)
- "To accelerate the world's transition to sustainable energy" (Tesla)
- "To inspire and nurture the human spirit, one person, one cup, and one neighborhood at a time" (Starbucks)

Style: Clear, actionable, purpose-driven, differentiating

REMEMBER:
- NO em-dashes (—)
- NO contractions (don't, can't, won't, etc.)
- Executive-level writing throughout
- Use specific numbers, dates, and metrics when provided in the input
- Third person for all bios
- Avoid generic praise - focus on measurable impact
- Do NOT include the section labels like [FOUNDER_BIO_100] in your output - only output the content for each section`
        break

      case 'social-media':
        prompt = `Generate 6 social media content ideas for:
Business Type: ${data.businessType}
Target Audience: ${data.targetAudience}
Products/Services: ${data.products}
Brand Tone: ${data.brandTone}

Create content for different platforms (Instagram, LinkedIn, Twitter, Facebook) with captions, hashtags, and optimal posting times.`
        break

      case 'business-foundation':
        prompt = `Create comprehensive business foundation elements for:
Business Name: ${data.businessName}
Industry: ${data.industry}
Experience: ${data.experience || 'Not specified'}
Passion: ${data.passion || 'Not specified'}
Target Customers: ${data.customers || 'Not specified'}
Ideal Customer Profile: ${data.idealCustomer || 'Not specified'}
Core Values: ${data.values || 'Not specified'}
Business Goals: ${data.goals || 'Not specified'}
Business Model Input: ${data.businessModel || 'Not specified'}
Go-to-Market Input: ${data.goToMarket || 'Not specified'}

CRITICAL: Format your response with clear section markers and generate ALL sections:

[VISION]
Write a compelling 2-3 sentence vision statement that describes the long-term aspirational future of the business. ${data.goals ? 'Incorporate these goals: ' + data.goals : ''}

[MISSION]
Write a clear 2-3 sentence mission statement that defines the business's purpose, what it does, and who it serves. ${data.passion ? 'Reflect this passion: ' + data.passion : ''}

[VALUES]
${data.values ? 'Expand on these core values with 2-3 sentences explaining how they guide the business: ' + data.values : 'Identify 3-5 core values that should guide this business based on the industry and target customers, with a brief explanation (2-3 sentences).'}

[PILLARS]
Identify 3-4 strategic pillars (foundational areas of focus) for this business and explain each in 2-3 sentences. These should align with the values and support the vision.

[GOALS]
${data.goals ? 'Expand on these business goals with specific, measurable details (2-3 sentences): ' + data.goals : 'Define 3-5 specific business goals (revenue, customer acquisition, market position, etc.) in 2-3 sentences.'}

[OBJECTIVES]
Create 3-5 specific, measurable objectives that support the vision and mission. Include timelines and metrics where possible (2-3 sentences total).

[PROBLEM]
Write a concise problem statement (2-3 sentences) that clearly articulates the pain points or challenges customers face in this industry.

[SOLUTION]
Explain in 2-3 sentences how your business uniquely solves the identified problem.

[AUDIENCE]
Describe the target audience in 2-3 sentences, including demographics, psychographics, and key characteristics. ${data.customers ? 'Base this on: ' + data.customers : ''}

[IDEAL_CUSTOMER]
${data.idealCustomer ? 'Expand on this ideal customer profile with specific details (demographics, behaviors, pain points, motivations) in 2-3 sentences: ' + data.idealCustomer : 'Create a detailed ideal customer profile including demographics, psychographics, behaviors, pain points, and motivations (2-3 sentences).'}

[MARKET_SIZE]
Provide 2-3 sentences about the market opportunity for ${data.industry}, including size estimates, growth trends, and potential.

[BUSINESS_MODEL]
${data.businessModel ? 'Expand on this business model with specific revenue streams, pricing strategy, and value creation details (2-3 sentences): ' + data.businessModel : 'Explain in 2-3 sentences how the business will generate revenue, create value, and achieve profitability.'}

[GO_TO_MARKET]
${data.goToMarket ? 'Expand on this go-to-market strategy with specific tactics, channels, and timelines (2-3 sentences): ' + data.goToMarket : 'Outline the go-to-market strategy in 2-3 sentences, including key channels, tactics, and customer acquisition approach.'}

Keep each section concise and actionable. Use plain text without markdown.`
        break

      default:
        throw new Error('Invalid content type')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: type === 'business-plan' ? 8000 : type === 'business-foundation' ? 4000 : type === 'marketing-strategy' ? 6000 : 2000
      })
    })

    const result = await response.json()
    
    if (result.error) {
      throw new Error(result.error.message)
    }

    let content = result.choices[0].message.content

    // Sanitize content to remove any remaining markdown artifacts
    content = content
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/#{2,}/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    await logRequest({
      endpoint: "generate-business-content",
      userId,
      ip,
      success: true,
      creditsCharged: 3,
      requestDurationMs: Date.now() - startTime
    });
    
    return new Response(
      JSON.stringify({ content, type }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error generating content:', error)
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await logRequest({
      endpoint: "generate-business-content",
      userId,
      ip,
      success: false,
      creditsCharged: 0,
      errorMessage,
      requestDurationMs: Date.now() - startTime
    });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})