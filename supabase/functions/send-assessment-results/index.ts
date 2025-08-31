import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, assessmentType, results, analysis }: AssessmentEmailRequest = await req.json();

    console.log(`Sending ${assessmentType} assessment results to ${email}`);

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
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
      .section { margin-bottom: 25px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea; }
      .score-badge { display: inline-block; background: #667eea; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
      .action-item { background: #e3f2fd; padding: 12px; margin: 8px 0; border-radius: 6px; border-left: 3px solid #2196f3; }
      .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      ul { padding-left: 20px; }
      li { margin-bottom: 8px; }
      h3 { color: #667eea; margin-bottom: 15px; }
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
          <h3>📊 Overall Career Readiness</h3>
          <div class="score-badge">Score: ${analysis.overallScore}/10</div>
          <p>Based on your responses, here's where you stand in your career exploration journey.</p>
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
          <h3>📊 Overall Skills Score</h3>
          <div class="score-badge">Score: ${analysis.overallScore}/10</div>
          <p>Here's a comprehensive breakdown of your current skill levels and development opportunities.</p>
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

serve(handler);