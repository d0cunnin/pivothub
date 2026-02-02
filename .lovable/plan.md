
# STUDY IT - Biblical Study / Reference Tool

## Overview

STUDY IT is a new AI-powered biblical reference tool that provides structured, neutral, scripture-based reference information for a given topic. The tool generates definitions, original language etymology, Strong's Concordance entries, and related Old and New Testament scriptures only.

**Key Constraint:** No preaching, commentary, interpretation, or application is included - purely reference data.

**Credit Cost:** 2 credits per use

---

## What Will Be Built

### 1. Frontend Page (`src/pages/StudyIt.tsx`)

A new page following the established pattern from ActIt and similar tools:

**Page Structure:**
- Hero section with "STUDY IT" branding and tagline: "Biblical reference. Original language. Scripture only."
- Credit badge showing 2 credits
- Clear description notice explaining the tool provides reference-only content (no preaching/commentary)
- Simple input form with single topic field
- Results display with markdown rendering
- PDF download functionality

**Form Inputs:**

*Required Field:*
- Biblical Topic (single word or short phrase)
  - Placeholder examples: "Faith, Grace, Repentance, Kingdom of God"

**Results Display:**
- All 5 output sections rendered with ReactMarkdown:
  1. Definition
  2. Etymology
  3. Strong's Concordance Entries
  4. Old Testament Scriptures
  5. New Testament Scriptures
- Collapsible sections for easy navigation
- Download PDF button

---

### 2. Edge Function (`supabase/functions/study-it/index.ts`)

A new Supabase edge function that:

- Authenticates user via JWT token
- Rate limits to 5 requests per hour using throttle_user RPC
- Moderates input content using shared moderation module
- Checks and deducts 2 credits using check_and_increment_ai_usage RPC
- Calls Lovable AI (google/gemini-3-flash-preview) with strict reference-only system prompt
- Returns structured biblical reference package

**System Prompt Behavior Rules (Strict):**
- MUST NOT preach or exhort
- MUST NOT teach or interpret scripture
- MUST NOT add reflections, devotionals, or applications
- MUST NOT harmonize or explain passages
- MUST NOT add conclusions or summaries
- Present only biblical reference data in a factual, academic tone

---

### 3. Routing & Navigation Updates

**Files to modify:**

| File | Action | Description |
|------|--------|-------------|
| `src/pages/StudyIt.tsx` | Create | New page with form, results display, PDF download |
| `supabase/functions/study-it/index.ts` | Create | Edge function for biblical reference generation |
| `src/App.tsx` | Modify | Add `/studyit` route and import |
| `src/components/Header.tsx` | Modify | Add "Study It" link in "Learn It" dropdown |
| `src/utils/toolCreditWeights.ts` | Modify | Add `'study-it': 2` credit cost |
| `supabase/config.toml` | Modify | Add function configuration with `verify_jwt = true` |

**Navigation Placement:**
Adding "Study It" to the **"Learn It"** dropdown menu alongside Prompt It, Code It, Deploy It, Create It, and Courses - as it's an educational/study reference tool.

---

## Technical Details

### Edge Function Pattern

Following the established pattern from act-it:

```typescript
// Authentication
const authHeader = req.headers.get('authorization');
const token = authHeader.replace('Bearer ', '');
const { data: { user } } = await supabase.auth.getUser(token);

// Rate limiting: 5 requests per hour
await supabase.rpc('throttle_user', {
  p_user_id: userId,
  p_endpoint: 'study-it',
  p_window_seconds: 3600,
  p_max_reqs: 5
});

// Content moderation
const moderation = await moderateContent(topic, supabase, userId, 'study-it');

// Credit check and deduction (2 credits)
const { data: usageData } = await supabase.rpc('check_and_increment_ai_usage', {
  p_user_id: userId,
  p_tool_name: 'study-it',
  p_credits_to_use: 2,
});

// AI generation via Lovable AI Gateway
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${lovableKey}` },
  body: JSON.stringify({
    model: 'google/gemini-3-flash-preview',
    messages: [{ role: 'system', content: systemPrompt }, ...],
    max_completion_tokens: 4000,
  }),
});
```

### System Prompt Structure

The AI will generate exactly 5 sections in this order:

```markdown
## 1. Definition
A concise, biblically grounded definition
- Neutral and academic tone
- No exhortation or application

## 2. Etymology
- Original biblical language(s) (Hebrew and/or Greek)
- Root words
- Literal or primary meanings

## 3. Strong's Concordance Entries
For each relevant entry:
- Strong's number
- Original word
- Transliteration
- Short definition

## 4. Old Testament Scriptures
- Book, chapter, and verse only
- No paraphrasing
- No explanations

## 5. New Testament Scriptures
- Book, chapter, and verse only
- No paraphrasing
- No explanations
```

### Frontend Component Pattern

Following the ActIt/SpeakIt structure:
- Use ToolGuard component for authentication and credit checks
- Supabase functions.invoke() for API calls
- ReactMarkdown with remark-gfm for rendering AI output
- jsPDF for PDF generation
- Collapsible sections for organized display
- Clear description notice about reference-only content

---

## Behavior Rules (Built into System Prompt)

**STUDY IT must NOT:**
- Preach or exhort
- Teach or interpret scripture
- Add reflections, devotionals, or applications
- Harmonize or explain passages
- Add conclusions or summaries
- Include modern commentary

**STUDY IT must:**
- Present only biblical reference data
- Use neutral, academic tone
- Provide factual etymology information
- Include actual Strong's Concordance entries
- List scripture references without explanation

---

## Output Example

For topic "Grace":

```markdown
## 1. Definition
Grace refers to the unmerited favor and kindness shown by God toward humanity...

## 2. Etymology
**Hebrew:** חֵן (chen) - favor, grace, charm
**Greek:** χάρις (charis) - grace, favor, blessing

## 3. Strong's Concordance Entries
- **H2580** - חֵן (chen) - favor, grace
- **G5485** - χάρις (charis) - grace, favor, thanks

## 4. Old Testament Scriptures
- Genesis 6:8
- Exodus 33:12-13
- Proverbs 3:34
...

## 5. New Testament Scriptures
- John 1:14
- Romans 3:24
- Ephesians 2:8-9
...
```
