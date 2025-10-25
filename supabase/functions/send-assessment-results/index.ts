import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { moderateContent } from "../_shared/moderation.ts";

const resend = new Resend(Deno.env.get("resendemail-key"));
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AssessmentEmailRequest {
  email: string;
  name: string;
  assessmentType: string;
  results: any;
  analysis: any;
}

// Validation schema
const assessmentEmailSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(200),
  assessmentType: z.string().min(1).max(100),
  results: z.any(),
  analysis: z.any()
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    
    // Validate input
    const validation = assessmentEmailSchema.safeParse(rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.format() }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { email, name, assessmentType, results, analysis }: AssessmentEmailRequest = validation.data;

    console.log(`Sending ${assessmentType} assessment results to ${email}`);
    
    // Content moderation for user-generated assessment content (medium risk - fail open)
    const moderationText = JSON.stringify(analysis);
    const moderationResult = await moderateContent(moderationText, 'send-assessment-results', undefined, 'medium');
    
    if (moderationResult.flagged) {
      console.warn('Assessment content flagged by moderation:', moderationResult.categories);
      return new Response(
        JSON.stringify({ 
          error: 'Content policy violation detected',
          details: 'Assessment content contains inappropriate material and cannot be emailed.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const emailContent = generateEmailContent(assessmentType, analysis, name);
    
    const emailResponse = await resend.emails.send({
      from: "RelaunchU Career Services <onboarding@resend.dev>",
      to: [email],
      subject: `Your ${capitalizeFirst(assessmentType)} Assessment Results - RelaunchU`,
      html: emailContent,
    });

    console.log("Assessment results email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-assessment-results function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateEmailContent(assessmentType: string, analysis: any, name: string): string {
  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; padding: 0; background: #f5f5f5; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
      .header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: 700; }
      .header p { margin: 0; font-size: 16px; opacity: 0.9; }
      .content { background: #ffffff; padding: 30px; }
      .section { margin-bottom: 30px; padding: 25px; background: #f8f9fa; border-radius: 12px; border-left: 5px solid #667eea; }
      .section h3 { color: #667eea; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; }
      .section h4 { color: #4a5568; margin: 20px 0 10px 0; font-size: 16px; font-weight: 600; }
      .score-badge { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 20px; border-radius: 25px; font-weight: bold; margin: 15px 0; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .action-item { background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); padding: 15px; margin: 12px 0; border-radius: 8px; border-left: 4px solid #2196f3; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      .progress-bar { background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; margin: 10px 0; }
      .progress-fill { background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; border-radius: 4px; }
      .skill-card { background: white; padding: 20px; margin: 15px 0; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
      .badge { display: inline-block; background: #e2e8f0; color: #4a5568; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; margin: 2px; }
      .badge-primary { background: #667eea; color: white; }
      .footer { text-align: center; padding: 30px; color: #666; font-size: 14px; background: #f8f9fa; }
      .footer-logo { font-size: 18px; font-weight: bold; color: #667eea; margin-bottom: 10px; }
      ul { padding-left: 0; list-style: none; }
      li { margin-bottom: 12px; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
      li:last-child { border-bottom: none; }
      .highlight { background: #fff3cd; padding: 2px 4px; border-radius: 3px; }
      .stats-grid { display: table; width: 100%; margin: 20px 0; }
      .stats-item { display: table-cell; text-align: center; padding: 15px; background: white; border: 1px solid #e2e8f0; }
      .stats-number { font-size: 24px; font-weight: bold; color: #667eea; display: block; }
      .stats-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
    </style>
  `;

  switch (assessmentType) {
    case 'career':
      return generateCareerEmailContent(analysis, name, baseStyles);
    case 'skills':
      return generateSkillsEmailContent(analysis, name, baseStyles);
    case 'personality':
      return generatePersonalityEmailContent(analysis, name, baseStyles);
    default:
      return generateGenericEmailContent(analysis, name, baseStyles);
  }
}

function generateCareerEmailContent(analysis: any, name: string, styles: string): string {
  return `
    ${styles}
    <div class="container">
      <div class="header">
        <h1>🎯 Your Career Assessment Results</h1>
        <p>Discover your ideal career path, ${name}!</p>
      </div>
      
      <div class="content">
        <div class="section">
          <h3>📊 Overall Career Readiness Score</h3>
          <div class="score-badge">Score: ${analysis.overallScore || 7}/10</div>
          <div class="stats-grid">
            <div class="stats-item">
              <span class="stats-number">${Math.round(((analysis.overallScore || 7) / 10) * 100)}%</span>
              <div class="stats-label">Career Ready</div>
            </div>
            <div class="stats-item">
              <span class="stats-number">${Math.round((analysis.overallScore || 7) * 8)}%</span>
              <div class="stats-label">Percentile Rank</div>
            </div>
          </div>
          <p><strong>Interpretation:</strong> ${getScoreInterpretation(analysis.overallScore || 7)}</p>
          <p>This score reflects your current readiness to pursue career opportunities and your understanding of different career paths.</p>
        </div>

        <div class="section">
          <h3>🎯 Your Primary Interests</h3>
          <ul>
            ${analysis.primaryInterests?.map((interest: string) => `<li><strong>${interest}</strong></li>`).join('') || '<li>Continue exploring your interests</li>'}
          </ul>
        </div>

        <div class="section">
          <h3>🚀 Top Career Matches</h3>
          ${analysis.topCareerPaths?.map((career: any) => `
            <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 6px;">
              <h4 style="margin: 0 0 8px 0; color: #667eea;">${career.title}</h4>
              <div class="score-badge" style="font-size: 12px; padding: 4px 8px;">Match: ${career.match}/10</div>
              <p style="margin: 10px 0;">${career.description}</p>
              <p style="font-size: 14px; color: #666;"><strong>Growth Outlook:</strong> ${career.growthOutlook}</p>
            </div>
          `).join('') || '<p>Continue exploring career options based on your interests.</p>'}
        </div>

        <div class="section">
          <h3>📈 Your Action Plan</h3>
          
          <h4 style="color: #667eea;">🔥 Start This Week:</h4>
          ${analysis.actionPlan?.immediate?.map((action: string) => `<div class="action-item">${action}</div>`).join('') || '<div class="action-item">Begin exploring your career interests</div>'}
          
          <h4 style="color: #667eea;">📅 Next 1-3 Months:</h4>
          ${analysis.actionPlan?.shortTerm?.map((action: string) => `<div class="action-item">${action}</div>`).join('') || '<div class="action-item">Research potential career paths</div>'}
          
          <h4 style="color: #667eea;">🎯 Long-term Goals:</h4>
          ${analysis.actionPlan?.longTerm?.map((action: string) => `<div class="action-item">${action}</div>`).join('') || '<div class="action-item">Develop a comprehensive career plan</div>'}
        </div>

        <div class="section">
          <h3>🛠️ Skills to Develop</h3>
          <ul>
            ${analysis.skillsNeeded?.map((skill: string) => `<li>${skill}</li>`).join('') || '<li>Identify skills relevant to your interests</li>'}
          </ul>
        </div>

        <div class="section">
          <h3>📚 Recommended Resources</h3>
          <ul>
            ${analysis.resources?.map((resource: string) => `<li>${resource}</li>`).join('') || '<li>Career exploration websites and tools</li>'}
          </ul>
        </div>
      </div>

      <div class="footer">
        <p>Keep building your future with RelaunchU! 🌟</p>
        <p>Visit our platform for more career development tools and resources.</p>
      </div>
    </div>
  `;
}

function generateSkillsEmailContent(analysis: any, name: string, styles: string): string {
  return `
    ${styles}
    <div class="container">
      <div class="header">
        <h1>🎓 Your Skills Assessment Results</h1>
        <p>Your personalized skill development roadmap, ${name}!</p>
      </div>
      
      <div class="content">
        <div class="section">
          <h3>📊 Overall Skills Assessment Score</h3>
          <div class="score-badge">Score: ${analysis.overallScore || 7}/10</div>
          <div class="stats-grid">
            <div class="stats-item">
              <span class="stats-number">${getSkillLevel(analysis.overallScore || 7)}</span>
              <div class="stats-label">Skill Level</div>
            </div>
            <div class="stats-item">
              <span class="stats-number">${Math.round((analysis.overallScore || 7) * 9)}%</span>
              <div class="stats-label">Above Average</div>
            </div>
          </div>
          <p><strong>Assessment Summary:</strong> ${getSkillSummary(analysis.overallScore || 7)}</p>
          <p>This comprehensive assessment evaluates your current skill levels across multiple categories relevant to today's job market.</p>
        </div>

        <div class="section">
          <h3>💪 Your Skill Categories</h3>
          ${analysis.skillCategories?.map((category: any) => `
            <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 6px;">
              <h4 style="margin: 0 0 8px 0; color: #667eea;">${category.category}</h4>
              <div class="score-badge" style="font-size: 12px; padding: 4px 8px;">${category.level} - ${category.score}/10</div>
              <p style="margin: 10px 0;"><strong>Strengths:</strong> ${category.strengths?.join(', ') || 'Developing'}</p>
              <p style="color: #666;"><strong>Areas to improve:</strong> ${category.improvements?.join(', ') || 'Continue practicing'}</p>
            </div>
          `).join('') || '<p>Continue building your skills across all areas.</p>'}
        </div>

        <div class="section">
          <h3>🌟 Your Top Skills</h3>
          <ul>
            ${analysis.topSkills?.map((skill: string) => `<li><strong>${skill}</strong></li>`).join('') || '<li>Continue developing your skills</li>'}
          </ul>
        </div>

        <div class="section">
          <h3>🎯 Skill Gaps to Address</h3>
          <ul>
            ${analysis.skillGaps?.map((gap: string) => `<li>${gap}</li>`).join('') || '<li>Identify areas for improvement</li>'}
          </ul>
        </div>

        <div class="section">
          <h3>📈 Your Learning Path</h3>
          ${analysis.learningPath?.map((step: any, index: number) => `
            <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 6px;">
              <h4 style="margin: 0 0 8px 0; color: #667eea;">Step ${index + 1}: ${step.step}</h4>
              <p style="margin: 5px 0;"><strong>Timeframe:</strong> ${step.timeframe}</p>
              <p style="color: #666;"><strong>Resources:</strong> ${step.resources?.join(', ') || 'Online courses and practice'}</p>
            </div>
          `).join('') || '<p>Focus on developing skills most relevant to your career goals.</p>'}
        </div>

        <div class="section">
          <h3>📈 Your Action Plan</h3>
          
          <h4 style="color: #667eea;">🔥 Start This Week:</h4>
          ${analysis.actionPlan?.immediate?.map((action: string) => `<div class="action-item">${action}</div>`).join('') || '<div class="action-item">Identify your priority skills to develop</div>'}
          
          <h4 style="color: #667eea;">📅 Next 1-3 Months:</h4>
          ${analysis.actionPlan?.shortTerm?.map((action: string) => `<div class="action-item">${action}</div>`).join('') || '<div class="action-item">Begin focused skill development</div>'}
          
          <h4 style="color: #667eea;">🎯 Long-term Goals:</h4>
          ${analysis.actionPlan?.longTerm?.map((action: string) => `<div class="action-item">${action}</div>`).join('') || '<div class="action-item">Achieve mastery in key skills</div>'}
        </div>

        <div class="section">
          <h3>🏆 Recommended Certifications</h3>
          <ul>
            ${analysis.certifications?.map((cert: string) => `<li>${cert}</li>`).join('') || '<li>Research certifications in your field of interest</li>'}
          </ul>
        </div>
      </div>

      <div class="footer">
        <p>Keep growing your skills with RelaunchU! 🚀</p>
        <p>Practice makes perfect - stay consistent with your learning journey.</p>
      </div>
    </div>
  `;
}

function generatePersonalityEmailContent(analysis: any, name: string, styles: string): string {
  return `
    ${styles}
    <div class="container">
      <div class="header">
        <h1>🧠 Your Personality Assessment Results</h1>
        <p>Understanding your unique personality profile, ${name}!</p>
      </div>
      
      <div class="content">
        <div class="section">
          <h3>🎭 Your Personality Type</h3>
          <div class="score-badge">${analysis.personalityType || 'Unique Individual'}</div>
          <p>This reflects your natural preferences and working style.</p>
        </div>

        <div class="section">
          <h3>⭐ Your Key Personality Traits</h3>
          ${analysis.keyTraits?.map((trait: any) => `
            <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 6px;">
              <h4 style="margin: 0 0 8px 0; color: #667eea;">${trait.trait}</h4>
              <div class="score-badge" style="font-size: 12px; padding: 4px 8px;">Strength: ${trait.score}/5</div>
              <p style="margin: 10px 0;">${trait.description}</p>
              <p style="color: #666;"><strong>Career Impact:</strong> ${trait.careerRelevance}</p>
            </div>
          `).join('') || '<p>Your unique combination of traits makes you valuable in many roles.</p>'}
        </div>

        <div class="section">
          <h3>💪 Your Top Strengths</h3>
          <ul>
            ${analysis.strengths?.map((strength: string) => `<li><strong>${strength}</strong></li>`).join('') || '<li>Your unique combination of qualities</li>'}
          </ul>
        </div>

        <div class="section">
          <h3>🏢 Your Ideal Work Style</h3>
          <p>${analysis.workStyle || 'You work best in environments that match your personality and values.'}</p>
        </div>

        <div class="section">
          <h3>🎯 Career Fields That Match You</h3>
          ${analysis.careerFit?.map((field: any) => `
            <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 6px;">
              <h4 style="margin: 0 0 8px 0; color: #667eea;">${field.field}</h4>
              <div class="score-badge" style="font-size: 12px; padding: 4px 8px;">Match: ${field.match}/10</div>
              <p style="margin: 10px 0;">${field.reasoning}</p>
            </div>
          `).join('') || '<p>Many career fields can benefit from your unique personality traits.</p>'}
        </div>

        <div class="section">
          <h3>📈 Your Development Action Plan</h3>
          
          <h4 style="color: #667eea;">🔥 Start This Week:</h4>
          ${analysis.actionPlan?.immediate?.map((action: string) => `<div class="action-item">${action}</div>`).join('') || '<div class="action-item">Reflect on your personality insights</div>'}
          
          <h4 style="color: #667eea;">📅 Next 1-3 Months:</h4>
          ${analysis.actionPlan?.shortTerm?.map((action: string) => `<div class="action-item">${action}</div>`).join('') || '<div class="action-item">Apply your personality insights to career planning</div>'}
          
          <h4 style="color: #667eea;">🎯 Long-term Goals:</h4>
          ${analysis.actionPlan?.longTerm?.map((action: string) => `<div class="action-item">${action}</div>`).join('') || '<div class="action-item">Build a career that aligns with your personality</div>'}
        </div>

        <div class="section">
          <h3>🌱 Areas for Development</h3>
          <ul>
            ${analysis.developmentAreas?.map((area: string) => `<li>${area}</li>`).join('') || '<li>Continue developing your self-awareness</li>'}
          </ul>
        </div>

        <div class="section">
          <h3>💡 Work Environment Tips</h3>
          <ul>
            ${analysis.workEnvironmentTips?.map((tip: string) => `<li>${tip}</li>`).join('') || '<li>Find environments that support your natural working style</li>'}
          </ul>
        </div>
      </div>

      <div class="footer">
        <p>Embrace your unique personality with RelaunchU! 🌟</p>
        <p>Your personality is your superpower - use it to build an amazing career.</p>
      </div>
    </div>
  `;
}

function generateGenericEmailContent(analysis: any, name: string, styles: string): string {
  return `
    ${styles}
    <div class="container">
      <div class="header">
        <h1>📊 Your Assessment Results</h1>
        <p>Your personalized insights and action plan, ${name}!</p>
      </div>
      
      <div class="content">
        <div class="section">
          <h3>📊 Overall Score</h3>
          <div class="score-badge">Score: ${analysis.overallScore || 'N/A'}/10</div>
          <p>Based on your responses, here are your personalized insights and recommendations.</p>
        </div>

        <div class="section">
          <h3>📈 Your Action Plan</h3>
          
          <h4 style="color: #667eea;">🔥 Start This Week:</h4>
          ${analysis.actionPlan?.immediate?.map((action: string) => `<div class="action-item">${action}</div>`).join('') || '<div class="action-item">Review your assessment results</div>'}
          
          <h4 style="color: #667eea;">📅 Next 1-3 Months:</h4>
          ${analysis.actionPlan?.shortTerm?.map((action: string) => `<div class="action-item">${action}</div>`).join('') || '<div class="action-item">Set specific development goals</div>'}
          
          <h4 style="color: #667eea;">🎯 Long-term Goals:</h4>
          ${analysis.actionPlan?.longTerm?.map((action: string) => `<div class="action-item">${action}</div>`).join('') || '<div class="action-item">Build a comprehensive plan for growth</div>'}
        </div>
      </div>

      <div class="footer">
        <p>Continue your growth journey with RelaunchU! 🚀</p>
        <p>Every step forward is progress - keep building your future.</p>
      </div>
    </div>
  `;
}

function getScoreInterpretation(score: number): string {
  if (score >= 9) return "Excellent - You demonstrate exceptional readiness and understanding across all areas assessed.";
  if (score >= 7) return "Good - You have solid foundations with some areas that could benefit from additional focus.";
  if (score >= 5) return "Fair - You have basic knowledge but significant opportunities for skill development and growth.";
  return "Developing - Focus on building foundational knowledge and skills to increase your career readiness.";
}

function getSkillLevel(score: number): string {
  if (score >= 8) return "Advanced";
  if (score >= 6) return "Intermediate";
  if (score >= 4) return "Developing";
  return "Beginner";
}

function getSkillSummary(score: number): string {
  if (score >= 8) return "You demonstrate strong competency across multiple skill areas and are well-prepared for advanced opportunities.";
  if (score >= 6) return "You have solid skills with good potential for growth in several key areas.";
  if (score >= 4) return "You're building important skills but would benefit from focused development in key areas.";
  return "You're at the beginning of your skill development journey with many opportunities for growth.";
}

serve(handler);