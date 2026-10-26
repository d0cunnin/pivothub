import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * App-wide error boundary. Wraps the entire React tree so that any uncaught
 * render/runtime error shows a readable fallback instead of a blank white
 * screen. Intentionally uses plain inline-styled markup (no UI library,
 * theme, router, or context) so the fallback still renders even when the
 * failure happens in a top-level provider during boot.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Surface full detail in the console for diagnosis.
    console.error("[AppErrorBoundary] Uncaught application error");
    console.error("Message:", error?.message);
    console.error("Stack:", error?.stack);
    console.error("Component stack:", errorInfo?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#0f172a",
          color: "#e2e8f0",
        }}
      >
        <div style={{ maxWidth: 640, width: "100%" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Something went wrong loading the app
          </h1>
          <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 16 }}>
            The application hit an unexpected error while starting up. The
            technical details below have also been logged to the browser
            console.
          </p>
          <pre
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 8,
              padding: 16,
              fontSize: 12,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowX: "auto",
            }}
          >
            {this.state.error?.message || "Unknown error"}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: 600,
              color: "#0f172a",
              background: "#38bdf8",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
