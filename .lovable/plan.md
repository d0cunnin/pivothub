

## Add Faith/Cultural Elements Specification Input

### Overview
When users enable the "Faith or Cultural Elements" toggle on the Act It page, they need a way to specify what specific faith tradition, cultural background, or elements they want incorporated into their story.

### What Will Change

#### 1. Frontend: `src/pages/ActIt.tsx`

**Add new state variable (around line 62-63):**
- Add `faithElementsDetails` state to capture the specific details
- This will be a text input that appears conditionally when the toggle is enabled

**Update the form UI (around lines 491-501):**
- When `hasFaithElements` is `true`, show an additional text input field
- Label: "Specify Faith or Cultural Elements"
- Placeholder: "e.g., Christian themes, African diaspora culture, Buddhist philosophy, Latino heritage..."
- The input will appear directly below the toggle in an expanded section

**Update request body (around line 112):**
- Include `faithElementsDetails` in the API request when present

**Update reset function (around line 261):**
- Reset `faithElementsDetails` to empty string

#### 2. Edge Function: `supabase/functions/act-it/index.ts`

**Update interface (line 18):**
- Change from `hasFaithElements?: boolean` to also accept `faithElementsDetails?: string`

**Update destructuring (line 88):**
- Extract `faithElementsDetails` from request body

**Update system prompt (line 154):**
- Change from generic "Include faith-based or cultural themes" to include the specific details:
  - `Faith/Cultural Elements: Include the following - ${faithElementsDetails}`

### Visual Layout

```
┌─────────────────────────────────────────────┐
│  Faith or Cultural Elements          [ON]   │
│  Include faith-based or cultural themes     │
├─────────────────────────────────────────────┤
│  Specify Faith or Cultural Elements         │  ← NEW (only shows when ON)
│  ┌─────────────────────────────────────────┐│
│  │ e.g., Christian themes, African...     ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/ActIt.tsx` | Add `faithElementsDetails` state, conditional text input, update request body and reset |
| `supabase/functions/act-it/index.ts` | Add `faithElementsDetails` to interface and include in system prompt |

