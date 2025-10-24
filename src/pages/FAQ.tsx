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
                    What is Explore Mode?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Explore Mode is our <strong>free forever</strong> tier that gives you 5 credits every month based on your signup anniversary date. For example, if you sign up on January 15th, your credits reset on the 15th of every month. Unused credits do NOT roll over—they reset to 5 each month. No credit card required. Perfect for testing tools or occasional use.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left">
                    Which path is right for me?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    If you're job hunting, choose Prep It. Building a business? Pick Build It. Not sure? Get the All Access Pass for everything. Start with Explore Mode (free forever) to try our tools first!
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
                    What are AI requests?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Each tool uses a certain number of credits based on complexity: High-cost tools (like teaching materials) use 5 credits, medium-cost tools (like resumes) use 2 credits, and low-cost tools (like chatbots) use 1 credit. View tool costs before using them.
                    <p className="text-sm mt-3">
                      📊 <strong>Want to see the full breakdown?</strong> Check out "How many credits does each tool cost?" below for a complete list.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left">
                    When do my credits reset?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <strong>Paid plans:</strong> Credits reset on the same calendar day each month (your billing anniversary). For example, if you subscribed on January 31st, your credits reset on the 31st (or last day) of every month. <strong>Explore Mode:</strong> Credits reset based on your signup date. If you signed up on the 15th, credits reset on the 15th of every month.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left">
                    How does credit rollover work?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <strong>Paid plans:</strong> Unused credits roll over month-to-month, but rollover is capped at <strong>2× your monthly credit allotment</strong>. For example, with 50 credits/month, you can store up to 100 credits maximum. If you have 90 credits when your plan renews, you'll receive only 10 credits (not the full 50) to stay at the 100 credit cap. <strong>Explore Mode:</strong> No rollover—credits reset to 5 each month.
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
                          <li>• <strong>Explore Mode users:</strong> Start with low-cost tools (1 credit) to maximize your 5 monthly credits</li>
                          <li>• <strong>Paid users:</strong> Take advantage of rollover—unused credits carry over (up to 2× your monthly limit)</li>
                          <li>• <strong>High-value tools:</strong> Save Business Plan Generator (4 credits) and Teaching Materials (5 credits) for when you're ready to create final deliverables</li>
                          <li>• <strong>Chatbots:</strong> Use Career Advisor and Business Mentor freely—they're only 1 credit per conversation</li>
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
                      Earn It is now included in all subscription tiers! The Side Income Assessment 
                      uses <strong>1 credit</strong> to analyze your skills, experience, and goals. 
                      After completing the assessment, your personalized blueprint report is generated 
                      <strong> for free</strong>.
                    </p>
                    <p className="mb-3">
                      <strong>Available with:</strong>
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mb-3">
                      <li><strong>Explore Mode (Free):</strong> 5 credits/month - perfect for trying Earn It</li>
                      <li><strong>Paid Plans:</strong> 60-150 credits/month - use anytime</li>
                    </ul>
                    <p>
                      You can take the assessment multiple times to refine your side income strategy 
                      as your situation evolves (1 credit per assessment).
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-left">
                    What happens if I run out of requests?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    You can purchase extra credit packs (10, 25, or 50 requests) to continue using tools within your current billing month, or wait until your monthly requests reset.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger className="text-left">
                    Can I switch between paths?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes! You can upgrade, downgrade, or switch to a different path anytime. Changes take effect immediately.
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
                    We accept all major credit cards through our secure payment processor, Stripe.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-9">
                  <AccordionTrigger className="text-left">
                    What happens if my payment fails?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    If a payment fails, you enter a <strong>7-day grace period</strong> during which Stripe automatically retries charging your card (on Day 2 and Day 5). If payment succeeds during this time, your subscription continues normally with no disruption. If all retry attempts fail after 7 days, you'll be downgraded to Explore Mode with <strong>5 credits</strong>, and your new anniversary date will be the date of the downgrade.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-10">
                  <AccordionTrigger className="text-left">
                    Can I cancel anytime?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Absolutely! Cancel your subscription anytime from your account settings. You'll continue to have full access until the end of your current billing period, then automatically move to Explore Mode.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-11">
                  <AccordionTrigger className="text-left">
                    What happens to my credits when I cancel?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    When you cancel a paid subscription, you retain full access until the end of your current billing period. At the end of the period, you'll be downgraded to Explore Mode with <strong>5 credits</strong>. Your new Explore Mode anniversary will be set to 30 days after your billing cycle ends. For example, if your billing cycle ends on March 15th, you'll get 5 credits immediately and they'll reset on April 15th, May 15th, June 15th, etc.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-12">
                  <AccordionTrigger className="text-left">
                    Do you offer refunds?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Due to the nature of our digital services and instant access to tools, we do not offer refunds. All sales are final. Start with Explore Mode (free forever) to try our tools first!
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
