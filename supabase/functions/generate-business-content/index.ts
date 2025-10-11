import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, data } = await req.json()
    
    const openaiApiKey = Deno.env.get('relaunch_openai_key')
    if (!openaiApiKey) {
      throw new Error('relaunch_openai_key not found in environment variables')
    }

    let prompt = ''
    let systemMessage = 'You are an expert business consultant and content creator. IMPORTANT: Provide responses in clean, plain text format without any markdown formatting, headers (#), or special characters. Use simple bullet points (•) if lists are needed. Avoid using symbols like ###, ##, **, *, or other markdown syntax.'

    switch (type) {
      case 'business-ideas':
        prompt = `Generate 5 personalized business ideas based on:
Skills: ${data.skills}
Interests: ${data.interests}
Budget: ${data.budget}

Provide specific, actionable business ideas that match their background. Format as simple numbered list without any markdown or special formatting. Each idea should be 1-2 sentences explaining the concept and why it fits their profile.`
        break

      case 'business-plan':
        prompt = `You are a senior business consultant and strategic advisor who has written 500+ business plans that have raised over $200M in funding and launched successful businesses across all industries.

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
        prompt = `You are a senior growth marketer with 15+ years scaling startups from $0 to $10M+ ARR. You've led marketing at tech startups, e-commerce companies, and SaaS businesses. You understand customer acquisition, retention, and building sustainable growth engines.

Create a COMPREHENSIVE, actionable marketing strategy worth $2,000+ of consulting value for:

Business Type: ${data.businessType}
Target Market: ${data.targetMarket}
Budget: ${data.budget}
Goals: ${data.goals}
Current Stage: ${data.currentStage || 'Early stage'}

This strategy must include specific tactics, timelines, budget breakdowns, and success metrics.

STRUCTURE - Provide ALL sections in detail:

OVERVIEW
• Strategic approach (2-3 sentences)
• Primary marketing channels to focus on
• Budget breakdown by channel (percentages)
• Expected ROI timeline

CHANNEL PLAYBOOKS
For each of 5-7 prioritized channels, provide:

Channel Name (e.g., Content Marketing / SEO)
• Monthly budget allocation: $X (X% of total)
• Time commitment: X hours/week
• Specific tactics:
  - Tactic 1 with implementation details
  - Tactic 2 with frequency and approach
  - Tactic 3 with specific metrics
• Required tools: [Tool name ($X/month), Tool 2]
• Expected results:
  - Month 3: X visitors/leads/customers
  - Month 6: X visitors/leads/customers
  - Month 12: X visitors/leads/customers
• Success metrics:
  - Metric 1 with target
  - Metric 2 with target

[Repeat for: Paid Ads, Social Media, Email Marketing, Partnerships, PR/Content, etc.]

90-DAY LAUNCH PLAN
Week 1:
- Action 1
- Action 2
- Action 3

Week 2:
- Action 1
- Action 2

Weeks 3-4:
- Focus area 1
- Focus area 2

Month 2:
- Key initiatives
- Campaigns to launch

Month 3:
- Scaling activities
- Optimization focus

CONTENT CALENDAR (First 30 Days)
Week 1:
- Monday: [Content piece 1 - topic, channel]
- Wednesday: [Content piece 2]
- Friday: [Content piece 3]

Week 2:
[Same structure]

[Continue for all 4 weeks]

COMPETITOR ANALYSIS
Competitor 1: [Name if known, or "Top competitor in X space"]
• What they're doing well
• Their marketing channels
• Gaps we can exploit
• Our differentiation

[2-3 competitors total]

GROWTH HACKING TACTICS
• Low-cost tactic 1: [Specific creative approach]
• Viral mechanism 2: [Referral or content strategy]
• Partnership play 3: [Who to partner with and how]
• Community hack 4: [Where to find customers cheaply]

FUNNEL OPTIMIZATION
• Top of funnel: [How to attract awareness]
  - Target: X visitors/month
  - Conversion to lead: X%
• Middle of funnel: [How to nurture leads]
  - Target: X leads/month
  - Lead to customer rate: X%
• Bottom of funnel: [How to close sales]
  - Target: X customers/month
  - Customer acquisition cost: $X

METRICS & KPIs DASHBOARD
Primary Metrics:
• Monthly Recurring Revenue (MRR): Target $X by Month 12
• Customer Acquisition Cost (CAC): Target $X
• Lifetime Value (LTV): Target $X
• LTV:CAC Ratio: Target 3:1 or higher
• Monthly website traffic: X visitors
• Conversion rate: X%
• Customer churn rate: <X%

A/B TESTING ROADMAP
Month 1-2: Test [Element 1 - landing page headline]
• Hypothesis: [What you expect]
• Success metric: [What defines win]

Month 3-4: Test [Element 2 - pricing page layout]
[Same structure]

[6-8 tests for Year 1]

PARTNERSHIP STRATEGY
• Partner type 1: [Who to target]
  - Why: [Strategic fit]
  - How to approach: [Outreach strategy]
  - Expected outcome: [X referrals/month]

• Partner type 2: [Influencers in X space]
  [Same structure]

BUDGET BREAKDOWN (Annual)
• Content Marketing: $X (X%)
• Paid Advertising: $X (X%)
• Social Media Management: $X (X%)
• Email Marketing Tools: $X (X%)
• Marketing Tools & Software: $X (X%)
• Events/Partnerships: $X (X%)
• Contingency: $X (X%)
Total Annual Marketing Budget: ${data.budget}

REALISTIC TIMELINE
• Months 1-3: Foundation building, slow growth
• Months 4-6: Channel optimization, accelerating growth
• Months 7-9: Scaling what works, pruning what doesn't
• Months 10-12: Full-scale execution, hitting stride

FORMATTING:
• Use bullet points (•) for all lists
• NO markdown symbols (###, **, *)
• Specific numbers, costs, and metrics throughout
• Actionable tactics, not vague strategies
• Reference current marketing trends and tools`
        break

      case 'pitch-deck':
        prompt = `Create EXACTLY 10 pitch deck slides with SHORT BULLET POINTS ONLY.

CRITICAL FORMATTING RULES:
- Each slide MUST have 3-5 bullet points maximum
- Each bullet point MUST be 10-15 words or less
- NO paragraphs, NO long explanations, NO narrative text
- Format each bullet with • symbol
- Keep language concise and impactful

INPUT DATA:
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

Generate EXACTLY these 10 slides in this format:

[Title / Cover]
• ${data.companyName}
• Presenter: ${data.presenterName || 'Name'}
• [One sentence tagline/value proposition]

[Problem]
• [Key problem point 1 - max 15 words]
• [Key problem point 2 - max 15 words]
• [Key problem point 3 - max 15 words]

[Solution]
• [How you solve it - point 1]
• [How you solve it - point 2]
• [How you solve it - point 3]
• [Key differentiator]

[Market Opportunity]
• Total addressable market: [size from input]
• [Growth rate or trend]
• [Target segment details]
• [Market validation point]

[Product / Technology]
• [Core product feature 1]
• [Core product feature 2]
• [Technology advantage]
• [Current development stage]

[Business Model]
• Revenue model: [from input]
• [Pricing strategy point]
• [Customer acquisition approach]
• [Unit economics highlight]

[Go-to-Market Strategy]
• [Channel strategy point 1]
• [Channel strategy point 2]
• [Partnership approach]
• [Timeline milestone]

[Competition / Differentiation]
• Key competitors: [from input]
• [Our unique advantage 1]
• [Our unique advantage 2]
• [Defensibility point]

[Financials / Traction]
• Current traction: [from input]
• [Key metric or milestone]
• [Revenue projection or funding]
• [Use of funds summary]

[Team & Ask / Closing]
• Team: [from input - key credentials]
• Funding ask: [from input]
• [What funding will achieve]
• [Contact or call to action]

Use ONLY bullet points with • symbol. NO paragraphs.`
        break

      case 'biography':
        prompt = `Create a professional founder biography, vision statement, and mission statement for:
Founder: ${data.founderName}
Background: ${data.background}
Business Type: ${data.businessType}
Goals: ${data.goals}
Founded: ${data.dateOfFormation}
Products/Services: ${data.productsServices}
Traction: ${data.traction}
Achievements: ${data.achievements}

CRITICAL: Format your response EXACTLY as shown below with [SECTION] markers:

[BIOGRAPHY]
Write a compelling 2-3 paragraph founder biography here in plain text.

[VISION]
Write a concise vision statement here in plain text (1-2 paragraphs).

[MISSION]
Write a clear mission statement here in plain text (1-2 paragraphs).

Do NOT include the section labels in your output, only the content for each section.`
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
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})