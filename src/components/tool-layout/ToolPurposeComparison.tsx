import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

/** Public, presentation-only guidance; neither link runs a tool. */
export function ToolPurposeComparison() {
  return (
    <section className="border-y border-border bg-muted/30 py-10">
      <div className="container mx-auto max-w-5xl px-4">
        <h2 className="text-2xl font-bold text-foreground mb-6">Deploy It or Create It?</h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Deploy It — AI Assistant Setup Guide</h3>
            <p className="mt-2 text-muted-foreground leading-relaxed">Want an assistant for tasks like drafting replies or helping students? Get ready-to-paste instructions and a PDF setup guide for a platform such as ChatGPT, Gemini, or Claude. You set it up using your own account; PivotHub does not launch or host it for you.</p>
            <Button variant="link" className="px-0 mt-2 h-auto whitespace-normal text-left" asChild><Link to="/deployit">Explore Deploy It</Link></Button>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Create It — App &amp; Platform Blueprint</h3>
            <p className="mt-2 text-muted-foreground leading-relaxed">Have an idea for an app, website, or online platform? Get a downloadable blueprint covering features, recommended technology, build steps, ways to earn revenue, and a prompt for an AI app builder. It is a plan to build from—not a finished app.</p>
            <Button variant="link" className="px-0 mt-2 h-auto whitespace-normal text-left" asChild><Link to="/createit">Explore Create It</Link></Button>
          </div>
        </div>
      </div>
    </section>
  );
}