import type { ReactNode } from "react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const H = ({ children }: { children: ReactNode }) => (
  <h4 className="text-base font-semibold text-foreground mt-6 first:mt-0 mb-2">{children}</h4>
);

const PromptBox = ({ label, children }: { label?: string; children: ReactNode }) => (
  <div className="my-3">
    {label && <p className="text-sm font-semibold text-foreground mb-1">{label}</p>}
    <blockquote className="bg-background/60 border-l-4 border-primary p-3 rounded text-foreground italic">
      {children}
    </blockquote>
  </div>
);

const Bullets = ({ items }: { items: ReactNode[] }) => (
  <ul className="list-disc pl-6 space-y-1">
    {items.map((it, i) => <li key={i}>{it}</li>)}
  </ul>
);

const Steps = ({ items }: { items: ReactNode[] }) => (
  <ol className="list-decimal pl-6 space-y-1">
    {items.map((it, i) => <li key={i}>{it}</li>)}
  </ol>
);

const Takeaway = ({ children }: { children: ReactNode }) => (
  <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20 text-foreground">
    <strong>Key takeaway: </strong>{children}
  </div>
);

const body = "space-y-3 text-muted-foreground leading-relaxed";

const roleTable: [string, string][] = [
  ["Writing a resume", "Career coach or resume writer"],
  ["Preparing for an interview", "Interview coach"],
  ["Developing a marketing plan", "Marketing strategist"],
  ["Learning a science concept", "Science educator"],
  ["Organizing a household budget", "Budgeting educator"],
  ["Writing a professional email", "Professional communications specialist"],
  ["Understanding a general health topic", "Health educator"],
  ["Organizing a project", "Project planning specialist"],
];

const mistakes: { title: string; text: ReactNode; weak?: string; better?: string }[] = [
  {
    title: "1. Being too vague",
    text: "When a request is very general, AI has to guess what you mean. Being specific tells it the topic, the purpose and what a good answer looks like.",
    weak: "Write something about business.",
    better: "Write a beginner-friendly introduction to starting a home-based bookkeeping business. Explain the basic services, likely startup considerations, and first steps.",
  },
  {
    title: "2. Leaving out important context",
    text: "AI doesn't know your situation unless you describe it. Without details it may give a generic answer — and it should never invent your personal numbers or present guesses as facts.",
    weak: "Make me a budget.",
    better: "Help me create a monthly household budget using my income, regular bills, transportation costs, groceries, and savings goals. Ask me for any missing amounts before estimating.",
  },
  {
    title: "3. Choosing a role that doesn't fit the task",
    text: "The role should match the work. A resume request fits a career coach; interview practice fits an interview coach. For simple questions you can skip the role entirely.",
  },
  {
    title: "4. Asking for too many unrelated things at once",
    text: "Asking for a business launch, marketing campaign, website, financial plan and training course in one message usually produces shallow results. Start by defining the business idea, review it, then build the next piece. Big projects work best in steps.",
  },
  {
    title: "5. Not saying who the answer is for",
    text: "The audience decides how simple or detailed the explanation should be.",
    weak: "Explain cybersecurity.",
    better: "Explain basic cybersecurity practices for parents who have little technical experience. Use everyday examples and include a checklist for protecting household devices and online accounts.",
  },
  {
    title: "6. Accepting the first answer without reviewing it",
    text: (
      <>
        AI can make mistakes or leave things out. You can always ask for changes. Helpful follow-ups:
        <Bullets items={[
          "\u201cExplain this more simply.\u201d",
          "\u201cIdentify any claims that aren't supported.\u201d",
          "\u201cGive me another approach.\u201d",
          "\u201cCheck the calculations.\u201d",
          "\u201cSeparate confirmed facts from estimates.\u201d",
          "\u201cTell me what information is missing.\u201d",
        ]} />
      </>
    ),
  },
  {
    title: "7. Assuming AI knows your personal circumstances",
    text: "AI only knows what you've told it in the conversation. If your schedule, budget or experience matters, include it — just leave out details that aren't needed.",
  },
  {
    title: "8. Sharing private or confidential information",
    text: "Never include passwords, account logins, Social Security numbers, confidential client records or other sensitive details. When sharing a sample document, remove names and identifying information first.",
  },
];

