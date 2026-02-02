

# ACT IT - Creative Writing / Story Development Tool

## Overview

ACT IT is a new AI-powered tool that helps users transform an idea into a structured concept and outline for a movie, short film, or stage play. The tool generates a cohesive story framework including characters, background, plot, setting, themes, and tone based on the user's selected genre and format.

**Credit Cost:** 3 credits per use

---

## What Will Be Built

### 1. Frontend Page (`src/pages/ActIt.tsx`)

A new page following the existing pattern used by SpeakIt, GardenIt, and similar tools:

**Page Structure:**
- Hero section with "ACT IT" branding and tagline: "Turn an idea into a movie or stage-ready story concept"
- Credit badge showing 3 credits
- Multi-step form with required and optional inputs
- Results display with markdown rendering
- PDF download functionality
- Email results option

**Form Inputs:**

*Required Fields:*
- Project Title (working title)
- Genre Selection (multi-select checkboxes):
  - Comedy, Drama, Thriller, Horror, Sci-Fi, Futuristic, Dystopian, Fantasy, Romance, Mystery, Action, Faith-based, Experimental
- Format Selection (single select dropdown):
  - Stage Play, Film (Feature Length), Short Film, Web Series, One-Act Play, Skit/Scene

*Optional Fields (Guided):*
- Target Audience: Youth, Adult, Family, General audience
- Tone: Light, Dark, Hopeful, Gritty, Inspirational, Suspenseful
- Time Period: Past, Present, Future, Timeless
- Setting Preference: Urban, Rural, International, Fictional World
- Central Theme or Message (text input)
- Faith or Cultural Elements: Yes/No toggle
- Length Preference: Short, Medium, Full-length

**Results Display:**
- All 10 deliverable sections rendered with ReactMarkdown
- Expandable/collapsible sections for easy navigation
- Download PDF button
- Email results prompt component

---

### 2. Edge Function (`supabase/functions/act-it/index.ts`)

A new Supabase edge function that:

- Authenticates user via JWT token
- Rate limits to 3 requests per hour using throttle_user RPC
- Moderates input content using shared moderation module
- Checks and deducts 3 credits using check_and_increment_ai_usage RPC
- Calls Lovable AI (GPT-5) with comprehensive system prompt
- Returns structured story development package

**System Prompt Structure:**
The AI will generate all 10 deliverable sections:
1. Story Concept Brief (1-2 paragraphs)
2. Genre, Tone & Format Alignment
3. World & Setting Profile
4. Character Development Sheets (all major characters)
5. Story Background & Inciting Context
6. Plot Structure Outline (format-specific)
7. Themes & Message Breakdown
8. Visual or Stage Direction Notes (format-aware)
9. Expansion & Development Suggestions
10. Final formatted output

---

### 3. Routing & Navigation Updates

**Files to modify:**

- `src/App.tsx`: Add route `/actit` for ActIt page
- `src/components/Header.tsx`: Add "Act It" link under appropriate dropdown menu (likely "Plan It" or new "Create" category)
- `src/utils/toolCreditWeights.ts`: Add `'act-it': 3` entry
- `supabase/config.toml`: Add `[functions.act-it]` with `verify_jwt = true`

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/ActIt.tsx` | Create | New page with form, results display, PDF download |
| `supabase/functions/act-it/index.ts` | Create | Edge function for AI story generation |
| `src/App.tsx` | Modify | Add `/actit` route |
| `src/components/Header.tsx` | Modify | Add "Act It" link in navigation dropdown |
| `src/utils/toolCreditWeights.ts` | Modify | Add `'act-it': 3` credit cost |
| `supabase/config.toml` | Modify | Add function configuration |

---

## Technical Details

### Edge Function Pattern

Following the established pattern from `speak-it`:

```typescript
// Authentication
const authHeader = req.headers.get('authorization');
const token = authHeader.replace('Bearer ', '');
const { data: { user } } = await supabase.auth.getUser(token);

// Rate limiting
await supabase.rpc('throttle_user', {
  p_user_id: userId,
  p_endpoint: 'act-it',
  p_window_seconds: 3600,
  p_max_reqs: 3
});

// Content moderation
const moderation = await moderateContent(inputText, supabase, userId, 'act-it');

// Credit check and deduction
const { data: usageData } = await supabase.rpc('check_and_increment_ai_usage', {
  p_user_id: userId,
  p_tool_name: 'act-it',
  p_credits_to_use: 3,
});

// AI generation via Lovable AI Gateway
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${lovableKey}` },
  body: JSON.stringify({
    model: 'openai/gpt-5',
    messages: [{ role: 'system', content: systemPrompt }, ...],
    max_completion_tokens: 8000,
  }),
});
```

### Frontend Component Pattern

Following SpeakIt structure:
- Use ToolGuard component for authentication and credit checks
- Supabase functions.invoke() for API calls
- ReactMarkdown for rendering AI output
- jsPDF for PDF generation
- EmailResultsPrompt for optional email delivery

### Navigation Placement

Adding "Act It" to the **"Plan It"** dropdown menu alongside Launch It, Schedule It, Host It, Speak It, and Garden It - as it's a creative planning/development tool.

---

## Behavior Rules (Built into System Prompt)

- Does not write a full script unless explicitly asked
- Focuses on structure, clarity, and creativity
- Matches tone to selected genre
- Avoids clichés unless genre-appropriate
- Keeps language accessible and production-friendly
- All content is original, user-driven, practical, action-oriented with no generic filler

---

## Deliverables Generated

Each completed ACT IT session produces:
1. Story Concept Brief - polished overview for pitches
2. Genre & Format Alignment - how choices shape the story
3. World & Setting Profile - time, location, atmosphere
4. Character Development Sheets - profiles for all major characters
5. Story Background - context and inciting circumstances
6. Plot Structure Outline - act-based structure for chosen format
7. Themes & Message Breakdown - core ideas and takeaways
8. Visual/Stage Direction Notes - format-specific production notes
9. Expansion Suggestions - sequel ideas, deeper arcs
10. Clean, exportable text ready for scriptwriting software

