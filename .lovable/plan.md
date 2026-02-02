

## Add Description Notice to Act It Page

### Overview
Add a clear description on the Act It page to set user expectations that this tool generates a story **outline and concept** - not a full script.

### What Will Change

**File: `src/pages/ActIt.tsx`**

Add an informational notice between the Credit Badge (line 321) and the ToolGuard/form section (line 323). This will be a styled card or alert that explains:

**Content:**
> **What You'll Get:** ACT IT generates a professional story development package including concept briefs, character profiles, plot outlines, and production notes. This tool creates a **structured outline and concept** — not a full script. Use your results as a foundation for scriptwriting, pitches, or production planning.

### Visual Design
- Use a Card or styled div with a subtle background
- Include an info icon (like `FileText` or `Info`) for visual clarity
- Match the existing page styling (rounded corners, proper spacing)
- Keep it concise but clear

### Placement
```
Hero Section
    ↓
Credit Badge (3 Credits)
    ↓
[NEW] Description Notice  ← Add here
    ↓
ToolGuard + Form
```

### Technical Details

**Single edit to `src/pages/ActIt.tsx`:**
- Add a new informational Card/div after line 321 (closing `</div>` of credit badge)
- Before line 323 (the `<ToolGuard>` component)
- Use existing UI components (Card or styled div with border)
- Include FileText or Info icon from lucide-react (already imported)