const samples: { category: string; items: { title: string; prompt: string; why?: string }[] }[] = [
  {
    category: "Writing and communication",
    items: [
      { title: "Professional email", prompt: "Help me write a professional email to a potential employer thanking them for speaking with me about a job opportunity. Use a warm, confident tone, keep it under 150 words, and leave placeholders for the employer's name and the position title.", why: "It names the purpose, tone, length and what to leave blank." },
      { title: "Simplifying information", prompt: "Rewrite the following information so someone with no technical background can understand it. Preserve the important facts, explain unfamiliar terms, and organize the explanation with short headings and bullet points. Here is the information: [insert text]." },
    ],
  },
  {
    category: "Career and employment",
    items: [
      { title: "Resume summary", prompt: "Act as a career coach. Help me write a resume summary for [target position]. My relevant experience includes [experience], and my strongest skills are [skills]. Highlight transferable skills without inventing qualifications. Use a professional tone and keep the summary under 100 words.", why: "\u201cWithout inventing qualifications\u201d keeps the result honest." },
      { title: "Interview preparation", prompt: "Act as an interview coach familiar with [industry or position]. Give me eight likely interview questions for a [position] interview. Explain what each question is intended to assess and provide guidance for developing honest answers based on my experience: [brief background]." },
    ],
  },
  {
    category: "Business and entrepreneurship",
    items: [
      { title: "Business idea development", prompt: "Act as a small-business planning advisor. Help me brainstorm five business ideas based on my skills in [skills], interests in [interests], available time of [hours per week], and starting budget of [budget]. For each idea, explain the potential customer, basic startup requirements, and important uncertainties I should research.", why: "Asking for \u201cuncertainties to research\u201d separates ideas from facts." },
      { title: "Marketing calendar", prompt: "Act as a marketing strategist for a small business that sells [product or service] to [target audience]. Create a four-week marketing calendar with three manageable activities per week. Include suggested content topics, the purpose of each activity, and a simple way to evaluate results. Work within this budget: [budget]." },
    ],
  },
  {
    category: "Learning and education",
    items: [
      { title: "Learning a difficult concept", prompt: "Act as an educator who teaches beginners. Explain [topic] using simple language and everyday examples. Break the explanation into short sections, define unfamiliar terms, and finish with five review questions and their answers." },
      { title: "Study guide", prompt: "Use the notes I provide to create a study guide for [subject or exam]. Organize it by topic, identify the most important concepts, explain confusing material in plain English, and create ten practice questions with answer explanations. Do not introduce unsupported details that are not in my notes without clearly labeling them as additional information. Here are my notes: [insert notes].", why: "It tells AI to stick to your notes and label anything extra." },
    ],
  },
  {
    category: "Organization and productivity",
    items: [
      { title: "Weekly schedule", prompt: "Help me build a realistic weekly schedule. My main responsibilities are [responsibilities], my fixed commitments are [commitments], and I have [available hours] available for flexible tasks. Organize the schedule by day and identify which tasks should receive priority." },
      { title: "Breaking down a project", prompt: "Act as a project planning specialist. Break [project] into manageable tasks, organize them in a logical order, identify dependencies, and suggest realistic target dates based on my deadline of [date] and available time of [hours]. Present the result as a checklist." },
    ],
  },
  {
    category: "Technology and AI",
    items: [
      { title: "Understanding technology", prompt: "Act as a technology educator for beginners. Explain what [technology or software feature] is, what people use it for, and how it might be useful in everyday life. Use three practical examples and avoid unexplained technical terms." },
      { title: "Troubleshooting a software problem", prompt: "Help me understand and troubleshoot this software problem. I am using [software or device], and the problem occurs when I [describe action]. The exact error message is [error message]. Explain likely causes in simple language and suggest safe troubleshooting steps, starting with the easiest. Ask me for missing information instead of assuming details.", why: "Including the exact error message gives AI the most useful clue." },
    ],
  },
  {
    category: "Personal planning and decision-making",
    items: [
      { title: "Comparing options", prompt: "Help me compare [option A], [option B], and [option C]. My priorities are [priorities], and my budget is [budget]. Create a comparison table showing advantages, disadvantages, costs to verify, and questions I should investigate before making a decision. Do not invent missing prices or facts." },
      { title: "Creating an action plan", prompt: "Help me develop a 30-day action plan to achieve [goal]. I can dedicate [hours] per week and have these resources available: [resources]. Break the plan into weekly milestones and manageable tasks. Include ways to track progress and identify any assumptions that need to be checked." },
    ],
  },
];

