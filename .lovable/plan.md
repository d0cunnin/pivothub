## Goal
Convert the white screen on `/earnit` into a readable error card so we can see the actual crash. Three surgical changes only — no other hardening.

## Changes

### 1. `src/pages/EarnIt.tsx` — wrap report branch in ReportErrorBoundary
Add the import and wrap the existing `step === 'report'` return so any crash above `SideIncomeReport` is caught.

Add import:
```tsx
import { ReportErrorBoundary } from "@/components/ReportErrorBoundary";
```

Replace the `if (step === 'report')` block (lines 90–102) with:
```tsx
if (step === 'report') {
  return (
    <ReportErrorBoundary onRetry={() => setStep('intro')} resetKey={assessmentId}>
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Your Side Income Blueprint | PivotHub</title>
          <meta name="description" content="Your personalized side income strategy and action plan." />
        </Helmet>
        <Header />
        <SideIncomeReport assessmentId={assessmentId} />
        <Footer />
      </div>
    </ReportErrorBoundary>
  );
}
```

### 2. `src/components/SideIncomeReport.tsx` — guard JSON.parse
At the top of `generateReport` (currently line 231 `const assessmentData = JSON.parse(assessmentId);`), replace with:

```ts
let assessmentData: any;
try {
  assessmentData = assessmentId ? JSON.parse(assessmentId) : null;
} catch (e) {
  throw new Error('Invalid assessment payload — please retake the assessment.');
}
if (!assessmentData) throw new Error('No assessment data found.');
```

### 3. Nothing else changes
No other files touched. No additional `renderText` calls. No PDF generator changes.

## After deploy
Open `/earnit`, run through the flow. If a crash occurs, the error boundary now renders a card showing the exact error message instead of going white. Share that error text and I'll provide the one-line fix.
