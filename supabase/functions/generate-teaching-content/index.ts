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
    const systemMessage = 'You are a senior instructional designer and curriculum expert with 20+ years creating courses, webinars, and educational programs across corporate training, higher education, and online learning platforms. You understand adult learning principles, engagement strategies, assessment design, and modern educational technology. You specialize in helping subject matter experts transform their knowledge into profitable teaching businesses. Provide responses in clean, plain text format without any markdown formatting. Use simple bullet points (•) if lists are needed.'

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
Generate 3-5 compelling webinar/course topic ideas that align with the instructor's expertise and target audience. Each concept should include:
- A catchy title
- Brief description (2-3 sentences)
- Key value proposition
- Who it's best for
---WEBINAR_CONCEPTS_END---

---COURSE_OUTLINE_START---
Create a detailed course outline with:
- Course title and overview
- 4-6 modules/sessions with:
  * Module title
  * Learning objectives (3-4 per module)
  * Key topics covered
  * Estimated duration
  * Activities or assignments
---COURSE_OUTLINE_END---

---HANDOUTS_START---
Design handouts and resources including:
- Quick reference guides
- Worksheets with exercises
- Resource lists (tools, books, websites)
- Practice activities
- Checklists
Format these as ready-to-use materials.
---HANDOUTS_END---

---LESSON_SCRIPT_START---
Create a detailed lesson script for the first session including:
- Opening hook (2-3 minutes)
- Introduction and learning objectives
- Main content sections with:
  * Key talking points
  * Examples to share
  * Questions to ask
  * Interactive elements
- Closing and call-to-action
- Estimated timing for each section
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
Create a comprehensive marketing plan to promote and sell the ${data.teachingFormat}. Include:

A. TARGET AUDIENCE ANALYSIS
   • Demographics: Age, profession, income level
   • Pain points: Problems they need solved
   • Where they hang out: Platforms, communities, forums
   • What motivates them: Goals and desired outcomes

B. UNIQUE VALUE PROPOSITION
   • What makes this course/webinar different
   • Key benefits (not just features)
   • Transformation promised to students
   • Social proof opportunities (testimonials, credentials)

C. MARKETING CHANNELS (prioritized by effectiveness)
   PRE-LAUNCH (Weeks 1-4):
   • Email list building: Lead magnet ideas, landing page strategy
   • Social media: Which platforms, content calendar (3-5 posts/week)
   • Content marketing: Blog posts, YouTube videos, podcast appearances
   • Partnerships: Collaborations, guest appearances, affiliate partnerships
   
   LAUNCH PHASE (Week of launch):
   • Launch sequence: Email campaign timeline
   • Social media blitz: Daily content plan
   • Live events: Webinars, Q&A sessions, free workshops
   • Paid advertising: Budget allocation if applicable
   
   POST-LAUNCH (Ongoing):
   • Evergreen funnel: Automated email sequence
   • Student testimonials: Collection and showcase strategy
   • Referral program: Incentives for students to share
   • Community building: Group, forum, or membership

D. CONTENT STRATEGY
   • 10 content ideas to attract ideal students
   • Content formats: Videos, posts, emails, live streams
   • SEO keywords to target (if applicable)
   • Content calendar outline for first month

E. PRICING STRATEGY
   • Recommended price point based on value and audience
   • Early bird discount: Amount and duration
   • Payment plans: Options to increase accessibility
   • Upsells/add-ons: Bonus materials, coaching, community access

F. LAUNCH TIMELINE (90-day plan)
   Week 1-4 (Pre-launch):
   • Specific weekly goals and tasks
   
   Week 5-8 (Build momentum):
   • Content creation and audience engagement
   
   Week 9-12 (Launch and optimize):
   • Launch activities and post-launch follow-up

G. METRICS TO TRACK
   • Website/landing page visitors
   • Email list growth
   • Social media engagement rates
   • Conversion rates
   • Revenue targets

H. QUICK-START ACTION PLAN
   • 5 things to do THIS WEEK to start marketing
   • Free vs paid marketing tactics
   • Minimum budget needed (if any)
   • Expected timeline to first sale

Make the plan practical, budget-conscious, and focused on organic/low-cost strategies. Include specific action items and realistic timelines.
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
