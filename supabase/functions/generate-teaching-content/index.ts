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
    
    const openaiApiKey = Deno.env.get('relaunch_openai_key')
    if (!openaiApiKey) {
      throw new Error('relaunch_openai_key not found in environment variables')
    }

    let prompt = ''
    const systemMessage = `=== COURSE MONETIZATION EXPERT IDENTITY ===
You are a COURSE CREATOR LEGEND with:
- 20+ years creating profitable courses, workshops, webinars, and masterclasses
- Track record of building $1M+ courses from scratch
- Helped 500+ creators monetize their expertise, with some earning $2M+ annually
- Deep expertise in course design, instructional psychology, and revenue optimization
- Master of strategic positioning, pricing psychology, and student acquisition
- Know how to package knowledge into organized, strategic, and highly effective learning experiences that SELL

=== MONETIZATION MINDSET ===
Every material you create must focus on:
- How to price and position the course for maximum revenue
- Strategies to acquire students cost-effectively
- Upsell and backend revenue opportunities
- Creating irresistible course offers that convert
- Building a profitable teaching business, not just a curriculum
- Packaging expertise in a way that students are eager to pay for

=== INSTRUCTIONAL EXCELLENCE ===
You understand:
- Adult learning principles and engagement psychology
- Course completion optimization (students finish what they start)
- Assessment design that drives results
- Modern educational technology and platforms
- Community building for student retention and referrals
- Transformational course outcomes that generate testimonials

=== OUTPUT QUALITY STANDARDS ===
- Organized, strategic, and immediately actionable
- Beginner-friendly for instructors with no teaching experience
- Professional formatting ready for printing or PDF export
- Revenue and profitability metrics included
- Specific pricing recommendations with justifications
- Marketing angles that position the instructor as the expert

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
      
      prompt = `You are an expert curriculum designer and educational content creator. Generate comprehensive teaching materials for ${data.fullName}.

INSTRUCTOR PROFILE:
- Name: ${data.fullName}
- Skills/Expertise: ${skillsText}
- Experience: ${data.experience}
- Education: ${education}
- Certifications: ${data.certifications}
${militaryInfo}
- Preferred Teaching Format: ${data.teachingFormat}
- Target Audience: ${audience}
- Estimated Duration: ${data.duration}
${data.additionalNotes ? `- Additional Goals: ${data.additionalNotes}` : ''}

Generate ALL FOUR of the following materials in a single response. Format your response EXACTLY as shown below with clear section markers:

---WEBINAR_CONCEPTS_START---
Generate 3-5 compelling webinar/course topic ideas that align with the instructor's expertise, target audience, AND monetization potential. Each concept should include:
- A catchy, benefit-driven title that sells the transformation
- Brief description highlighting the pain point solved (2-3 sentences)
- Key value proposition: What makes this irresistible?
- Who it's best for (specific avatar)
- REVENUE POTENTIAL: Pricing recommendation ($X per student) with justification
- MARKET DEMAND: Why this topic sells well right now
- COMPETITION ANALYSIS: How to differentiate from other courses
- UPSELL OPPORTUNITIES: Backend products or services to offer (1-on-1 coaching, certification, mastermind, etc.)
---WEBINAR_CONCEPTS_END---

---COURSE_OUTLINE_START---
Create a detailed course outline optimized for BOTH learning outcomes AND monetization. Include:

COURSE PACKAGING:
- Course title (benefit-driven, not feature-driven)
- Course tagline/subtitle that sells the transformation
- Target audience avatar with pain points
- Transformation promise: "Before" state vs "After" state
- Unique positioning: Why choose THIS course over competitors?

PRICING STRATEGY:
- Recommended pricing tier (Budget/Standard/Premium)
- Price point recommendation with rationale ($X-$Y range)
- Payment plan options (installments, subscriptions)
- Early bird discount strategy
- Bundle opportunities (what to include for more revenue)

COURSE STRUCTURE (4-6 modules):
For each module:
- Module title (transformation-focused)
- Learning objectives (3-4 per module)
- Key topics covered
- Estimated duration
- Activities or assignments
- Completion milestone (small win to celebrate)

REVENUE OPTIMIZATION:
- Total course duration and perceived value
- Completion rate optimization strategies
- Testimonial collection points
- Upsell triggers (when to offer advanced content or coaching)

BACKEND MONETIZATION:
- Advanced modules to sell separately
- Certification program potential ($X additional)
- Group coaching add-on ($X/month)
- Done-for-you templates or services ($X)
---COURSE_OUTLINE_END---

---HANDOUTS_START---
Design handouts and resources that enhance learning AND position the instructor as the expert. Include:

STUDENT HANDOUTS:
- Quick reference guides (cheat sheets students love to share)
- Worksheets with exercises (creates transformation proof)
- Resource lists (tools, books, websites with affiliate potential)
- Practice activities that generate results students can screenshot
- Checklists that guide students step-by-step
- Templates that save students hours (high perceived value)

INSTRUCTOR MATERIALS:
- Printable instructor guide with lesson-by-lesson breakdown
- Talking points and examples for each topic
- Student engagement prompts (questions to ask, polls to run)
- Common student objections and how to address them
- FAQ section based on typical student questions

