import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CreditCostTable } from "@/components/CreditCostTable";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-primary">
      <Helmet>
        <title>Frequently Asked Questions - PivotHub</title>
        <meta name="description" content="Get answers to common questions about PivotHub pricing, credits, subscriptions, and more." />
      </Helmet>
      
      <Header />

      {/* Hero Section */}
      <section className="section-spacing-sm bg-gradient-section-1">
        <div className="page-container">
          <div className="content-width max-w-4xl mx-auto text-center">
            <h1 className="page-header mb-4">Your Questions, Answered</h1>
            <p className="text-lg text-muted-foreground">
              Find clear answers about pricing, credits, billing, and everything in between
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="section-spacing-sm bg-gradient-section-2">
        <div className="page-container">
          <div className="content-width max-w-4xl mx-auto">
            
            {/* Getting Started Section */}
            <div className="mb-12">
              <h2 className="section-header mb-6">Getting Started</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left">
                    What is the Free plan?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    The Free plan is our <strong>free forever</strong> plan that gives you 5 credits every month based on your signup anniversary date. For example, if you sign up on January 15th, your credits reset on the 15th of every month. Unused credits do NOT roll over—they reset to 5 each month. No credit card required. Perfect for testing tools or occasional use.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left">
                    Which plan is right for me?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <p className="mb-3">Choose based on how often you'll use our AI-powered tools:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-3">
                      <li><strong>Free plan:</strong> 5 credits/month — perfect for trying tools before committing</li>
                      <li><strong>Starter ($12/month):</strong> 40 credits/month — great for occasional use</li>
                      <li><strong>Pro ($24/month):</strong> 100 credits/month — ideal for regular users</li>
                      <li><strong>All-Access ($49/month):</strong> 250 credits/month — best value for power users</li>
                    </ul>
                    <p className="text-sm"><strong>Credit costs:</strong> Chatbots use 1 credit per message, assessments use 2 credits, and complex tools (business plans, teaching materials) use 3-5 credits. Start with Free plan to test tools risk-free!</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Credits & Billing Section */}
            <div className="mb-12">
              <h2 className="section-header mb-6">Credits & Billing</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left">
                    What are credits?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Credits are how you use PivotHub's tools. Each tool uses a set number of credits based on how much AI work it does: chatbots use 1 credit per message, most tools use 2-5 credits, and the large blueprint tools use more (Deploy It 40, Create It 70). Credits are only used when your results are delivered.
                    <p className="text-sm mt-3">
                      📊 <strong>Want to see the full breakdown?</strong> Check out "How many credits does each tool cost?" below for a complete list.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left">
                    When do I get my credits?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <strong>Free plan:</strong> You get 5 credits every month on the day you signed up. For example, if you signed up on the 15th, you get new credits on the 15th of each month.
                    <p className="mt-3"><strong>Paid plans:</strong> Your monthly credits are added each time your monthly payment goes through.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left">
                    Do unused credits carry over?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <strong>Paid plans:</strong> Yes. Each batch of paid credits lasts 3 months from the day you get it, so anything you don't use carries over until then. Credits from extra credit packs also last 3 months.
                    <p className="mt-3"><strong>Free plan:</strong> No. Free credits do not carry over. You start fresh with 5 credits each month.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-cost-breakdown">
                  <AccordionTrigger className="text-left">
                    How many credits does each tool cost?
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Different tools require different amounts of AI processing. 
                        Here's the complete breakdown of credit costs for every tool in PivotHub:
                      </p>
                      <CreditCostTable />
                      <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                        <h4 className="font-semibold mb-2">💡 Smart Credit Tips:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• <strong>Free plan users:</strong> Start with chatbots (1 credit per message) or assessments (2 credits) to maximize your 5 monthly credits</li>
                          <li>• <strong>Paid users:</strong> Unused credits carry over for 3 months, so you can save up for bigger tools</li>
                          <li>• <strong>High-value tools:</strong> Save Business Plan Generator (4 credits) and Teaching Materials (5 credits) for when you're ready to create final deliverables</li>
                          <li>• <strong>Chatbots:</strong> Use Career Advisor and Business Mentor freely—they're only 1 credit per message</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-earnit">
                  <AccordionTrigger className="text-left">
                    How does Earn It (Side Income Blueprint) work?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <p className="mb-3">
                      Earn It (Side Income Blueprint) is included in <strong>all paid subscription tiers</strong> and available on the Free plan! It uses <strong>3 credits</strong>, which covers the assessment and your full
                      personalized blueprint. Credits are only used once your blueprint is delivered.
                    </p>
                    <p className="mb-3">
                      <strong>Available with:</strong>
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mb-3">
                      <li><strong>Free plan:</strong> 5 credits/month - perfect for trying Earn It</li>
                      <li><strong>Paid Plans:</strong> 40-250 credits/month - use anytime</li>
                    </ul>
                    <p>
                      You can take the assessment multiple times to refine your side income strategy 
                      as your situation evolves (3 credits each time).
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-left">
                    What happens if I run out of credits?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    On a paid plan, you can buy an extra credit pack anytime: 25 credits for $5, 70 credits for $10, or 150 credits for $20. Packs are a one-time payment and the credits last 3 months. On the Free plan, you can upgrade to a paid plan or wait for your next 5 credits.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-plan-changes">
                  <AccordionTrigger className="text-left">
                    Can I change my plan?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <p className="mb-3">Yes. Change your plan anytime in <strong>Settings</strong>.</p>
                    <p className="mb-3"><strong>Moving to a bigger plan:</strong> You pay the price difference for the rest of this month right away. As soon as that payment goes through, you get the extra credits. For example, going from Starter (40) to Pro (100) adds 60 credits.</p>
                    <p><strong>Moving to a smaller plan:</strong> The change starts on your next billing date. You keep your current plan until then. Credits you already have stay until they expire.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Payments & Cancellations Section */}
            <div className="mb-12">
              <h2 className="section-header mb-6">Payments & Cancellations</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-8">
                  <AccordionTrigger className="text-left">
                    What payment methods do you accept?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Payments are handled securely by Stripe. You can pay with major credit and debit cards and any other options shown at checkout. PivotHub never sees or stores your card details.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-9">
                  <AccordionTrigger className="text-left">
                    What happens if my payment fails?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Stripe will try your card again automatically. Your new monthly credits are added only after the payment goes through. To fix it sooner, go to <strong>Settings</strong> and choose <strong>Billing History &amp; Payment Method</strong> to update your card. If the payment still can't be collected, your paid plan ends after the month you already paid for.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-10">
                  <AccordionTrigger className="text-left">
                    Can I cancel anytime?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes. Cancel anytime in <strong>Settings</strong>. You won't be charged again, and you keep your plan until the end of the month you already paid for. After that, your account moves to the Free plan.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-11">
                  <AccordionTrigger className="text-left">
                    What happens to my credits when I cancel?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Credits you already received can still be used until they expire (3 months from the day you got them). You won't receive new paid credits after your plan ends. Once you're on the Free plan, you get 5 free credits each month.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-12">
                  <AccordionTrigger className="text-left">
                    Do you offer refunds?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    If you think you were charged by mistake or something went wrong, contact us at support@pivothub.io or 269.998.4203 with your account email and the reason. We review each refund request individually. If a payment is refunded, the credits from that payment are removed from your account.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* CTA Section */}
            <div className="mt-16 text-center p-8 rounded-lg bg-card border">
              <h3 className="text-2xl font-bold mb-3">Still have questions?</h3>
              <p className="text-muted-foreground mb-6">
                We're here to help! Reach out to our team for personalized assistance.
              </p>
              <Link to="/contact">
                <Button size="lg">Contact Us</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
