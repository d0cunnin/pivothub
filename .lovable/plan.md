
## Update FAQ: Replace Pathway Content with Credit System

### Overview
The FAQ page has an outdated question "Which path is right for me?" that refers to the old pathway system (Prep It, Build It paths). This needs to be updated to reflect the new credit-based subscription system.

### Current State
The existing FAQ answer says:
> "If you're job hunting, choose Prep It. Building a business? Pick Build It. Not sure? Get the All Access Pass for everything. Start with Explore Mode (free forever) to try our tools first!"

### What Will Change

**File: `src/pages/FAQ.tsx`**

Update the question and answer at lines 60-67 to explain the credit system instead of pathways:

**New Question:** "Which plan is right for me?"

**New Answer:** 
Explain the credit-based tiers and help users understand how to choose:
- **Explore Mode (Free)**: 5 credits/month - perfect for trying tools before committing
- **Starter ($19/month)**: 40 credits/month - great for occasional use
- **Pro ($39/month)**: 100 credits/month - ideal for regular users
- **All-Access ($79/month)**: 250 credits/month - best value for power users

Include guidance on credit costs (chatbots = 1 credit, assessments = 2 credits, complex tools = 3-5 credits) to help users estimate which plan fits their usage.

### Technical Details

**Single file change:**
- `src/pages/FAQ.tsx` - Lines 60-67 (AccordionItem value="item-2")
  - Change question from "Which path is right for me?" to "Which plan is right for me?"
  - Replace pathway guidance with credit-based plan comparison
  - Add helpful context about tool credit costs to guide decision-making
