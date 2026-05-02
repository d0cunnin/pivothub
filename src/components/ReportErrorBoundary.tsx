import { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  onRetry?: () => void;
  resetKey?: string | number;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ReportErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || "Unknown render error" };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ReportErrorBoundary] Render crash caught");
    console.error("Message:", error?.message);
    console.error("Stack:", error?.stack);
    console.error("Component stack:", errorInfo?.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: "" });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: "" });
    this.props.onRetry?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Unable to Display Your Blueprint
            </CardTitle>
            <CardDescription>
              Something in this blueprint couldn't be displayed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">
                We saved your generated report but hit a display issue rendering it.
              </p>
              <p className="text-xs text-muted-foreground break-words">
                Details: {this.state.errorMessage}
              </p>
            </div>
            <div className="space-y-3">
              {this.props.onRetry && (
                <Button onClick={this.handleRetry} className="w-full" size="lg">
                  Try Generating Again
                </Button>
              )}
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="w-full"
              >
                Go Back
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                If this persists, please contact support with error code: RENDER_FAIL
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}

export default ReportErrorBoundary;
