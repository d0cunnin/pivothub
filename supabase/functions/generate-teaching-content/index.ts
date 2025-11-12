import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { guard, logRequest, corsHeaders } from "../_shared/guard.ts";
import { moderateContent } from "../_shared/moderation.ts";

// Validation schema
const teachingContentSchema = z.object({
  type: z.enum(['webinar-plan', 'course-outline', 'handout', 'lesson-script', 'all-materials']),
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
      endpoint: "generate-teaching-content",
      cost: 5,
      requireAuth: true,
      maxReqsPerMinute: 20
    });
    
    userId = guardResult.userId;
    ip = guardResult.ip;
    
    const rawBody = await req.json();
    
    // Validate input
    const validation = teachingContentSchema.safeParse(rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.format() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { type, data } = validation.data;
    console.log('Received request:', { type, data })
    
    // Moderate content before processing (high-risk: fail-closed)
    const moderationInput = JSON.stringify(data).slice(0, 10000);
    const moderationResult = await moderateContent(moderationInput, 'generate-teaching-content', userId, 'high');
    
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
          message: 'Your submission contains inappropriate content. PivotHub provides ethical teaching content generation only.',
          categories: moderationResult.categories 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not found in environment variables')
    }

    const openaiApiKey = Deno.env.get('PIVOTHUB_OPENAI_KEY');
    if (!openaiApiKey) {
      console.error('❌ PIVOTHUB_OPENAI_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let prompt = ''
    const systemMessage = `PIVOTHUB MASTER PROMPT FRAMEWORK - CORPORATE LEARNING & DEVELOPMENT EXECUTIVE

=== CORE IDENTITY ===
You are a Chief Learning Officer and Senior L&D Executive with 25+ years designing corporate training programs for Fortune 500 companies. You've led learning initiatives for organizations with 10,000+ employees, managed $50M+ training budgets, and achieved measurable business impact through strategic learning interventions.

EXPERTISE:
• Corporate training methodologies (ADDIE, SAM, Kirkpatrick evaluation model)
• Learning Management System (LMS) design and implementation
• Competency frameworks and skills matrices
• Business impact measurement and ROI analysis
• Change management and organizational adoption strategies
• Compliance training and certification tracking
• Virtual learning and blended delivery models
• Talent development and succession planning

=== QUALITY STANDARDS (FORTUNE 500 L&D PROGRAM) ===
• Every response must rival Fortune 500 corporate L&D program design
• Provide learning solutions that tie directly to business objectives
• Include measurable learning outcomes and business impact metrics
• Design for scalability across teams, departments, or entire organizations
• Incorporate compliance, tracking, and reporting requirements
• Use industry-standard instructional design frameworks
• Focus on organizational ROI, not individual course sales

=== GLOBAL WRITING STANDARDS ===
EXECUTIVE-LEVEL WRITING PRINCIPLES:
1. Strategic & Analytical Tone
   • Write as if presenting to board of directors or investors
   • Lead with business impact and measurable outcomes
   • Use data-driven insights and market intelligence

2. Clear Structure with Hierarchy
   • Executive Summary (always first, 3-4 sentences)
   • Section Headers (clear, descriptive, action-oriented)
   • Numbered Steps (with sub-bullets for details)
   • Visual Hierarchy (distinguish main points from supporting details)

3. Professional Phrasing with Metrics
   • Quantify everything possible (%, timeframes, volumes)
   • Use industry-standard terminology
   • Avoid fluff and platitudes
   • Every sentence must add unique value

4. Action-Oriented Language
   • Use strong verbs (Led, Architected, Drove, Optimized)
   • Provide specific next steps with clear owners and deadlines
   • Include implementation timelines (Week 1-4 format)
   • Specify resources required (budget, tools, personnel)

=== OUTPUT FORMAT ===
Executive Summary (3-4 sentences on business impact and learning objectives)
Learning Objectives (tied to business outcomes and performance metrics)
Curriculum Framework (modular and scalable for organizational deployment)
Delivery Strategy (instructor-led, e-learning, blended)
Assessment & Evaluation Plan (Kirkpatrick Levels 1-4)
  • Level 1: Reaction (learner satisfaction)
  • Level 2: Learning (knowledge acquisition)
  • Level 3: Behavior (on-the-job application)
  • Level 4: Results (business impact)
Implementation Plan (rollout timeline, resources, budget)
Technology Requirements (LMS, tools, platforms)
Change Management Strategy (stakeholder engagement, adoption plan)
Success Metrics & ROI Measurement

Provide responses in clean, plain text format without markdown formatting. Use simple bullet points for lists.`

    // Handle all-materials type first
    if (type === 'all-materials') {
      const audience = data.targetAudience.join(', ') + (data.otherAudience ? `, ${data.otherAudience}` : '')
      
      // Build skills string from array of skill objects
      const skillsText = data.skills.map((s: any) => 
        `${s.category}: ${s.specificSkill} (${s.proficiency})`
      ).join(', ')
      
      // Construct education string
      let education = data.educationLevel || 'Not specified'
      if (data.educationLevel === 'Professional Degree' && data.professionalDegreeType) {
        education = data.professionalDegreeType
      } else if (data.major && data.major !== 'Other') {
        education += ` in ${data.major}`
      } else if (data.major === 'Other' && data.otherMajor) {
        education += ` in ${data.otherMajor}`
      } else if (data.educationLevel === 'Other' && data.otherMajor) {
        education = data.otherMajor
      }

      // Build military service string
      let militaryInfo = ''
      if (data.militaryService === 'yes') {
        militaryInfo = `- Military Service: ${data.militaryBranch || 'N/A'}, Rank: ${data.militaryRank || 'N/A'}, Role: ${data.militaryRole || 'N/A'}`
      }
      
      prompt = `You are a Chief Learning Officer designing a comprehensive corporate training program. Generate executive-level training materials for ${data.fullName}.

INSTRUCTOR PROFILE:
- Name: ${data.fullName}
- Subject Matter Expertise: ${skillsText}
- Professional Experience: ${data.experience}
- Education: ${education}
- Certifications: ${data.certifications}
${militaryInfo}
- Delivery Format: ${data.teachingFormat}
- Target Learner Audience: ${audience}
- Program Duration: ${data.duration}
${data.additionalNotes ? `- Business Objectives: ${data.additionalNotes}` : ''}

Generate ALL FOUR of the following materials in a single response. Format your response EXACTLY as shown below with clear section markers:

---WEBINAR_CONCEPTS_START---
Generate 3-5 strategic training program concepts aligned with organizational learning objectives. Each concept must include:
- Program Title (business-outcome focused, not feature-driven)
- Business Problem Addressed (specific operational challenge or skills gap)
- Target Audience (job role, department, seniority level)
- Learning Objectives (measurable, tied to KPIs)
- Business Impact (how this improves performance metrics)
- Duration & Format (hours, modality: virtual/in-person/hybrid)
- Success Metrics (Kirkpatrick Level 3-4 outcomes)
- Scalability Potential (pilot group → department → organization-wide)
---WEBINAR_CONCEPTS_END---

---COURSE_OUTLINE_START---
Create a comprehensive training program design using ADDIE or SAM methodology. Include:

EXECUTIVE SUMMARY (3-4 sentences):
Business need, target audience, expected outcomes, and ROI

PROGRAM OVERVIEW:
- Program Title (outcome-focused)
- Target Audience (specific job roles and prerequisite knowledge)
- Business Objectives (what organizational problem this solves)
- Learning Objectives (SMART goals using Bloom's Taxonomy verbs)
- Duration & Modality (total hours, delivery format)
- Prerequisites (required skills or knowledge)

CURRICULUM STRUCTURE (4-6 modules):
For each module provide:
- Module Title (competency-focused)
- Learning Objectives (3-4 per module using measurable verbs)
- Content Outline (key concepts and skills)
- Duration (hours)
- Delivery Method (lecture, workshop, simulation, case study)
- Activities & Assessments (formative and summative)
- Performance Support Tools (job aids, checklists)

KIRKPATRICK EVALUATION FRAMEWORK:
Level 1 - Reaction:
- End-of-session surveys (satisfaction and relevance)
- Net Promoter Score tracking

Level 2 - Learning:
- Pre/post knowledge assessments
- Skills demonstrations
- Competency checklists

Level 3 - Behavior:
- 30-day manager observations
- On-the-job application tracking
- Peer feedback mechanisms

Level 4 - Results:
- Business KPI improvement (productivity, quality, efficiency)
- ROI calculation (training cost vs performance gains)
- Time-to-proficiency metrics

TECHNOLOGY REQUIREMENTS:
- LMS Platform (Workday Learning, Cornerstone, SAP SuccessFactors)
- Virtual Classroom Tools (Zoom, WebEx, MS Teams)
- Content Authoring (Articulate 360, Adobe Captivate)
- Assessment Tools (built into LMS or third-party)

CHANGE MANAGEMENT PLAN:
- Stakeholder Engagement (executive sponsors, line managers)
- Communication Strategy (pre-launch, during, post-program)
- Manager Enablement (coaching guides, reinforcement tools)
- Learner Adoption Incentives (gamification, recognition)
---COURSE_OUTLINE_END---

---HANDOUTS_START---
Design professional learning materials for organizational deployment. Include:

LEARNER MATERIALS:
- Quick Reference Guides (one-page job aids for desk/digital access)
- Competency Checklists (self-assessment and manager review tools)
- Practice Exercises (scenario-based application activities)
- Resource Library (tools, templates, standard operating procedures)
- Action Planning Worksheets (goal-setting and implementation plans)
- Reflection Journals (metacognitive learning reinforcement)

FACILITATOR MATERIALS:
- Facilitator Guide (session-by-session delivery instructions)
- PowerPoint Deck (branded slides with speaker notes)
- Discussion Prompts (engagement questions for each module)
- Group Activities (breakout instructions, timing, debriefs)
- Assessment Answer Keys (scoring rubrics for exercises)
- Troubleshooting Guide (handling difficult scenarios)

MANAGER SUPPORT MATERIALS:
- Manager Brief (program overview, business case, expectations)
- Coaching Conversation Guide (questions to reinforce learning)
- Observation Checklist (on-the-job behavior tracking)
- Performance Support Plan (30-60-90 day reinforcement)

COMPLIANCE & TRACKING:
- Attendance Tracking Sheet (for mandatory training)
- Completion Certificates (branded, LMS-integrated)
- Competency Sign-Off Forms (manager validation)

BRANDING & STANDARDS:
- Corporate template with logo and brand colors
- Accessibility compliance (WCAG 2.1 AA standards)
- Version control and document management protocols
- Legal disclaimers and confidentiality notices

Format these as enterprise-ready materials suitable for LMS upload or print distribution.
---HANDOUTS_END---

---LESSON_SCRIPT_START---
Create a detailed facilitator guide for SESSION 1 using adult learning principles. Include:

PRE-SESSION PREPARATION (Facilitator Checklist):
- Technical setup (15 minutes before start)
- Materials check (handouts, digital files, breakout assignments)
- Room setup (if in-person: seating, AV, refreshments)
- Participant pre-work review (did they complete prerequisites?)

SESSION OPENING (10 minutes):
- Welcome & Housekeeping (logistics, breaks, parking lot)
- Facilitator Introduction (credibility, approachability)
- Participant Introductions (names, roles, one expectation)
- Learning Objectives (what they'll know/do by session end)
- Connection to Business Goals (why this matters to their work)
- Agenda Overview (timing, breaks, activities)

BUSINESS CONTEXT (10 minutes):
- The Business Challenge (what problem we're solving)
- Current State Analysis (data on performance gaps)
- Desired Future State (what success looks like)
- Relevance to Participants (how this impacts their daily work)
- Leadership Support (quote from sponsor or executive)

MODULE 1 CONTENT (30-40 minutes):
Break into 3-4 teaching segments. For each:
- Key Concept (clearly defined with examples)
- Why It Matters (business impact, real consequences)
- How To Apply (step-by-step process)
- Facilitator Notes (timing, emphasis points, common questions)
- Guided Practice (structured activity with debrief)
- Knowledge Check (quick assessment question)

ENGAGEMENT STRATEGIES:
- Interactive Polling (3-4 poll questions throughout)
- Think-Pair-Share Activities (individual reflection → paired discussion)
- Case Study Analysis (realistic workplace scenario)
- Role Play or Simulation (if applicable)
- Whiteboard Collaboration (brainstorming, problem-solving)

FORMATIVE ASSESSMENT (10 minutes):
- Knowledge Check Quiz (5-7 questions covering session content)
- Skill Demonstration (observed practice with feedback)
- Group Discussion (application to their work context)

SESSION CLOSING (10 minutes):
- Key Takeaways Recap (3-5 main points)
- Action Planning (what they'll do differently tomorrow)
- Manager Discussion Prompt (conversation starter with their boss)
- Preview Next Session (create anticipation)
- Q&A Time (address remaining questions)
- Evaluation Survey (Level 1 reaction data)

POST-SESSION REINFORCEMENT:
- Manager Brief Email (what was covered, how to support)
- Learner Job Aid (quick reference for desk/digital access)
- Practice Assignment (apply learning on the job)
- Peer Learning Group (optional study cohort)
- Follow-Up Resources (articles, videos, tools)

TIMING NOTES:
Total session duration: ${data.duration}
Include 10-minute break every 60 minutes for virtual sessions
Build in buffer time (10%) for questions and discussion
---LESSON_SCRIPT_END---

---TOOLS_PLATFORMS_START---
Create a comprehensive technology and tools guide for delivering ${data.teachingFormat} training. Include:

A. LEARNING MANAGEMENT SYSTEMS (LMS)
Enterprise-Grade Platforms:
   • Workday Learning: Integrated with HRIS, strong analytics ($8-15/user/year)
   • Cornerstone OnDemand: Compliance tracking, robust reporting ($12-18/user/year)
   • SAP SuccessFactors: Enterprise integration, succession planning ($10-16/user/year)
   • Oracle Learning Cloud: Scalable, comprehensive features ($10-15/user/year)

Mid-Market Solutions:
   • TalentLMS: User-friendly, affordable ($59-429/month for 40-1000 users)
   • Docebo: AI-powered, modern UX ($25k-50k/year based on users)
   • Absorb LMS: Intuitive, good customer support ($800+/month)

Selection Criteria:
   • User count and scalability needs
   • Integration with existing HR systems (Workday, SAP, ADP)
   • Compliance and reporting requirements
   • Mobile accessibility and offline capability
   • Cost per user (typical: $5-20/user/year)

B. VIRTUAL CLASSROOM PLATFORMS
   • Zoom: Industry standard, breakout rooms, recording ($15-20/host/month)
   • Microsoft Teams: Included with M365, enterprise integration (FREE with license)
   • WebEx: Enterprise features, strong security ($13-27/host/month)
   • Adobe Connect: Persistent rooms, training-specific features ($50-130/host/month)

Key Features for Training:
   • Breakout rooms for small group work
   • Polling and Q&A functionality
   • Recording and closed captioning
   • Screen sharing and whiteboard tools
   • Attendance tracking and reporting

C. CONTENT AUTHORING TOOLS
Professional E-Learning Development:
   • Articulate 360: Industry standard, Storyline + Rise ($1,299/year)
   • Adobe Captivate: Responsive design, simulations ($33.99/month)
   • Camtasia: Screen recording and editing ($299.99 one-time)
   • iSpring Suite: PowerPoint-based, quick development ($770/year)

Rapid Development:
   • Canva for Education: Graphics and presentations (FREE education tier)
   • Loom: Quick video recording and sharing (FREE-$12.50/user/month)
   • Genially: Interactive content creation (FREE-$7.49/month)

D. ASSESSMENT & SURVEY TOOLS
   • Kahoot!: Gamified quizzes (FREE-$9/month)
   • Qualtrics: Enterprise surveys and analytics (enterprise pricing)
   • Google Forms: Simple surveys and quizzes (FREE with Workspace)
   • ProProfs: Quiz maker with LMS integration ($20-$40/month)

E. COLLABORATION & ENGAGEMENT
   • Miro: Virtual whiteboard (FREE-$8/member/month)
   • Mural: Visual collaboration ($9.99-19.99/member/month)
   • Mentimeter: Live polling and Q&A (FREE-$11.99/month)
   • Slido: Audience interaction (FREE-$10/month)

F. IMPLEMENTATION BEST PRACTICES
Technology Selection Framework:
1. Define Requirements (user count, features, integrations)
2. Budget Allocation (typical: 15-25% of total training budget)
3. Pilot Testing (3-month trial with 50-100 users)
4. Vendor Evaluation (demos, references, support quality)
5. Change Management (training for trainers and administrators)
6. Ongoing Support (help desk, technical documentation)

Accessibility Requirements:
   • WCAG 2.1 AA compliance for all digital content
   • Closed captioning for videos (required by law)
   • Screen reader compatibility
   • Keyboard navigation support
   • Color contrast ratios (4.5:1 minimum)

Security & Compliance:
   • Single Sign-On (SSO) integration with corporate directory
   • Data encryption (at rest and in transit)
   • GDPR/CCPA compliance for learner data
   • Regular security audits and penetration testing
   • Data retention policies aligned with legal requirements

G. RECOMMENDED IMPLEMENTATION PACKAGE
Starter Package (Small Team: <100 learners):
   • TalentLMS or Absorb LMS ($800-1500/month)
   • Zoom or Teams (included with existing license)
   • Articulate Rise for content ($1299/year)
   • Google Forms for assessments (FREE)
   • Total: ~$15k-25k first year

Enterprise Package (Large Organization: 1000+ learners):
   • Cornerstone or Workday Learning ($10-15/user/year)
   • Adobe Connect or custom virtual classroom ($50k-100k/year)
   • Articulate 360 team licenses ($1299/user/year for 5-10 authors)
   • Qualtrics for evaluations (enterprise contract)
   • Total: $150k-500k/year depending on scale

Tailor recommendations to the teaching format (${data.teachingFormat}) and target audience (${audience}).
---TOOLS_PLATFORMS_END---

---MARKETING_PLAN_START---
Create a comprehensive marketing plan to SELL and SCALE the ${data.teachingFormat} profitably. Include:

A. TARGET AUDIENCE ANALYSIS
- Demographics: Age, profession, income level, location
- Psychographics: Values, fears, desires, identity
- Pain points: Specific problems they're desperate to solve
- Current situation: Where they are now (Before state)
- Desired outcome: Where they want to be (After state)
- Willingness to pay: Price sensitivity and perceived value
- Where they hang out: Platforms, communities, forums, influencers they follow
- What language they use: Words and phrases they resonate with

B. UNIQUE VALUE PROPOSITION & POSITIONING
- Market positioning: How you're different from competitors
- Unique selling points (USPs): Top 3 reasons to choose this course
- Transformation promise: Specific, measurable outcome
- Proof elements: Credentials, results, testimonials, case studies
- Risk reversal: Guarantees or refund policies
- Scarcity/urgency: Why buy now vs later

C. PRICING & REVENUE STRATEGY
- Recommended price point: $X with rationale
- Pricing psychology: Why this price converts
- Payment options: Full pay vs installments (e.g., 3 x $X/month)
- Early bird discount: $X off for first Y students (creates urgency)
- Launch pricing: Special introductory rate, then increase to $X
- Bundle pricing: Course + coaching = $X (upsell)
- Revenue goals: X students @ $Y = $Z total revenue
- Break-even analysis: How many students to cover costs
- Profit margins: After platform fees, marketing costs, time investment

D. MARKETING CHANNELS (prioritized by ROI)
PRE-LAUNCH (4-6 Weeks Before):
Week 1-2:
- Build email list: Create lead magnet (free mini-course, checklist, webinar)
- Landing page: High-converting opt-in page
- Social media accounts: Set up profiles on 2-3 platforms where audience hangs out
- Content calendar: Plan 30 days of content
- Goal: 100-500 email subscribers before launch

Week 3-4:
- Email nurture sequence: 5-7 emails building trust and authority
- Social media content: 3-5 posts/week showcasing expertise
- Free value content: Blog posts, YouTube videos, podcast guest appearances
- Community engagement: Comment in relevant groups, answer questions
- Partnerships: Reach out to 5-10 influencers/affiliates for collaboration
- Goal: Warm up audience, build anticipation

Week 5-6:
- Launch announcement: Course coming soon, early bird offer
- Behind-the-scenes content: Course creation process, sneak peeks
- Live Q&A or webinar: Free training that leads to course offer
- Testimonial collection: From beta testers or previous students
- Countdown content: 7 days, 5 days, 3 days, 1 day to launch
- Goal: Pre-sell 10-50 spots

LAUNCH PHASE (Launch Week):
Day 1: Doors open email + social media announcement
Day 2: Reminder + student testimonial
Day 3: Case study or success story
Day 4: Address objections (FAQ email)
Day 5: Scarcity push (early bird ending soon)
Day 6: Last call (price going up tomorrow)
Day 7: Doors closed (no more enrollments until next cohort)

POST-LAUNCH (Ongoing - Evergreen Funnel):
- Automated email funnel: Welcome → Value → Offer → Scarcity → Close
- Webinar funnel: Automated webinar selling course 24/7
- YouTube SEO strategy: Rank for keywords audience searches
- Paid ads: Facebook, Google, YouTube ads to evergreen funnel
- Affiliate program: Recruit 20-100 affiliates promoting course
- Student testimonials: Collect and showcase wins regularly
- Referral program: "Refer a friend, get $X off next course"
- Goal: 10-50 students/month on autopilot

E. CONTENT STRATEGY (Authority Building)
10 Content Ideas to Attract Ideal Students:
1. [Content idea 1 based on instructor expertise]
2-10. [More ideas...]

Content Formats:
- Long-form YouTube videos (10-20 min teaching valuable concepts)
- Short-form social media (TikTok, Reels, Shorts - 30-60 sec hooks)
- Email newsletter (weekly value emails)
- Blog posts (SEO-optimized for Google traffic)
- Podcast episodes (guest appearances or own show)

F. LAUNCH TIMELINE (12-Week Plan to First $10K)
Week 1-4 (Foundation):
- Set up landing page and email capture
- Create lead magnet (free mini-course)
- Build email list to 100-500 people
- Daily social media content
- Identify 10 potential affiliate partners

Week 5-8 (Build Momentum):
- Launch beta version to 10-20 students (50% off)
- Collect testimonials and refine course
- Guest on 3-5 podcasts
- Create 10-15 YouTube videos
- Finalize sales page and course platform

Week 9-10 (Pre-Launch):
- Announce launch date
- Run free challenge or webinar
- Email daily (value-driven content)
- Behind-the-scenes content
- Build hype and anticipation

Week 11 (Launch Week):
- Open cart with early bird pricing
- Email 2-3x per day
- Live Q&A sessions
- Daily social media posts
- Close cart after 7 days

Week 12 (Post-Launch):
- Deliver course content
- Collect student wins
- Set up evergreen funnel
- Plan next launch

G. METRICS TO TRACK
- Email list growth: [Goal: +X/week]
- Email open rate: [Goal: 30-40%]
- Landing page conversion: [Goal: 30-50%]
- Sales page conversion: [Goal: 3-5%]
- Revenue: [Goal: $X in Year 1]
- Customer acquisition cost (CAC): [Goal: $X per student]
- Lifetime value (LTV): [Goal: $X per student]

H. BUDGET & COST BREAKDOWN
Startup Costs (One-Time):
- Course hosting platform: $X/month or $X/year
- Email marketing software: $X/month
- Landing page builder: $X/month
Total startup: $X

Monthly Operating Costs:
- Software subscriptions: $X/month
- Paid advertising (optional): $X/month
- Affiliate commissions: 20-30% of sales
Total monthly: $X

Revenue Projection (Year 1):
- Launch 1 (Month 3): X students @ $Y = $Z
- Launch 2 (Month 6): X students @ $Y = $Z
- Evergreen sales (Months 4-12): X students/month @ $Y = $Z
Total Year 1 Revenue: $X
Net Profit (after expenses): $X

I. QUICK-START ACTION PLAN (This Week)
Day 1: Set up course hosting platform and landing page
Day 2: Set up email marketing software and write welcome sequence
Day 3: Create 10 social media post ideas and schedule first week
Day 4: Outline course modules and create simple sales page
Day 5: Record lead magnet content and reach out to 3 affiliate partners
Day 6: Test email automation and checkout process
Day 7: Launch lead magnet and start building email list

J. EXPECTED TIMELINE TO FIRST SALE
Scenario 1 (Fast Track - Warm Audience): 1-4 weeks
Scenario 2 (Medium - Cold Audience): 6-12 weeks
Scenario 3 (Slow Build - Evergreen): 3-6 months

Make the plan practical, budget-conscious, and focused on PROFITABILITY. Include specific action items, realistic timelines, and revenue projections.
---MARKETING_PLAN_END---

Make all materials cohesive, professional, and actionable. Tailor everything to the instructor's expertise level and target audience.`

      try {
        // Add timeout with fallback
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000);
        
        let response;
        try {
          response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-5-2025-08-07',
              messages: [
                { role: 'system', content: 'You are a senior educational content creator with 20+ years experience generating comprehensive, professional teaching materials across all formats and audiences. You understand adult learning theory, course monetization, and modern teaching platforms.' },
                { role: 'user', content: prompt }
              ],
              max_completion_tokens: 7000,
            }),
            signal: ctrl
          });
          clearTimeout(t);
          } catch(ae){if(ae.name==='AbortError'){const c2=new AbortController();const t2=setTimeout(()=>c2.abort(),60000);resp=await fetch('https://ai.gateway.lovable.dev/v1/chat/completions',{method:'POST',headers:{'Authorization':`Bearer ${lovableApiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:'openai/gpt-5-mini',messages:[{role:'system',content:systemMessage},{role:'user',content:prompt}],max_completion_tokens:2500}),signal:c2.signal});clearTimeout(t2);}else throw ae;}
        } catch (abortErr) {
          if (abortErr.name === 'AbortError') {
            console.log('⚠️ GPT-5 timeout, falling back to GPT-5 Mini');
            const ctrl2 = new AbortController();
            const t2 = setTimeout(() => ctrl2.abort(), 60000);
            
            response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-5-mini-2025-08-07',
                messages: [
                  { role: 'system', content: 'You are a senior educational content creator with 20+ years experience generating comprehensive, professional teaching materials across all formats and audiences. You understand adult learning theory, course monetization, and modern teaching platforms.' },
                  { role: 'user', content: prompt }
                ],
                max_completion_tokens: 5000,
              }),
              signal: ctrl2.signal
            });
            clearTimeout(t2);
          } else {
            throw abortErr;
          }
        }

        // Text-first parsing
        let text = await response.text();
        
        if (!response.ok) {
          console.error('OpenAI API error:', response.status, text.slice(0, 300));
          
          if (response.status === 429) {
            return new Response(JSON.stringify({ 
              error: "Rate limit exceeded. Please try again in a moment." 
            }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          if (response.status === 402) {
            return new Response(JSON.stringify({ 
              error: "Insufficient credits. Please add credits to continue." 
            }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          return new Response(JSON.stringify({
            error: `OpenAI error ${response.status}`,
            details: text.slice(0, 300)
          }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const aiResponse = JSON.parse(text);
        const fullContent = aiResponse.choices[0].message.content;
        
        if (!fullContent) {
          console.error('[generate-teaching-content] AI response missing content');
          return new Response(JSON.stringify({ 
            error: "AI returned empty content. Please try again." 
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Function to clean markdown formatting
        const cleanMarkdown = (text: string): string => {
          return text
            .replace(/^#{1,6}\s+/gm, '')           // Remove markdown headers
            .replace(/\*\*\*(.+?)\*\*\*/g, '$1')   // Remove ***bold italic***
            .replace(/\*\*(.+?)\*\*/g, '$1')       // Remove **bold**
            .replace(/\*(.+?)\*/g, '$1')           // Remove *italic*
            .replace(/#{2,}/g, '')                 // Remove multiple #
            .replace(/\n{3,}/g, '\n\n')            // Normalize line breaks
            .trim()
        }

        // Parse the response into sections
        const extractSection = (content: string, startMarker: string, endMarker: string): string => {
          const startIndex = content.indexOf(startMarker)
          const endIndex = content.indexOf(endMarker)
          if (startIndex === -1 || endIndex === -1) {
            return 'Content not found'
          }
          return cleanMarkdown(content.substring(startIndex + startMarker.length, endIndex))
        }

        const webinarConcepts = extractSection(fullContent, '---WEBINAR_CONCEPTS_START---', '---WEBINAR_CONCEPTS_END---')
        const courseOutline = extractSection(fullContent, '---COURSE_OUTLINE_START---', '---COURSE_OUTLINE_END---')
        const handouts = extractSection(fullContent, '---HANDOUTS_START---', '---HANDOUTS_END---')
        const lessonScript = extractSection(fullContent, '---LESSON_SCRIPT_START---', '---LESSON_SCRIPT_END---')
        const toolsAndPlatforms = extractSection(fullContent, '---TOOLS_PLATFORMS_START---', '---TOOLS_PLATFORMS_END---')
        const marketingPlan = extractSection(fullContent, '---MARKETING_PLAN_START---', '---MARKETING_PLAN_END---')

        await logRequest({
          endpoint: "generate-teaching-content",
          userId,
          ip,
          success: true,
          creditsCharged: 5,
          requestDurationMs: Date.now() - startTime
        });
        
        return new Response(
          JSON.stringify({
            webinarConcepts,
            courseOutline,
            handouts,
            lessonScript,
            toolsAndPlatforms,
            marketingPlan
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      } catch (error) {
        console.error('Error in all-materials generation:', error)
        throw error
      }
    }

    // Handle individual content types
    switch (type) {
      case 'webinar-plan':
        prompt = `Create a comprehensive webinar plan for:
Webinar Topic: ${data.topic}
Duration: ${data.duration} minutes
Instructor Skills: ${data.skills}
${data.industry ? `Industry: ${data.industry}` : ''}
${data.experience ? `Years of Experience: ${data.experience}` : ''}
${data.education ? `Education: ${data.education}` : ''}
${data.certifications ? `Certifications: ${data.certifications}` : ''}
${data.targetAudience ? `Target Audience: ${data.targetAudience}` : ''}
${data.objectives ? `Learning Objectives: ${data.objectives}` : ''}

Create a detailed webinar plan including:
1. Opening & Introduction (5 minutes) - Welcome, agenda overview, and icebreaker
2. Main Content Sections with timing - Break into 3-4 key topics with specific time allocations
3. Interactive Elements - Q&A segments, polls, or activities
4. Key Talking Points - Bullet points for each section
5. Visual Aids Needed - Slides or materials to prepare
6. Engagement Strategies - How to keep audience engaged
7. Conclusion & Next Steps (5 minutes) - Summary and call to action

Make it practical and actionable. Use plain text without markdown.`
        break

      case 'course-outline':
        prompt = `Create a comprehensive course outline for:
Course Name: ${data.courseName}
Target Level: ${data.targetLevel}
Course Duration: ${data.duration} weeks
Instructor Skills: ${data.skills}
${data.industry ? `Industry: ${data.industry}` : ''}
${data.experience ? `Years of Experience: ${data.experience}` : ''}
${data.education ? `Education: ${data.education}` : ''}
${data.certifications ? `Certifications: ${data.certifications}` : ''}
${data.objectives ? `Course Objectives: ${data.objectives}` : ''}

Create a detailed course outline with:
1. Course Overview - Brief description and who it's for
2. Prerequisites - What students should know before starting
3. Learning Outcomes - What students will achieve
4. Module Breakdown - Create ${Math.ceil(parseInt(data.duration) / 2)} modules, each with:
   • Module title and overview
   • 3-5 lessons per module with specific topics
   • Key concepts covered
   • Learning activities
   • Assessment methods
5. Required Materials - What students need
6. Time Commitment - Expected hours per week
7. Final Project/Assessment - Culminating activity

Make it structured and comprehensive. Use plain text without markdown.`
        break

      case 'handout':
        prompt = `Create a ${data.handoutType} handout for:
Handout Title: ${data.title}
Topic: ${data.topic}
Instructor Skills: ${data.skills}
${data.industry ? `Industry: ${data.industry}` : ''}
${data.experience ? `Years of Experience: ${data.experience}` : ''}
${data.education ? `Education: ${data.education}` : ''}
${data.certifications ? `Certifications: ${data.certifications}` : ''}
${data.keyPoints ? `Key Points to Include: ${data.keyPoints}` : ''}

Create a professional ${data.handoutType} that includes:
${data.handoutType === 'reference' ? `
1. Overview - Brief introduction to the topic
2. Key Concepts - Main ideas and definitions
3. Step-by-Step Guide - Detailed instructions or processes
4. Examples - Real-world applications
5. Tips & Best Practices - Pro advice
6. Common Mistakes to Avoid
7. Additional Resources - Where to learn more
` : data.handoutType === 'worksheet' ? `
1. Instructions - Clear directions for completion
2. Exercises - 5-7 practice activities
3. Real-World Scenarios - Application questions
4. Reflection Questions - Critical thinking prompts
5. Self-Assessment - How to evaluate your work
` : data.handoutType === 'checklist' ? `
1. Pre-Work Items - Things to prepare
2. Main Steps - Ordered action items with checkboxes
3. Quality Checks - Verification points
4. Completion Criteria - How to know you're done
5. Troubleshooting - Common issues and solutions
` : data.handoutType === 'template' ? `
1. Template Structure - Outline to follow
2. Section Descriptions - What goes in each part
3. Sample Content - Examples for each section
4. Customization Tips - How to adapt it
5. Usage Guidelines - Best practices
` : `
1. Quick Reference Table - Key information at a glance
2. Essential Formulas/Commands - Important to remember
3. Common Patterns - Frequently used approaches
4. Quick Tips - Time-saving shortcuts
5. Troubleshooting Guide - Fast solutions
`}

Make it practical and student-friendly. Use plain text without markdown.`
        break

      case 'lesson-script':
        prompt = `Create an engaging lesson script for:
Lesson Title: ${data.lessonTitle}
Topic: ${data.topic}
Duration: ${data.duration} minutes
Instructor Skills: ${data.skills}
${data.industry ? `Industry: ${data.industry}` : ''}
${data.experience ? `Years of Experience: ${data.experience}` : ''}
${data.education ? `Education: ${data.education}` : ''}
${data.certifications ? `Certifications: ${data.certifications}` : ''}
${data.learningObjectives ? `Learning Objectives: ${data.learningObjectives}` : ''}
${data.keyTopics ? `Key Topics: ${data.keyTopics}` : ''}

Create a detailed lesson script with:
1. Opening (2-3 minutes)
   • Warm welcome and introduction
   • Hook/attention grabber related to topic
   • Preview of what will be covered

2. Introduction to Topic (5 minutes)
   • Context and importance
   • Real-world relevance
   • Learning objectives stated clearly

3. Main Content (${parseInt(data.duration) - 10} minutes)
   Break into 3-4 segments, each with:
   • Concept explanation with examples
   • Analogies or stories to illustrate
   • Visual descriptions
   • Student interaction points (questions, activities)
   • Common misconceptions to address

4. Practice/Application (5 minutes)
   • Guided practice example
   • Student activity or exercise
   • Check for understanding

5. Conclusion (3-5 minutes)
   • Recap key points
   • Answer questions
   • Preview next lesson
   • Homework or practice assignment

Include timing notes and speaker cues. Make it conversational and engaging. Use plain text without markdown.`
        break

      default:
        throw new Error('Invalid content type')
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 3500
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
    console.error('Error generating teaching content:', error)
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await logRequest({
      endpoint: "generate-teaching-content",
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
