import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Award, BookOpen, Clock, Target, Filter } from 'lucide-react';
import { InteractiveLearningModule } from './InteractiveLearningModule';

// Real course content - AI & Technology and Business Building
const learningModules = [
  {
    id: 'ai-technology',
    title: 'AI & Technology for Everyday People',
    description: 'Master AI tools and concepts without tech overwhelm - designed specifically for non-technical people',
    duration: '10-12 weeks',
    level: 'Beginner',
    skills: ['AI Literacy', 'Productivity Tools', 'Digital Confidence', 'Future-Proofing'],
    certificate: 'AI Literacy for Everyday People Certificate',
    lessons: [
      {
        id: 'what-is-ai',
        title: 'What Exactly Is AI, and Why Should I Care?',
        description: 'Breaks down AI in simple terms and explains why it\'s relevant to daily life',
        duration: '20 min',
        completed: false,
        content: `Welcome to AI & Technology for Everyday People!

In this course, we'll demystify AI and show you exactly how it can improve your daily life - no tech degree required.

What You'll Learn in This Lesson:
• What AI really is (in plain English)
• Why AI matters to YOU personally
• How AI is already part of your daily routine
• Simple examples you can relate to
• Why you don't need to be afraid of AI

Key Takeaway: AI isn't magic or rocket science - it's a powerful tool that can make your life easier, more productive, and more enjoyable. Think of it as having a really smart assistant who never gets tired and is always ready to help.

By the end of this lesson, you'll understand exactly what AI is and why it's worth learning about - even if you consider yourself "not a tech person."`,
        quiz: [
          {
            id: 'q1',
            question: 'What is the best way to think about AI for everyday people?',
            options: [
              'A complicated computer program only experts can use',
              'A smart assistant that can help make life easier',
              'Something only young people can understand',
              'A replacement for human thinking'
            ],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 'ai-makes-life-easier',
        title: 'How AI Can Make Life Easier — Even If You\'re Not Techy',
        description: 'Covers the real-world benefits of AI without overwhelming jargon',
        duration: '22 min',
        completed: false,
        content: `How AI Makes Life Easier for Regular People

You don't need to understand how a car engine works to drive to the grocery store. Same with AI - you don't need to know the technical details to benefit from it.

Real-World AI Benefits:
• Saves you time on routine tasks
• Helps you make better decisions
• Reduces mental fatigue from "thinking about everything"
• Makes complex tasks feel simple
• Gives you confidence in new situations

Everyday Examples:
• GPS apps that find the fastest route (that's AI!)
• Email apps that filter spam automatically
• Streaming services that suggest movies you'll like
• Voice assistants that set timers and reminders
• Shopping apps that help you find what you're looking for

The best part? You're probably already using AI and didn't even know it. This lesson shows you how to recognize AI in your daily life and start using it more intentionally.`,
        quiz: [
          {
            id: 'q2',
            question: 'Which of these is an example of AI you might already use?',
            options: [
              'A basic calculator',
              'A paper calendar',
              'Netflix movie recommendations',
              'A printed map'
            ],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 'ai-productivity',
        title: 'Let AI Help You Get More Done — Without Doing More',
        description: 'Explains how AI can increase productivity and ease mental load',
        duration: '25 min',
        completed: false,
        content: `Work Smarter, Not Harder with AI

The secret to productivity isn't working more hours - it's letting AI handle the boring, repetitive stuff so you can focus on what matters most.

AI Productivity Boosters:
• Automatic scheduling and calendar management
• Email drafting and response suggestions
• Task prioritization and planning
• Research and information gathering
• Document creation and editing
• Social media content planning

Mental Load Relief:
AI can help reduce the constant mental juggling we all do by:
• Remembering important dates and deadlines
• Organizing your thoughts and ideas
• Breaking big projects into manageable steps
• Keeping track of multiple ongoing tasks
• Suggesting next steps when you're stuck

Real Example: Instead of spending 30 minutes writing a professional email, you can give AI the key points and have a polished draft in 2 minutes. Then you spend your saved time on things that actually need your human touch.`,
        quiz: [
          {
            id: 'q3',
            question: 'What is the main benefit of using AI for productivity?',
            options: [
              'Working longer hours',
              'Replacing all human work',
              'Handling routine tasks so you can focus on important things',
              'Making everything completely automatic'
            ],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 'ai-work-confidence',
        title: 'Using AI to Boost Your Confidence and Skills at Work',
        description: 'Shows how AI can help with resumes, interviews, and job readiness',
        duration: '28 min',
        completed: false,
        content: `Build Work Confidence with AI Support

Whether you're job searching, wanting a promotion, or just trying to feel more confident at work, AI can be your secret weapon for professional growth.

Resume & Job Search Help:
• Writing compelling resume bullets
• Tailoring your resume for specific jobs
• Practicing interview questions and answers
• Researching companies before interviews
• Writing professional cover letters
• LinkedIn profile optimization

Daily Work Confidence:
• Drafting professional emails and messages
• Preparing for meetings and presentations
• Learning new skills relevant to your job
• Staying updated on industry trends
• Problem-solving when you're stuck
• Communicating complex ideas clearly

Career Development:
• Identifying skills gaps and learning paths
• Setting realistic professional goals
• Building a professional online presence
• Networking conversation starters
• Salary negotiation preparation

Remember: AI doesn't replace your unique value - it amplifies it by helping you present your best professional self.`,
        quiz: [
          {
            id: 'q4',
            question: 'How can AI help with job interviews?',
            options: [
              'By attending the interview for you',
              'By helping you practice questions and research the company',
              'By guaranteeing you get the job',
              'By making you seem more technical'
            ],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 'ai-personal-helper',
        title: 'How AI Can Be Your Personal Helper (No Tech Degree Needed)',
        description: 'Discusses everyday uses like scheduling, reminders, and planning',
        duration: '24 min',
        completed: false,
        content: `Your AI Personal Assistant

Think of AI as having a personal assistant who's available 24/7, never gets tired, and is great at organizing, planning, and remembering things.

Personal Organization:
• Managing your calendar and appointments
• Setting smart reminders and follow-ups
• Creating and organizing to-do lists
• Planning meals and grocery lists
• Tracking habits and goals
• Managing household tasks and maintenance

Planning & Decision Making:
• Travel planning and itinerary creation
• Event planning and coordination
• Budget planning and expense tracking
• Gift ideas and holiday planning
• Health and wellness planning
• Family activity suggestions

Daily Life Support:
• Weather and traffic updates
• News summaries on topics you care about
• Recipe suggestions based on what you have
• Entertainment recommendations
• Learning new skills or hobbies
• Staying connected with friends and family

The key is starting small with one or two areas where you'd most like help, then gradually expanding as you get comfortable.`,
        quiz: [
          {
            id: 'q5',
            question: 'What\'s the best way to start using AI as a personal helper?',
            options: [
              'Try to use AI for everything at once',
              'Start with one or two areas where you need the most help',
              'Only use it for work-related tasks',
              'Wait until you understand all the technology'
            ],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 'ai-smart-employee',
        title: 'Let AI Work With You — Like a Smart Employee You Don\'t Have to Pay',
        description: 'Describes AI as a support tool that can "do the boring stuff" for you',
        duration: '26 min',
        completed: false,
        content: `AI: Your Unpaid Intern Who Never Complains

Imagine having a team member who's excellent at research, writing first drafts, organizing information, and handling repetitive tasks - and they work for free, 24/7.

What Your "AI Employee" Can Do:
• Research topics thoroughly and summarize findings
• Write first drafts of emails, documents, and reports
• Organize and categorize information
• Create outlines and structure for projects
• Generate ideas and brainstorm solutions
• Proofread and improve your writing
• Create schedules and manage timelines
• Handle data entry and organization

The Perfect Partnership:
• AI handles the grunt work
• You provide the creativity, judgment, and personal touch
• AI does the initial heavy lifting
• You refine, personalize, and make final decisions
• AI processes information quickly
• You interpret and apply it to your specific situation

Best Practices:
• Always review and edit AI output
• Use AI as a starting point, not the final product
• Combine AI efficiency with your human insight
• Be specific about what you need
• Think of AI as a collaborator, not a replacement

This partnership approach helps you accomplish more while staying true to your own voice and values.`,
        quiz: [
          {
            id: 'q6',
            question: 'What\'s the best way to work with AI?',
            options: [
              'Let AI make all decisions for you',
              'Use AI output exactly as it\'s generated',
              'Partner with AI - let it handle grunt work while you add creativity and judgment',
              'Only use AI for simple tasks'
            ],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 'ai-future-relevance',
        title: 'What AI Means for the Future — and Why You Still Matter',
        description: 'Encourages hope, self-worth, and staying relevant in a tech-driven world',
        duration: '30 min',
        completed: false,
        content: `Your Value in an AI World

The rise of AI doesn't diminish your worth - it actually makes your uniquely human qualities more valuable than ever.

What AI Can't Replace:
• Emotional intelligence and empathy
• Creative problem-solving and innovation
• Personal relationships and trust
• Cultural understanding and context
• Ethical judgment and values
• Leadership and inspiration
• Adaptability and learning from experience
• Intuition and "gut feelings"

Why You're More Valuable, Not Less:
• AI amplifies human capabilities
• Human oversight and judgment are essential
• Personal connection becomes a premium service
• Creative and strategic thinking are in high demand
• Emotional support and understanding can't be automated
• Cultural sensitivity and personal touch matter more

Future-Proofing Your Value:
• Focus on developing your uniquely human skills
• Learn to collaborate with AI effectively
• Stay curious and adaptable
• Cultivate emotional intelligence
• Build genuine relationships
• Develop critical thinking skills
• Embrace continuous learning

The future belongs to humans who can work WITH AI, not those who try to compete against it or ignore it entirely.`,
        quiz: [
          {
            id: 'q7',
            question: 'What makes humans valuable in an AI world?',
            options: [
              'Ability to work faster than AI',
              'Knowledge of technical programming',
              'Emotional intelligence, creativity, and personal relationships',
              'Resistance to using new technology'
            ],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 'creating-with-ai',
        title: 'Creating with AI: Writing, Ideas, Videos, and More',
        description: 'A gentle intro to AI tools for content creators, writers, artists, etc.',
        duration: '32 min',
        completed: false,
        content: `Unleash Your Creativity with AI

AI isn't here to replace human creativity - it's here to amplify it. Think of AI as your creative partner who can help you brainstorm, overcome creative blocks, and bring your ideas to life faster.

Creative Applications:
• Writing assistance: blogs, stories, emails, social media
• Visual content: images, graphics, presentations
• Video creation: scripts, editing, thumbnails
• Music and audio: composition, editing, podcasts
• Idea generation: brainstorming sessions, concept development
• Content planning: editorial calendars, themes, series

Breaking Through Creative Blocks:
• Use AI to generate initial ideas when you're stuck
• Get feedback and suggestions on your work
• Explore different angles and approaches
• Create variations and alternatives quickly
• Research and inspiration gathering
• Overcoming the "blank page" problem

Practical Creative Workflows:
1. Start with your concept or goal
2. Use AI to brainstorm and expand ideas
3. Let AI create initial drafts or mockups
4. Add your personal touch, style, and voice
5. Refine and iterate with AI assistance
6. Polish the final result with your expertise

Remember: AI gives you the building blocks - you create the masterpiece. Your unique perspective, experiences, and voice are what make the final creation truly yours.`,
        quiz: [
          {
            id: 'q8',
            question: 'How should AI be used in creative work?',
            options: [
              'To completely replace human creativity',
              'As a creative partner to amplify and support your ideas',
              'Only for technical tasks',
              'To copy other people\'s work'
            ],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 'ai-history-future',
        title: 'The Story of AI: Where It Started and Where It\'s Going',
        description: 'An engaging overview of AI history, simplified for non-tech folks',
        duration: '18 min',
        completed: false,
        content: `The AI Journey: From Science Fiction to Your Phone

Understanding AI's story helps you see where we are now and where we're headed - without the hype or fear.

AI's Simple Timeline:
• 1950s-60s: Scientists dream of "thinking machines"
• 1970s-80s: Early computer programs that could play games
• 1990s-2000s: AI gets better at specific tasks (like chess)
• 2010s: AI learns to recognize images and understand speech
• 2020s: AI can have conversations and create content
• Future: AI becomes a seamless part of daily life

Key Breakthroughs Made Simple:
• Pattern Recognition: AI learned to see patterns in data
• Machine Learning: AI learned to improve from experience
• Deep Learning: AI learned to think in layers (like humans)
• Natural Language: AI learned to understand and speak human language
• Generative AI: AI learned to create new content

What This Means for You:
• AI has been steadily improving for decades
• Each breakthrough makes AI more useful for regular people
• We're in an exciting phase where AI can actually help with everyday tasks
• The technology will keep getting better and easier to use
• You don't need to understand the technical details to benefit

The future isn't about AI taking over - it's about AI becoming an invisible helper that makes life more convenient, productive, and enjoyable.`,
        quiz: [
          {
            id: 'q9',
            question: 'What\'s the most important thing to understand about AI\'s development?',
            options: [
              'It happened overnight',
              'It\'s been gradually improving for decades to become more helpful',
              'Only tech experts can benefit from it',
              'It will stop improving soon'
            ],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 'staying-relevant',
        title: 'Staying Relevant in a Fast-Changing, Tech-Heavy World',
        description: 'Motivational video about adapting and staying marketable',
        duration: '28 min',
        completed: false,
        content: `Thrive in a Changing World

Change can feel overwhelming, but you have more power to adapt and stay relevant than you think. This lesson is about building confidence for the future.

Your Adaptation Superpowers:
• Life experience that can't be taught
• Emotional intelligence developed over time
• Problem-solving skills from real-world challenges
• Ability to learn and adapt (you've done it before!)
• Unique perspective and insights
• Relationships and networks you've built
• Values and judgment that come from experience

Staying Marketable Strategies:
• Focus on skills that complement AI, don't compete with it
• Develop your communication and people skills
• Stay curious and open to learning new things
• Build bridges between technology and human needs
• Cultivate your unique expertise and knowledge
• Practice continuous small improvements
• Network and maintain relationships

The Growth Mindset:
• View challenges as opportunities to grow
• Embrace "I don't know yet" instead of "I can't"
• Celebrate small wins and progress
• Learn from setbacks without giving up
• Stay curious about new developments
• Ask questions and seek help when needed

Remember: Every generation has faced technological change. Your grandparents adapted to cars, phones, and computers. You can adapt to AI. The key is starting now and taking it one step at a time.`,
        quiz: [
          {
            id: 'q10',
            question: 'What\'s the most important mindset for staying relevant?',
            options: [
              'Resist all technological change',
              'Try to compete directly with AI',
              'Embrace continuous learning and focus on uniquely human skills',
              'Wait for things to go back to how they were'
            ],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 'future-proof-skills',
        title: 'Future-Proof Skills You Can Learn Now — No Matter Your Age',
        description: 'Focuses on digital literacy, creativity, and communication',
        duration: '25 min',
        completed: false,
        content: `Skills That Will Always Be Valuable

These skills become more valuable as AI handles routine tasks. The good news? You can develop all of these at any age and stage of life.

Core Future-Proof Skills:

Digital Literacy:
• Comfortable using basic technology
• Understanding how to learn new digital tools
• Knowing how to find reliable information online
• Basic understanding of digital privacy and security

Communication:
• Clear writing and speaking
• Active listening and empathy
• Ability to explain complex ideas simply
• Cross-cultural and generational communication
• Conflict resolution and negotiation

Critical Thinking:
• Asking good questions
• Evaluating information and sources
• Problem-solving from multiple angles
• Understanding bias and assumptions
• Making decisions with incomplete information

Adaptability:
• Learning from failure and setbacks
• Staying flexible when plans change
• Comfort with uncertainty and ambiguity
• Willingness to try new approaches
• Resilience and persistence

Creativity:
• Thinking outside conventional solutions
• Combining ideas in new ways
• Storytelling and narrative skills
• Visual and design thinking
• Innovation and experimentation

Getting Started:
Pick ONE skill area that interests you most and start there. Small, consistent efforts compound over time. Remember: these skills build on each other, and you already have more of them than you think!`,
        quiz: [
          {
            id: 'q11',
            question: 'Which approach is best for developing future-proof skills?',
            options: [
              'Try to master all skills at once',
              'Focus only on technical skills',
              'Pick one skill area and build consistently',
              'Wait until you have more time'
            ],
            correctAnswer: 2
          }
        ]
      }
    ]
  },
  {
    id: 'business-building',
    title: 'Business Building for Beginners and Solopreneurs',
    description: 'Start and grow your business with confidence - no MBA required, just practical steps that work',
    duration: '8-10 weeks',
    level: 'Beginner',
    skills: ['Brand Building', 'Marketing Strategy', 'Financial Planning', 'AI Business Tools'],
    certificate: 'Small Business Fundamentals Certificate',
    lessons: [
      {
        id: 'beautiful-brand',
        title: 'Build a Beautiful Brand — Even on a Shoestring Budget',
        description: 'Teaches affordable, beginner-friendly branding tips',
        duration: '25 min',
        completed: false,
        content: `Create a Professional Brand Without Breaking the Bank

Your brand is more than just a logo - it's the complete experience people have with your business. Here's how to build something beautiful and memorable, even with limited funds.

Brand Foundation Elements:
• Your mission and values (why you exist)
• Your unique voice and personality
• Your target audience and their needs
• Your key differentiators and strengths
• Your brand promise and customer experience

Budget-Friendly Brand Building:

Visual Identity:
• Use free design tools like Canva or GIMP
• Choose a simple, readable font combination
• Pick a cohesive color palette (2-3 colors max)
• Create consistent visual templates
• Use high-quality free stock photos

Brand Voice:
• Write like you talk (authentic and natural)
• Define your tone (professional, friendly, expert, etc.)
• Create messaging templates for consistency
• Develop your elevator pitch and key messages
• Practice telling your brand story simply

Online Presence:
• Choose a clear, memorable business name
• Secure matching social media handles
• Create a simple website or landing page
• Use consistent branding across all platforms
• Focus on quality over quantity in content

Remember: Consistency beats perfection. A simple brand executed consistently will outperform a complex brand used inconsistently.`,
        quiz: [
          {
            id: 'b1',
            question: 'What\'s the most important aspect of building a brand on a budget?',
            options: [
              'Having the most expensive logo',
              'Consistency across all touchpoints',
              'Using the latest design trends',
              'Having a complex visual identity'
            ],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 'get-noticed',
        title: 'Get Noticed: How to Make Your Business Stand Out in a Noisy World',
        description: 'Covers visibility, messaging, and marketing for first-time founders',
        duration: '28 min',
        completed: false,
        content: `Cut Through the Noise and Get Noticed

In a world full of businesses competing for attention, standing out isn't about being the loudest - it's about being the most relevant and memorable to your ideal customers.

The Foundation of Getting Noticed:

Know Your Unique Value:
• What problem do you solve better than anyone else?
• What's your unique approach or perspective?
• What results do you deliver that others can't?
• What's your personal story or background that matters?
• How do you make customers feel different/better?

Visibility Strategies That Work:

Content Marketing:
• Share valuable tips and insights regularly
• Tell stories about your customers' successes
• Behind-the-scenes content that builds connection
• Educational content that positions you as an expert
• Consistent posting schedule on 1-2 platforms

Networking and Relationships:
• Join communities where your customers spend time
• Collaborate with complementary businesses
• Speak at local events or industry meetups
• Build genuine relationships, not just sales pitches
• Ask for referrals from satisfied customers

Strategic Partnerships:
• Team up with businesses that serve your audience
• Cross-promote each other's services
• Create valuable joint offerings or events
• Share resources and knowledge
• Build your network of professional supporters

The key is consistency over perfection. Pick 2-3 strategies you can maintain long-term rather than trying everything at once.`,
        quiz: [
          {
            id: 'b2',
            question: 'What\'s the foundation of getting noticed in business?',
            options: [
              'Having the biggest advertising budget',
              'Being the loudest on social media',
              'Knowing your unique value and being consistent',
              'Copying what successful competitors do'
            ],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 'money-matters',
        title: 'Money Matters: Bookkeeping and Budgeting Tips for Small Business Owners',
        description: 'Simplifies financial basics in a relatable way',
        duration: '30 min',
        completed: false,
        content: `Master Your Business Finances (No Accounting Degree Required)

Good financial management is the difference between a business that survives and one that thrives. Here's how to handle money matters without getting overwhelmed.

Financial Basics Made Simple:

Essential Financial Concepts:
• Revenue (money coming in)
• Expenses (money going out)
• Profit (what's left after expenses)
• Cash flow (timing of money in and out)
• Break-even point (when revenue covers all costs)

Simple Bookkeeping System:
• Separate business and personal finances completely
• Use accounting software (QuickBooks, FreshBooks, or Wave)
• Track income and expenses in real-time
• Save and categorize all receipts
• Reconcile bank statements monthly
• Set aside money for taxes (25-30% of profit)

Budget Planning:
• Fixed costs (rent, insurance, software subscriptions)
• Variable costs (materials, marketing, contractor fees)
• Emergency fund (3-6 months of expenses)
• Growth investments (marketing, equipment, training)
• Owner pay (yes, you need to pay yourself!)

Financial Health Checkups:
• Review profit/loss monthly
• Track key metrics (customer acquisition cost, lifetime value)
• Monitor cash flow patterns
• Plan for seasonal fluctuations
• Regular financial goal setting and review

Tools and Resources:
• Banking apps for easy expense tracking
• Receipt scanning apps (Expensify, Receipt Bank)
• Simple spreadsheet templates for planning
• Professional bookkeeper for complex situations

Remember: You don't need to be a financial expert, but you do need to stay on top of the basics.`,
        quiz: [
          {
            id: 'b3',
            question: 'What\'s the most important financial habit for small business owners?',
            options: [
              'Checking finances once per year',
              'Mixing business and personal finances',
              'Separating business finances and tracking them regularly',
              'Avoiding looking at financial reports'
            ],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 'winning-pitch',
        title: 'Your Big Idea Deserves a Big Pitch: How to Make a Winning Deck',
        description: 'A guide to pitching that\'s both creative and simple',
        duration: '32 min',
        completed: false,
        content: `Create Pitches That Win Hearts and Minds

Whether you're pitching to investors, customers, or partners, a great pitch tells a compelling story that connects emotionally and provides clear value.

The Winning Pitch Structure:

1. The Hook (30 seconds)
• Start with a relatable problem or interesting fact
• Make it personal and specific
• Create curiosity about your solution

2. The Problem (1-2 minutes)
• Paint a clear picture of the pain point
• Use real examples and stories
• Show the size and urgency of the problem
• Make it relevant to your audience

3. The Solution (2-3 minutes)
• Present your unique approach
• Explain how it works simply
• Show why it's better than alternatives
• Use visuals, demos, or examples

4. The Opportunity (1-2 minutes)
• Market size and potential
• Your target customers and how to reach them
• Revenue model and growth projections
• What success looks like

5. The Ask (1 minute)
• Be specific about what you need
• Explain what you'll do with it
• Show what they get in return
• Make it easy to say yes

Pitch Design Tips:
• Use large, readable fonts
• Limit text to key points only
• Include compelling visuals and graphics
• Tell stories, not just facts
• Practice your timing and transitions
• Prepare for questions and objections

Remember: People invest in people, not just ideas. Show your passion, expertise, and commitment throughout your pitch.`,
        quiz: [
          {
            id: 'b4',
            question: 'What\'s the most important element of a winning pitch?',
            options: [
              'Having perfect slides',
              'Including lots of technical details',
              'Telling a compelling story that connects emotionally',
              'Making it as long as possible'
            ],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 'business-plan',
        title: 'Make a Business Plan That Actually Works — and Doesn\'t Confuse You',
        description: 'Helps learners draft practical plans without overwhelm',
        duration: '35 min',
        completed: false,
        content: `Create a Business Plan That Guides Real Action

Forget 50-page documents that nobody reads. A good business plan is a living document that helps you make decisions and stay focused on what matters.

Simple Business Plan Structure:

1. Executive Summary (1 page)
• What your business does in 2-3 sentences
• Who your customers are
• What makes you different
• Key financial projections
• What you're asking for (if seeking funding)

2. Business Description (1-2 pages)
• Your mission and vision
• Products or services you offer
• Target market and customer needs
• Your competitive advantages
• Legal structure and location

3. Market Analysis (1-2 pages)
• Industry overview and trends
• Target customer demographics and psychographics
• Market size and growth potential
• Competitor analysis
• Market entry strategy

4. Marketing and Sales Plan (1-2 pages)
• Pricing strategy and rationale
• Marketing channels and tactics
• Sales process and customer journey
• Customer retention strategies
• Marketing budget and timeline

5. Operations Plan (1 page)
• How you'll deliver your product/service
• Key processes and systems
• Staffing needs and structure
• Technology and equipment requirements
• Quality control measures

6. Financial Projections (1-2 pages)
• Revenue projections (3 years)
• Expense budgets and cash flow
• Break-even analysis
• Funding requirements
• Financial assumptions and risks

Business Plan Best Practices:
• Keep it simple and actionable
• Update it regularly (quarterly reviews)
• Focus on customer value, not just features
• Be realistic with financial projections
• Include specific, measurable goals
• Plan for both success and challenges

Your business plan should be a tool you actually use, not a document that sits on a shelf.`,
        quiz: [
          {
            id: 'b5',
            question: 'What makes a business plan actually useful?',
            options: [
              'Making it as long and detailed as possible',
              'Writing it once and never changing it',
              'Keeping it simple, actionable, and regularly updated',
              'Copying another business\'s plan exactly'
            ],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 'ai-solo-business',
        title: 'Running a Business Solo? Here\'s How AI Can Lighten the Load',
        description: 'Designed for solopreneurs using AI for time, content, and admin help',
        duration: '28 min',
        completed: false,
        content: `AI: Your Business Partner When You're Flying Solo

Running a business alone means wearing all the hats. AI can help you manage multiple roles more effectively without hiring a full team.

AI for Solopreneur Challenges:

Administrative Tasks:
• Email management and response drafting
• Appointment scheduling and calendar coordination
• Invoice creation and follow-up reminders
• Document creation and formatting
• Data entry and organization
• Customer service responses

Content Creation:
• Blog posts and article writing
• Social media content and captions
• Marketing email sequences
• Product descriptions and web copy
• Video scripts and presentations
• SEO optimization

Business Operations:
• Market research and competitor analysis
• Customer feedback analysis
• Financial planning and budget tracking
• Project management and task prioritization
• Lead generation and qualification
• Process documentation

Customer Support:
• FAQ responses and knowledge base creation
• Chatbot setup for common questions
• Customer onboarding sequences
• Follow-up communication templates
• Feedback collection and analysis

Strategic Planning:
• Business idea validation
• Market opportunity analysis
• Growth strategy development
• Risk assessment and planning
• Goal setting and progress tracking

Implementation Strategy:
1. Start with your biggest time drain
2. Choose one AI tool and master it
3. Create templates and systems
4. Gradually expand to other areas
5. Always review and personalize AI output
6. Maintain the human touch in customer relationships

Remember: AI handles the grunt work so you can focus on strategy, relationships, and growing your business.`,
        quiz: [
          {
            id: 'b6',
            question: 'What\'s the best way for solopreneurs to start using AI?',
            options: [
              'Try to automate everything at once',
              'Start with your biggest time drain and master one tool',
              'Only use AI for customer service',
              'Replace all human interaction with AI'
            ],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 'smart-tools',
        title: 'Smart Tools and AI Hacks to Save You Time (and Sanity)',
        description: 'Introduces automation and AI tools that don\'t require tech expertise',
        duration: '26 min',
        completed: false,
        content: `Time-Saving Tools That Don't Require a Tech Degree

These practical tools and hacks can save you hours every week, and most require no technical setup beyond creating an account and following simple steps.

Essential Time-Saving Categories:

Communication & Email:
• Gmail Smart Compose for faster email writing
• Calendly for automated appointment scheduling
• Loom for quick video messages instead of long emails
• Grammarly for error-free, professional writing
• Boomerang for email scheduling and follow-ups

Content Creation:
• Canva AI for social media graphics and presentations
• ChatGPT for writing assistance and brainstorming
• Jasper or Copy.ai for marketing copy
• Descript for easy audio and video editing
• Buffer or Hootsuite for social media scheduling

Project Management:
• Notion AI for smart note-taking and organization
• Trello with automation rules for task management
• Zapier for connecting apps (no coding required)
• IFTTT for simple automation recipes
• Google Workspace for collaboration and file sharing

Customer Management:
• HubSpot free CRM for contact management
• Typeform for smart surveys and forms
• Intercom or Zendesk for customer support
• Mailchimp for email marketing automation
• Google Analytics for website insights

Financial Management:
• QuickBooks or FreshBooks for invoicing and bookkeeping
• PayPal or Stripe for payment processing
• Expensify for expense tracking
• Mint or YNAB for budgeting
• TaxJar for sales tax automation

Getting Started Strategy:
1. Audit your current time usage
2. Identify your top 3 time drains
3. Research tools for those specific problems
4. Start with free versions or trials
5. Implement one tool at a time
6. Create systems and templates
7. Train yourself before expanding

The goal isn't to use every tool, but to find the ones that solve your specific problems and stick with them.`,
        quiz: [
          {
            id: 'b7',
            question: 'What\'s the best approach to adopting new business tools?',
            options: [
              'Sign up for every tool available',
              'Wait until you have time to learn everything',
              'Identify specific problems and implement one solution at a time',
              'Only use the most expensive, premium tools'
            ],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 'ai-powered-business',
        title: 'Start an AI-Powered Business — Even If You\'re Not Techy',
        description: 'Shows how non-technical people can build digital businesses with AI',
        duration: '30 min',
        completed: false,
        content: `Build a Modern Business with AI (No Programming Required)

AI has democratized business creation. You can now start businesses that were previously only possible with large teams and technical expertise.

AI-Powered Business Ideas:

Service-Based Businesses:
• AI-assisted content writing and copywriting
• Social media management with AI tools
• Virtual assistant services using AI productivity tools
• Online course creation with AI content assistance
• Consulting with AI research and analysis support

Product Businesses:
• Print-on-demand with AI-generated designs
• Digital products (templates, guides) created with AI
• Custom artwork and graphics using AI art tools
• Personalized products with AI customization
• Stock photography with AI-enhanced images

Marketplace Businesses:
• Curated AI tool recommendations and reviews
• AI-generated content marketplace
• Template and resource libraries
• Online coaching with AI-supported curriculum
• Digital agency services powered by AI tools

Business Setup Steps:

1. Choose Your Niche:
• Pick something you're already interested in or knowledgeable about
• Research market demand and competition
• Identify how AI can enhance your offering
• Start small and focused

2. Set Up Your AI Toolkit:
• Content creation (ChatGPT, Jasper, Copy.ai)
• Design tools (Canva AI, Midjourney, Figma)
• Business automation (Zapier, IFTTT)
• Customer service (chatbots, automated responses)
• Analytics and insights (Google Analytics, social media insights)

3. Create Your Business Foundation:
• Simple website or landing page
• Social media presence
• Basic business systems and processes
• Payment processing setup
• Legal structure and basic contracts

4. Launch and Iterate:
• Start with a minimum viable product
• Get feedback from early customers
• Use AI to analyze and improve based on data
• Scale what works, pivot what doesn't
• Continuously learn and adapt

Success Principles:
• Focus on solving real problems for real people
• Use AI to enhance, not replace, human value
• Maintain quality and personal touch
• Build relationships, not just transactions
• Start lean and grow organically

The future belongs to businesses that combine human insight with AI efficiency.`,
        quiz: [
          {
            id: 'b8',
            question: 'What\'s the key to success with an AI-powered business?',
            options: [
              'Using the most advanced AI tools available',
              'Completely automating everything',
              'Combining human insight with AI efficiency to solve real problems',
              'Competing on price alone'
            ],
            correctAnswer: 2
          }
        ]
      }
    ]
  }
];

export const LearningDashboard: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [moduleProgress, setModuleProgress] = useState<Record<string, number>>({});

  const handleProgressUpdate = (moduleId: string, progress: number) => {
    setModuleProgress(prev => ({ ...prev, [moduleId]: progress }));
  };

  const filteredModules = learningModules.filter(module => {
    if (filterLevel !== 'all' && module.level.toLowerCase() !== filterLevel) return false;
    return true;
  });

  const currentModule = learningModules.find(m => m.id === selectedModule);

  const overallProgress = Object.values(moduleProgress).length > 0 
    ? Object.values(moduleProgress).reduce((sum, progress) => sum + progress, 0) / Object.values(moduleProgress).length
    : 0;

  const completedModules = Object.values(moduleProgress).filter(progress => progress === 100).length;

  if (currentModule) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedModule(null)}>
            ← Back to Dashboard
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Learning in Progress</h2>
            <p className="text-muted-foreground">Continue your learning journey</p>
          </div>
        </div>
        
        <InteractiveLearningModule 
          module={currentModule} 
          onProgressUpdate={handleProgressUpdate}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Learning Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Enrolled</CardTitle>
            <BookOpen className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learningModules.length}</div>
            <p className="text-xs text-muted-foreground">Available courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Award className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedModules}</div>
            <p className="text-xs text-muted-foreground">Certificates earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(overallProgress)}%</div>
            <Progress value={overallProgress} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Course Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module) => {
          const progress = moduleProgress[module.id] || 0;
          const isCompleted = progress === 100;
          
          return (
            <Card key={module.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <CardDescription className="mt-2">{module.description}</CardDescription>
                  </div>
                  {isCompleted && (
                    <Badge className="bg-gradient-primary text-white">
                      <Award className="h-3 w-3 mr-1" />
                      Done
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {module.duration}
                  </Badge>
                  <Badge variant="outline">{module.level}</Badge>
                </div>

                {progress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Skills:</h4>
                  <div className="flex flex-wrap gap-1">
                    {module.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {module.skills.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{module.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-primary"
                  onClick={() => setSelectedModule(module.id)}
                >
                  {progress > 0 && progress < 100 ? 'Continue Learning' : 
                   isCompleted ? 'Review Course' : 'Start Course'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};