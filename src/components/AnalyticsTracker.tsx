import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { analyticsEnabled, getConsentChoice, setConsentChoice, trackPageView } from "@/lib/analytics";

/**
 * Sends a GA4 page view on every route change and shows a one-time analytics
 * notice with an opt-out. Renders nothing when analytics is not configured.
 */
const AnalyticsTracker = () => {
  const { pathname } = useLocation();
  const [showNotice, setShowNotice] = useState(() => analyticsEnabled() && getConsentChoice() === null);

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  if (!showNotice) return null;

  const choose = (choice: "granted" | "denied") => {
    setConsentChoice(choice);
    setShowNotice(false);
  };

  return (
    <div
      role="region"
      aria-label="Analytics notice"
      className="fixed bottom-3 left-3 right-3 z-50 mx-auto max-w-2xl rounded-xl border bg-background p-4 shadow-lg sm:flex sm:items-center sm:gap-4"
    >
      <p className="text-sm text-muted-foreground">
        We use Google Analytics to see which pages and tools help people most. No ads, and we never share your
        personal details. <Link to="/privacy-policy" className="underline">Privacy Policy</Link>
      </p>
      <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
        <Button size="sm" onClick={() => choose("granted")}>OK</Button>
        <Button size="sm" variant="outline" onClick={() => choose("denied")}>Opt out</Button>
      </div>
    </div>
  );
};

export default AnalyticsTracker;
