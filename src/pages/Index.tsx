import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { ArrowUpRight, ArrowRight, CheckCircle, Rocket, Target, BriefcaseBusiness, CalendarDays, Sprout, Mic, ClipboardCheck, GraduationCap, Lightbulb, HandCoins, FileCheck2, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  StructuredData,
  organizationSchema,
  webApplicationSchema,
  generateFAQSchema,
} from "@/components/StructuredData";
import heroVideo from "@/assets/hero-video.mp4";

const Index = () => {
  const features = [
    {
      icon: ClipboardCheck,
      title: "Assess It",
      description: "Assess, improve, and grow with confidence.",
      link: "/assessit",
      badge: "Start here",
    },
    {
      icon: BriefcaseBusiness,
      title: "Prep It",
      description: "Prepare for career success with expert guidance.",
      link: "/prepit",
    },
    {
      icon: HandCoins,
      title: "Earn It",
      description: "Discover the right income opportunities for your lifestyle.",
      link: "/earnit",
    },
    {
      icon: GraduationCap,
      title: "Teach It",
      description: "Monetize your expertise by teaching others what you know best.",
      link: "/teachit",
    },
    {
      icon: CalendarDays,
      title: "Host It",
      description: "Create and manage events that bring people together.",
      link: "/hostit",
    },
    {
      icon: CalendarDays,
      title: "Schedule It",
      description: "Organize your time and appointments with ease.",
      link: "/scheduleit",
    },
    {
      icon: Lightbulb,
      title: "Build It",
      description: "Turn your ideas into reality step by step.",
      link: "/buildit",
    },
    {
      icon: Rocket,
      title: "Launch It",
      description: "Get everything ready to go live with ease.",
      link: "/launchit",
    },
    {
      icon: HandCoins,
      title: "Fund It",
      description: "Explore funding options and strategies.",
      link: "/fundit",
    },
    {
      icon: Building2,
      title: "Develop It",
      description: "Design community programs and prepare for government contracts.",
      link: "/developit",
    },
    {
      icon: FileCheck2,
      title: "Contract It",
      description: "Build capability statements and assess contract readiness.",
      link: "/contractit",
    },
    {
      icon: Mic,
      title: "Speak It",
      description: "Launch your voice as a speaker or podcaster with professional guidance.",
      link: "/speakit",
    },
    {
      icon: Sprout,
      title: "Garden It",
      description: "Plan your garden by location and season.",
      link: "/gardenit",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Choose your path",
      description: "Select the toolkit that fits your goals.",
    },
    {
      number: "02",
      title: "Get your blueprint",
      description: "Follow AI-guided steps to stay on track.",
    },
    {
      number: "03",
      title: "Grow your results",
      description: "Launch, earn, and keep building forward.",
    },
  ];

  const testimonials = [
    {
      name: "Shayla R.",
      role: "Entrepreneur",
      quote:
        "PivotHub gave me the clarity and tools I needed to launch my business. The AI-guided steps made everything feel achievable.",
    },
    {
      name: "David K.",
      role: "Creator",
      quote:
        "I went from idea to launch in 90 days. The blueprint approach kept me focused and motivated through every step.",
    },
    {
      name: "Jessica R.",
      role: "Career Changer",
      quote:
        "The assessment tools helped me understand my strengths and find the right path forward. Truly transformative.",
    },
  ];

  const faqData = [
    {
      question: "What do I do if I just lost my job?",
      answer:
        "Start with a PivotHub career assessment to identify your strengths and explore new opportunities. Then use our job preparation tools to optimize your resume and practice interviews while exploring side income options.",
    },
    {
      question: "Can I use PivotHub for free?",
      answer:
        "Yes. The Free plan gives you 5 credits every month to use on any tool, with no credit card required. An assessment uses 2 credits. Paid plans give you more credits each month.",
    },
    {
      question: "How quickly can I see results?",
      answer:
        "Most users complete their first assessment in under 10 minutes and receive actionable insights immediately. Many users land interviews within 30 days using our AI-powered tools.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>PivotHub — One Platform to Grow, Pivot, and Build Your Future with AI</title>
        <meta
          name="description"
          content="PivotHub is an all-in-one platform with AI-powered tools that help you upskill, launch ideas, pivot careers, and build new opportunities. Learn, create, and grow your future with guided AI support — all in one place."
        />
        <meta property="og:title" content="Stuck in Transition? Build What’s Next. | PivotHub" />
        <meta
          property="og:description"
          content="AI-powered career transition tools for people facing job loss. Career assessments, resume help, and income strategies."
        />
      </Helmet>

      <StructuredData data={organizationSchema} />
      <StructuredData data={webApplicationSchema} />
      <StructuredData data={generateFAQSchema(faqData)} />

      <Header />

      <main className="home-refresh">
        <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
          <video autoPlay loop muted playsInline aria-hidden="true" className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden">
            <source src={heroVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-primary/85" />
          <div className="page-container relative py-16 md:py-20 lg:py-24">
            <div className="max-w-3xl">
              <p className="mb-5 flex items-center gap-3 text-sm font-medium text-primary-foreground/85">
                <span className="h-px w-8 bg-primary-foreground/60" /> Your next chapter starts here
              </p>
              <h1 className="text-5xl font-bold leading-tight md:text-6xl">PivotHub</h1>
              <p className="mt-4 max-w-2xl text-3xl font-semibold leading-snug md:text-4xl">
                AI tools that help you grow, pivot, and move forward.
              </p>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-primary-foreground/85">
                Learn new skills, launch ideas, and build income-ready projects with practical AI tools.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" variant="heroWhite" className="h-12 border-card px-6 hover:scale-100" asChild>
                  <Link to="/before-you-start"><Rocket className="h-4 w-4" />Start Here<ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 border-primary-foreground/50 bg-transparent px-6 text-primary-foreground hover:scale-100 hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
                  <Link to="/assessit"><Target className="h-4 w-4" />Take an Assessment</Link>
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-2 text-sm text-primary-foreground/85">
                <span>Free to start · No credit card required ·</span>
                <Button variant="link" className="h-auto p-0 text-primary-foreground underline underline-offset-4" onClick={() => document.getElementById("explore-hub")?.scrollIntoView({ behavior: "smooth" })}>or explore all tools</Button>
              </div>
            </div>
          </div>
        </section>

        <section id="explore-hub" className="scroll-mt-6 bg-background pt-12 pb-28 md:pt-16 md:pb-36">
          <div className="page-container">
            <div className="mb-10 max-w-3xl">
              <p className="mb-3 text-sm font-semibold text-secondary">Explore the hub</p>
              <h2 className="text-3xl font-bold leading-tight md:text-4xl">Explore What You Can Do With PivotHub</h2>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-foreground/70">
                From learning new skills to launching your first idea, PivotHub gives you the AI-driven tools to make it happen.
              </p>
            </div>
            <div className="space-y-10">
              {[
                { title: "Career & skills", titles: ["Assess It", "Prep It"] },
                { title: "Income & ideas", titles: ["Earn It", "Teach It", "Build It"] },
                { title: "Planning & launching", titles: ["Host It", "Schedule It", "Launch It", "Speak It", "Garden It"] },
                { title: "Funding & growth", titles: ["Fund It", "Develop It", "Contract It"] },
              ].map((category) => (
                <div key={category.title}>
                  <div className="mb-4 flex items-center gap-4">
                    <h3 className="shrink-0 text-base font-semibold text-foreground">{category.title}</h3>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {features.filter((feature) => category.titles.includes(feature.title)).map((feature) => {
                      const Icon = feature.icon;
                      return (
                        <Link key={feature.title} to={feature.link} className="group rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                          <Card className="h-full border-border bg-card shadow-none transition-colors duration-200 group-hover:border-secondary/50 group-hover:bg-secondary/5">
                            <CardHeader className="p-5 pb-3">
                              <div className="mb-5 flex items-center justify-between gap-2">
                                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary/10 text-secondary"><Icon className="h-5 w-5" /></span>
                                {feature.badge ? <span className="rounded-md bg-secondary/10 px-2 py-1 text-xs font-semibold text-secondary">{feature.badge}</span> : <ArrowUpRight className="h-4 w-4 text-foreground/40 transition-colors group-hover:text-secondary" />}
                              </div>
                              <h4 className="text-xl font-semibold text-card-foreground">{feature.title}</h4>
                            </CardHeader>
                            <CardContent className="p-5 pt-0"><CardDescription className="text-sm leading-relaxed text-foreground/70">{feature.description}</CardDescription></CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/50 py-12 md:py-16">
          <div className="page-container">
            <div className="mb-10">
              <h2 className="text-3xl font-bold md:text-4xl">How It Works</h2>
              <p className="mt-4 text-lg text-foreground/70">PivotHub makes it easy to go from idea to impact.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((step, index) => {
                const images = [
                  { src: "/lovable-uploads/a2d8ed6b-e7a3-4bba-b5d7-9c2dd209ea3d.png", alt: "Professional woman collaborating with team", caption: "Your Career Success Story" },
                  { src: "/lovable-uploads/a848a1b8-cd18-4243-a70f-0ba5af49802a.png", alt: "Entrepreneur with keys representing business ownership", caption: "Build Your Business" },
                  { src: "/lovable-uploads/15ff2b92-41d2-4845-9967-ed77d59d05c2.jpg", alt: "Team learning and growing together", caption: "Learn & Grow Together" },
                ];
                const image = images[index];
                return (
                  <div key={step.number}>
                    {image && <figure><img src={image.src} alt={image.alt} loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover" /><figcaption className="mt-3 text-sm font-medium text-secondary">{image.caption}</figcaption></figure>}
                    <div className="mt-6 flex items-baseline gap-3"><span className="text-sm font-semibold text-primary">{step.number}</span><h3 className="text-xl font-semibold">{step.title}</h3></div>
                    <p className="mt-3 text-base leading-relaxed text-foreground/70">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-background py-12 md:py-16">
          <div className="page-container">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-3xl font-bold md:text-4xl">Real People. Real Results.</h2>
              <p className="mt-4 text-lg leading-relaxed text-foreground/70">See how creators, entrepreneurs, and learners are transforming ideas into reality with PivotHub.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.name} className="flex flex-col border-border bg-card shadow-none">
                  <CardContent className="flex-1 p-6"><p className="text-base leading-relaxed text-foreground/80">“{testimonial.quote}”</p></CardContent>
                  <CardHeader className="flex-row items-center gap-3 p-6 pt-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{testimonial.name.charAt(0)}</span>
                    <div><h3 className="text-base font-semibold">{testimonial.name}</h3><CardDescription className="mt-1 text-sm text-foreground/60">{testimonial.role}</CardDescription></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-secondary py-12 text-secondary-foreground md:py-16">
          <div className="page-container">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-2xl"><h2 className="text-3xl font-bold md:text-4xl">Start Building Today</h2><p className="mt-4 text-lg leading-relaxed text-secondary-foreground/85">Your next chapter begins here. Get access to AI-powered tools that help you grow smarter and faster.</p></div>
              <Button size="lg" variant="heroWhite" className="h-12 shrink-0 border-card px-6 hover:scale-100" asChild><Link to="/auth?tab=signup">Join PivotHub Free<ArrowRight className="h-4 w-4" /></Link></Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-secondary-foreground/20 pt-6 text-sm text-secondary-foreground/85">
              {["No credit card required", "Start free", "Cancel anytime"].map((text) => <span key={text} className="flex items-center gap-2"><CheckCircle className="h-4 w-4" />{text}</span>)}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
