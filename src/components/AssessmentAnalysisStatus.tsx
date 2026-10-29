import { Link } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AssessmentAnalysisStatusProps {
  /** True while the results are being prepared. */
  analyzing: boolean;
  /** Why the results could not be prepared, if they could not. */
  error: string | null;
  onRetry: () => void;
}

/**
 * Shown between finishing an assessment and seeing results. Results only
 * appear once the analysis succeeds (and its credits are charged), so a
 * failure keeps the answers and offers a retry instead of free results.
 */
export function AssessmentAnalysisStatus({ analyzing, error, onRetry }: AssessmentAnalysisStatusProps) {
  if (analyzing) {
    return (
      <div className="py-12 text-center space-y-3" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-lg font-semibold">Preparing your results...</p>
        <p className="text-muted-foreground">This usually takes under a minute. Please keep this window open.</p>
      </div>
    );
  }
  const creditIssue = !!error && /credit/i.test(error);
  return (
    <div className="py-10 text-center space-y-4" role="alert">
      <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
      <h3 className="text-xl font-semibold">We couldn't finish your results</h3>
      {error && <p className="text-muted-foreground max-w-md mx-auto">{error}</p>}
      <p className="text-sm text-muted-foreground">
        You were not charged. Your answers are saved, so you don't need to start over.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {creditIssue ? (
          <Button asChild>
            <Link to="/pricing">Get More Credits</Link>
          </Button>
        ) : null}
        <Button variant={creditIssue ? "outline" : "default"} onClick={onRetry}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