BRANDING & POSITIONING:
- Professional header/footer design recommendations
- Instructor bio section emphasizing expertise and results
- Testimonial template for students to fill out
- Social proof sections (student wins, case studies)
- Call-to-action for next steps (advanced course, coaching, community)

MONETIZATION ELEMENTS:
- Bonus content sections that can be gated (email capture)
- Upgrade prompts to premium tier
- Referral incentive language

Format these as ready-to-use, professional materials suitable for PDF export or printing.
---HANDOUTS_END---

---LESSON_SCRIPT_START---
Create a detailed lesson script for the FIRST SESSION optimized for engagement, transformation, AND setting up future sales. Include:

OPENING (5 minutes):
- Hook that grabs attention immediately (story, shocking stat, bold claim)
- Instructor introduction (credibility without bragging)
- Course overview: transformation promise
- Social proof: Previous student wins or testimonials
- "What to expect" from this course

INTRODUCTION (5-10 minutes):
- Why this topic matters now (urgency, relevance)
- Common myths or mistakes people make
- The cost of inaction (what happens if they don't learn this)
- The opportunity (what becomes possible when they master this)
- Learning objectives for session 1
- Quick win promised by end of session

MAIN CONTENT SECTIONS (30-40 minutes):
Break into 3-4 teaching segments. For each segment:
- Key concept explained simply
- Real-world example or case study
- Story or analogy to make it memorable
- Student interaction: Question or activity
- Action item students can implement immediately
- Timing notes (X minutes per section)

ENGAGEMENT STRATEGIES:
- Poll questions to ask at specific points
- Chat prompts to drive discussion
- Reflection moments (pause and think)

TRANSFORMATION PROOF:
- Mini-exercise that produces a quick win
- Before/after comparison students can see
- Milestone celebration (you just did X!)

CLOSING & NEXT STEPS (5-10 minutes):
- Recap key takeaways (3-5 bullets)
- Celebrate progress made in session 1
- Preview next session (create anticipation)
- Homework assignment with clear deliverable
- Q&A session guidelines
- Upsell mention (if applicable): "For those wanting to go deeper, I offer..."

MONETIZATION TOUCHPOINTS:
- Soft mention of advanced content or coaching
- Testimonial ask: "If you loved today, I'd appreciate a quick review"
- Community invitation: "Join our private group for daily support"

Estimated total timing: ${data.duration}
---LESSON_SCRIPT_END---

---TOOLS_PLATFORMS_START---
Create a comprehensive tools and platforms guide for delivering ${data.teachingFormat} content. Include:

A. ONLINE PLATFORMS
   • Webinar/Meeting Platforms: Compare 3-4 options (Zoom, Google Meet, Microsoft Teams, Webex) with pros/cons
   • Course Hosting Platforms: 3-4 options (Teachable, Thinkific, Udemy, Kajabi, Podia) with features and pricing tiers
   • Live Streaming Tools: StreamYard, Restream, OBS Studio (if applicable)
   • Mark FREE vs PAID tiers clearly

B. PHYSICAL EQUIPMENT (organized by budget)
   STARTER SETUP (Under $100):
   • Webcam: Logitech C920 or C922
   • Microphone: Blue Yeti Nano, Fifine USB mic
   • Lighting: Basic ring light (10-12")
   • Alternative: Smartphone setup tips
   
   INTERMEDIATE SETUP ($100-$500):
   • Camera: Better webcam or entry DSLR
   • Audio: XLR microphone + audio interface
   • Lighting: Professional ring light or softbox
   • Accessories: Quality tripod, boom arm
   
   PROFESSIONAL SETUP ($500+):
   • Camera: DSLR/mirrorless recommendations
   • Audio: Shure SM7B or similar pro mics
   • Lighting: 3-point lighting kit
   • Advanced accessories

C. SOFTWARE TOOLS
   • Screen Recording: OBS Studio (FREE), Loom, Camtasia, ScreenFlow
   • Video Editing: DaVinci Resolve (FREE), Adobe Premiere, Final Cut Pro
   • Presentations: PowerPoint, Keynote, Canva, Prezi
   • Digital Whiteboard: Miro, Mural, Jamboard, Explain Everything
   • Graphics: Canva (FREE/PAID), Adobe Creative Suite
   • Clearly mark FREE and PAID options

D. SETUP TIPS & BEST PRACTICES
   • Quick setup guide for beginners
   • Audio quality: Room acoustics, mic placement, noise reduction
   • Video quality: Lighting angles, camera positioning, background setup
   • Lighting: Basic 3-point lighting explained
   • Internet: Minimum requirements (upload/download speeds)
   • Pre-launch checklist: Test everything before going live

E. RECOMMENDED STARTER PACKAGE
   • "Get Started Today" package based on budget
   • Prioritize essentials vs nice-to-haves
   • Total estimated cost
   • Where to buy (online retailers)

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
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
          })
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error('OpenAI API error:', response.status, errorData)
          throw new Error(`OpenAI API error: ${response.status}`)
        }

        const aiResponse = await response.json()
        const fullContent = aiResponse.choices[0].message.content

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