export const PromptBasicsLessons = () => (
  <>
    {/* 1 */}
    <AccordionItem value="what-is-prompt">
      <AccordionTrigger>What is a Prompt?</AccordionTrigger>
      <AccordionContent>
        <div className={body}>
          <H>What it means</H>
          <p>A prompt is the question, instruction, or information you give an AI tool to tell it what you want help with.</p>
          <p>Think of it as how you communicate your request. You can ask AI to explain something, help write a document, organize information, brainstorm ideas, compare options, build a plan, or work through a problem.</p>
          <p>AI uses the instructions and background you give it to write a response. The clearer your request and the more relevant details you include, the better guidance it has for producing a useful answer.</p>
          <p>You don't need to know how to program or use special technical words. You just need to explain what you want, share the information that matters, and describe the result you're looking for.</p>

          <H>Why the wording matters</H>
          <PromptBox label="Basic prompt">Help me find a job.</PromptBox>
          <p>This names a general goal, but AI doesn't know what kind of job you want, what experience you have, where you want to work, or what kind of help would be useful.</p>
          <PromptBox label="Improved prompt">Help me create a two-week job-search plan. I am looking for entry-level administrative positions, have customer service experience, and prefer remote work. Organize the plan by day and include practical steps I can complete each day.</PromptBox>
          <p>The second prompt includes a specific goal, relevant background, a preference, and a requested format. That gives AI clearer direction and less guessing about what you mean.</p>

          <H>What you can use prompts for</H>
          <Bullets items={[
            "Writing and editing emails, letters, and other documents",
            "Preparing resumes and practicing job interviews",
            "Learning unfamiliar subjects in simple language",
            "Organizing schedules, projects, and responsibilities",
            "Brainstorming business ideas and marketing plans",
            "Summarizing information you provide",
            "Comparing options using criteria you choose",
            "Creating checklists and step-by-step instructions",
            "Getting help understanding software and technology",
          ]} />
          <p>You're always the one who reviews the result and decides whether it meets your needs. AI can make mistakes, so double-check anything important.</p>

          <H>Prompting is a conversation</H>
          <p>You don't have to get everything right the first time. After the first answer, you can follow up with things like:</p>
          <Bullets items={[
            "\u201cExplain that in simpler language.\u201d",
            "\u201cGive me three more examples.\u201d",
            "\u201cTurn this into a checklist.\u201d",
            "\u201cMake the tone more professional.\u201d",
            "\u201cWhat information do you still need from me?\u201d",
            "\u201cReview your answer for errors and identify anything that needs verification.\u201d",
          ]} />
          <p>Each follow-up helps shape the response closer to what you need.</p>

          <Takeaway>A good prompt explains what you need, includes the information that matters, and gives AI enough direction to be useful. Start simple and add details as you go.</Takeaway>
        </div>
      </AccordionContent>
    </AccordionItem>

    {/* 2 */}
    <AccordionItem value="structure">
      <AccordionTrigger>Role + Task + Context + Tone Structure</AccordionTrigger>
      <AccordionContent>
        <div className={body}>
          <H>A simple framework</H>
          <p>Role + Task + Context + Tone is a helpful way to write more detailed prompts. The four parts describe the kind of help you need, the work you want done, your situation, and how the answer should sound.</p>
          <p><strong className="text-foreground">Important:</strong> the role must fit the task and context. Don't add a generic role to every prompt — choose one that brings a useful perspective to this specific request.</p>

          <H>Role — what kind of help fits?</H>
          <p>The role tells AI which perspective or approach to use. It should make sense for the work you're asking for.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded">
              <thead className="bg-muted/50 text-foreground">
                <tr><th className="text-left p-2">Task</th><th className="text-left p-2">Relevant role</th></tr>
              </thead>
              <tbody>
                {roleTable.map(([t, r]) => (
                  <tr key={t} className="border-t border-border"><td className="p-2">{t}</td><td className="p-2">{r}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>A role guides the response, but it doesn't give AI real credentials, replace a qualified professional, or guarantee accuracy. For simple questions, you can skip the role and just ask.</p>

          <H>Task — what do you want AI to do?</H>
          <p>The task is the specific result you want. Focus on the action: explain, draft, compare, organize, summarize, evaluate, brainstorm, or create.</p>
          <PromptBox label="Weak task">Help me with my career.</PromptBox>
          <PromptBox label="Clearer task">Help me identify transferable skills from my customer service experience and use them to write a resume summary for an administrative assistant position.</PromptBox>

          <H>Context — what does AI need to know?</H>
          <p>Context is the background that helps AI understand your situation. Depending on the task, it might include:</p>
          <Bullets items={[
            "Your experience, skills, or education",
            "Your goals and the outcome you want",
            "Who the result is for (the audience)",
            "Your budget, available time, or other limits",
            "Materials or information you already have",
            "Your preferences and circumstances",
            "Requirements the answer must follow",
          ]} />
          <p>For example, someone changing careers could share their previous work, the job they want, and the skills they want to highlight. Context helps AI tailor its answer instead of guessing. Share what's relevant — but never passwords, logins, or unnecessary sensitive details.</p>

          <H>Tone — how should it sound?</H>
          <p>Tone describes the style of the answer: professional, friendly, conversational, encouraging, persuasive, educational, formal, or simple and easy to understand. Pick a tone that suits the task and audience. Tone changes how the answer sounds, not whether the facts are correct.</p>

          <H>Putting all four together</H>
          <p><em>Scenario:</em> someone with customer service experience wants to apply for an administrative assistant job.</p>
          <Bullets items={[
            <><strong className="text-foreground">Role:</strong> a career coach experienced in career transitions</>,
            <><strong className="text-foreground">Task:</strong> write a resume summary</>,
            <><strong className="text-foreground">Context:</strong> five years of customer service, strong organizational skills, experience handling customer records; applying for entry-level admin roles</>,
            <><strong className="text-foreground">Tone:</strong> professional and confident, without exaggerating</>,
          ]} />
          <PromptBox label="Combined prompt">Act as a career coach experienced in helping people transition between careers. Help me write a resume summary for an entry-level administrative assistant position. I have five years of customer service experience, strong organizational skills, and experience handling customer records. Highlight my transferable skills without exaggerating my experience. Use a professional, confident tone and keep the summary under 100 words.</PromptBox>
          <p><strong className="text-foreground">Why it works:</strong> a career-transition coach fits someone changing fields; the experience details make the summary personal and relevant; the tone and 100-word limit keep the result polished and resume-ready.</p>

          <H>When the task changes, the role changes</H>
          <p>Same person, new goal: preparing for the interview. The help needed is different, so the role becomes an interview coach.</p>
          <PromptBox>Act as an interview coach who helps candidates prepare for administrative positions. Create eight common interview questions for an entry-level administrative assistant role. Consider my five years of customer service experience and help me connect that experience to the new position. Use a supportive, professional tone and explain what each question is designed to assess.</PromptBox>
          <p>You can reuse the same background for different tasks — just adjust the role and instructions to fit the new goal.</p>

          <H>When to use the framework</H>
          <p>The four parts are a guide, not a rule. Simple questions can stay simple:</p>
          <PromptBox label="Simple request">Explain what a spreadsheet is in plain English.</PromptBox>
          <PromptBox label="More detailed request">Act as a technology educator for beginners. Explain what spreadsheets are, how they are used in small businesses, and give three everyday examples. Use simple language and organize the answer with headings and bullet points.</PromptBox>
          <p>Ask yourself: <em>What kind of help do I need, what do I want accomplished, what background matters, and how should the answer be presented?</em></p>

          <H>Reusable template</H>
          <PromptBox>Act as [a role appropriate for my task]. Help me [specific task]. Here is the relevant background information: [context]. Please present the response in a [tone] tone and use [desired format or requirements].</PromptBox>
          <p>Replace the brackets with your own details, and leave out any part you don't need for a simple request.</p>
        </div>
      </AccordionContent>
    </AccordionItem>

    {/* 3 */}
    <AccordionItem value="when-to-use">
      <AccordionTrigger>When to Use Examples, Formatting, or Constraints</AccordionTrigger>
      <AccordionContent>
        <div className={body}>
          <H>Examples — show what you want</H>
          <p>An example shows AI the kind of result you're after. Examples are especially useful when you want a particular writing style, document layout, format, or level of detail.</p>
          <p>For instance, you could paste a professional email you like and ask AI to write a new one with a similar structure but a different subject. Keep examples relevant, and remove confidential information before sharing them.</p>

          <H>Formatting — how the answer is organized</H>
          <p>Formatting tells AI how to lay out the response. Common choices:</p>
          <Bullets items={[
            "Numbered lists for instructions",
            "Bullet points for key information",
            "Tables for comparing options",
            "Checklists for completing tasks",
            "Headings and sections for longer documents",
            "Email format with a subject line and message",
            "Step-by-step guides for learning a process",
          ]} />
          <PromptBox label="Request A">Explain how to prepare for a job interview.</PromptBox>
          <PromptBox label="Request B">Explain how to prepare for a job interview using a seven-item checklist.</PromptBox>
          <p>Request B makes the desired layout clear, so you're more likely to get something easy to follow.</p>

          <H>Constraints — limits and requirements</H>
          <p>Constraints are boundaries that shape what an acceptable answer looks like. For example:</p>
          <Bullets items={[
            "Keep the answer under 300 words",
            "Write for someone with no technical experience",
            "Include three practical examples",
            "Use a budget of $500 or less",
            "Avoid technical jargon",
            "Use only the information provided when summarizing a document",
            "Organize the response into five numbered steps",
          ]} />
          <p>Constraints guide AI but don't guarantee every requirement will be met — always review the result.</p>

          <H>All three in one prompt</H>
          <PromptBox>Explain how to start a small online business for someone who has never owned a business. Organize the answer into five numbered steps. Include one practical example for each step and keep the discussion focused on options with startup costs under $500. Use simple language and clearly identify any costs that would need to be verified.</PromptBox>
          <Bullets items={[
            "The audience is a beginner.",
            "The five numbered steps set the format.",
            "One example per step shows practical use.",
            "The $500 limit is a constraint.",
            "Asking to flag costs to verify separates estimates from confirmed facts.",
          ]} />

          <H>When you need these details</H>
          <p>You don't need all three in every prompt. A quick factual question rarely needs special formatting or limits. A business plan, report, study guide or professional document often benefits from all three. Include the details that genuinely improve the result — not so many that the prompt becomes hard to follow.</p>
        </div>
      </AccordionContent>
    </AccordionItem>

    {/* 4 */}
    <AccordionItem value="mistakes">
      <AccordionTrigger>Common Prompt Mistakes</AccordionTrigger>
      <AccordionContent>
        <div className={body}>
          <p>Each mistake below explains why it can lead to an unhelpful answer and how to fix it.</p>
          {mistakes.map((m) => (
            <div key={m.title}>
              <H>{m.title}</H>
              <div>{m.text}</div>
              {m.weak && <PromptBox label="Weak">{m.weak}</PromptBox>}
              {m.better && <PromptBox label="Improved">{m.better}</PromptBox>}
            </div>
          ))}
          <Takeaway>A weak answer doesn't mean AI can't help. The request may just need more context, a clearer task, a better-matched role, or a follow-up instruction.</Takeaway>
        </div>
      </AccordionContent>
    </AccordionItem>

    {/* 5 */}
    <AccordionItem value="samples">
      <AccordionTrigger>Prompt Samples by Use Case</AccordionTrigger>
      <AccordionContent>
        <div className={body}>
          <p>Copy any of these ready-to-use prompts and fill in the parts in [brackets] with your own details.</p>
          {samples.map((cat) => (
            <div key={cat.category}>
              <H>{cat.category}</H>
              {cat.items.map((s) => (
                <div key={s.title}>
                  <PromptBox label={s.title}>{s.prompt}</PromptBox>
                  {s.why && <p className="text-sm"><strong className="text-foreground">Why it works:</strong> {s.why}</p>}
                </div>
              ))}
            </div>
          ))}
          <H>How to use these samples</H>
          <Steps items={[
            "Pick the example closest to your goal.",
            "Replace the bracketed placeholders with your own details.",
            "Adjust the role, task, context, tone, and format to fit your situation.",
            "Read the prompt over before submitting it.",
            "Review the result and refine your request if needed.",
          ]} />
          <p>You don't need every element in every prompt — use what helps.</p>
        </div>
      </AccordionContent>
    </AccordionItem>

    {/* 6 */}
    <AccordionItem value="what-is-use">
      <AccordionTrigger>What is a "Use"?</AccordionTrigger>
      <AccordionContent>
        <div className={body}>
          <p className="font-semibold text-foreground text-lg">1 Use = 1 completed prompt analysis = 1 Tool Credit</p>
          <p>A "use" is one time you submit a prompt to Prompt It's analysis feature and receive the feedback (an analysis, an improved prompt, and an explanation).</p>

          <H>What counts and what doesn't</H>
          <Steps items={[
            <><strong className="text-foreground">Writing or editing your prompt</strong> — free. Type and change it as much as you like.</>,
            <><strong className="text-foreground">Clicking "Analyze Prompt"</strong> — this is the use.</>,
            <><strong className="text-foreground">Receiving and reviewing the feedback</strong> — 1 credit is deducted only after the analysis completes successfully. If it fails, you aren't charged.</>,
            <><strong className="text-foreground">Changing your prompt and analyzing again</strong> — each new analysis is another use and another credit.</>,
          ]} />
          <p>Opening this page and reading these lessons never uses a credit. The number of analyses you can run depends on your remaining Tool Credits, shown below.</p>

          <H>Example</H>
          <Steps items={[
            "You draft a prompt asking for help with a marketing plan for your business.",
            "You reread it and add details about your business and customers.",
            "You click Analyze Prompt.",
            "PivotHub reviews your prompt and shows the feedback.",
            "You read the feedback and decide whether to revise.",
            "If you want another review, you edit and submit again — that uses another credit.",
          ]} />
        </div>
      </AccordionContent>
    </AccordionItem>
  </>
);

export const PromptChecklist = () => (
  <div className="mt-6 p-5 rounded-lg border border-border bg-background/40">
    <h3 className="text-lg font-semibold text-foreground mb-3">Before submitting your prompt, ask yourself:</h3>
    <ul className="space-y-2 text-muted-foreground">
      {[
        "Have I explained what I want AI to do?",
        "Have I included the background information that matters?",
        "Have I chosen a role that fits the task, if a role is needed?",
        "Have I explained who the response is for?",
        "Have I specified a tone or format if it matters?",
        "Have I included important requirements or limitations?",
        "Can I recognize what a useful result should look like?",
        "Have I avoided including unnecessary sensitive information?",
      ].map((q) => (
        <li key={q} className="flex gap-2"><span className="text-primary" aria-hidden>☐</span>{q}</li>
      ))}
    </ul>
    <p className="text-sm text-muted-foreground mt-3">Not every prompt needs every item — this is a guide for clearer requests, not a strict formula.</p>
  </div>
);
