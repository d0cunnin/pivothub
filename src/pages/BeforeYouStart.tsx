import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Compass, Target, BookOpen, DollarSign, Rocket, Calendar, Banknote, Users, Briefcase, GraduationCap } from "lucide-react";
import { PACKAGE_TOOLS } from "@/utils/packageAccess";

const BeforeYouStart = () => {
  const tools = [
    {
      icon: Target,
      title: "Assess It",
      description: "Assess It helps you understand where you are starting and what you need next. It contains three assessments that measure readiness, skill level, and direction. After your results, it recommends the best tool to begin with so you do not waste time guessing.",
      cta: "Begin Assessment",
      link: "/assessit",
      color: "text-blue-600"
    },
    {
      icon: Rocket,
      title: "Build It",
      description: "Build It is a guided business coach that helps you create a business idea, define your audience, develop your offer, and structure a simple business plan. It also introduces beginner friendly marketing strategy so you know how to position your idea clearly and confidently.",
      cta: "Start Building",
      link: "/buildit",
      color: "text-purple-600"
    },
    {
      icon: DollarSign,
      title: "Earn It",
      description: "Earn It helps you begin making income quickly based on the skills, resources, or time you already have. It focuses on attainable earning opportunities that do not require a large budget or an advanced business setup.",
      cta: "Start Earning",
      link: "/earnit",
      color: "text-green-600"
    },
    {
      icon: GraduationCap,
      title: "Teach It",
      description: "Teach It helps you turn what you know into a class, workshop, or learning experience. It walks you through how to structure your content and prepare to teach in a way that is organized and easy to follow.",
      cta: "Create My Class",
      link: "/teachit",
      color: "text-amber-600"
    },
    {
      icon: Rocket,
      title: "Launch It",
      description: "Launch It helps you bring your product, service, or program to the public. It guides you through audience preparation, messaging, and launch readiness so you can present your work with confidence.",
      cta: "Prepare My Launch",
      link: "/launchit",
      color: "text-indigo-600"
    },
    {
      icon: Calendar,
      title: "Schedule It",
      description: "Schedule It helps you create a realistic weekly schedule that fits your real life. It gathers your current work or school schedule first, then helps you identify the time you can truly commit. This ensures structure without burnout.",
      cta: "Create My Schedule",
      link: "/scheduleit",
      color: "text-pink-600"
    },
    {
      icon: Banknote,
      title: "Fund It",
      description: "Fund It helps you find pathways to financial support. It includes guidance on grants, sponsorships, and community-based funding. It also includes a grant proposal writer to help you prepare a professional application.",
      cta: "Find Funding",
      link: "/grantwriting",
      color: "text-emerald-600"
    },
    {
      icon: Users,
      title: "Host It",
      description: "Host It helps you plan and organize in-person, virtual, or hybrid events. It guides you through tech setup, speaker invitations, sponsorships, marketing, audience building, and post event follow-up.",
      cta: "Plan My Event",
      link: "/hostit",
      color: "text-orange-600"
    },
    {
      icon: Briefcase,
      title: "Prep It",
      description: "Prep It helps you prepare for employment opportunities. It includes a resume and CV builder, interview preparation tools, and a guided job coaching experience.",
      cta: "Prepare for Work",
      link: "/prepit",
      color: "text-cyan-600"
    },
    {
      icon: BookOpen,
      title: "Learn It",
      description: "Learn It provides short micro courses that teach practical skills you can apply immediately. These lessons support your development and help you grow into your next step with confidence.",
      cta: "Start Learning",
      link: "/learn-a-skill",
      color: "text-rose-600"
    }
  ];

  const toolDisplayNames: Record<string, string> = {
    'career-assessment': 'Career Assessment',
    'skills-assessment': 'Skills Assessment',
    'personality-assessment': 'Personality Assessment',
    'interview-questions': 'Interview Questions',
    'interview-feedback': 'Interview Feedback',
    'resume-analyzer': 'Resume Analyzer',
    'learn-a-skill': 'Learn a Skill',
    'business-mentor': 'Business Mentor',
    'business-plan': 'Business Plan',
    'business-idea': 'Business Idea',
    'business-foundation': 'Business Foundation',
    'business-resources': 'Business Resources',
    'pitch-deck': 'Pitch Deck',
    'logo-generator': 'Logo Generator',
    'name-checker': 'Name Checker',
    'legal-docs': 'Legal Documents',
    'marketing-strategy': 'Marketing Strategy',
    'social-media': 'Social Media',
    'teaching-materials': 'Teaching Materials',
    'startup-checklist': 'Startup Checklist',
    'grant-finder': 'Grant Finder',
    'grant-content': 'Grant Content',
    'grant-resources': 'Grant Resources'
  };

  const getToolsList = (packageKey: string) => {
    const tools = PACKAGE_TOOLS[packageKey as keyof typeof PACKAGE_TOOLS];
    if (packageKey === 'all-access') {
      return 'All tools included';
    }
    return tools.map(tool => toolDisplayNames[tool] || tool).join(', ');
  };

  return (
    <>
      <Helmet>
        <title>Before You Get Started | PivotHub</title>
        <meta 
          name="description" 
          content="Learn how PivotHub works and discover which tools are right for your journey. Get guidance on starting your path to income, clarity, career, or business growth." 
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        {/* Hero Section */}
        <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center space-y-6 animate-fade-in">
              <Badge variant="secondary" className="text-sm md:text-base px-4 py-2">
                <Compass className="w-4 h-4 mr-2 inline" />
                Getting Started Guide
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
                Before You Get Started
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Learn how PivotHub works and find the right tool for your journey.
              </p>
            </div>
          </div>
        </section>

        {/* Section 1: Introduction */}
        <section className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Welcome to PivotHub
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                This platform was created to give you guided steps that help you move from where you are now into your next stage of income, clarity, career, or business growth. You do not have to figure everything out at once. You only need the next right step, and each tool in PivotHub is designed to help you reach that next step with structure and ease.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: How PivotHub Works */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                How PivotHub Works
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                PivotHub is organized into tools that match different parts of your journey. Some tools are designed to help you start earning. Some help you build a business idea. Some help you prepare for employment. Others help you launch, host events, or get funded. You do not need every tool right away. You only need the one that fits the stage you are currently in.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: The Tools */}
        <section className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-foreground">
                The Tools
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool, index) => (
                  <Card key={index} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <tool.icon className={`w-8 h-8 ${tool.color}`} />
                        <CardTitle className="text-xl">{tool.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4">
                      <CardDescription className="text-sm leading-relaxed flex-1">
                        {tool.description}
                      </CardDescription>
                      <Button variant="default" size="lg" className="w-full" asChild>
                        <Link to={tool.link}>{tool.cta}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: If You Are Unsure Where to Start */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                If You Are Unsure Where to Start
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8">
                If you are not sure which tool to begin with, start with Assess It. It will help you understand your current stage and direct you toward the best next step.
              </p>
              <Button variant="default" size="lg" asChild>
                <Link to="/assessit">
                  <Target className="w-5 h-5 mr-2" />
                  Begin Assessment
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Section 5: Subscription Visibility */}
        <section className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-foreground">
                What Is Included in Each Tier
              </h2>
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Explore Mode</CardTitle>
                    <CardDescription>5 free credits per month to try any tool</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      All tools available with credit limitations
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Assess It + Prep It + Learn It Package</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {getToolsList('assess-prep-learn')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Build It + Teach It + Launch It Package</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {getToolsList('build-teach-launch')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Fund It Package</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {getToolsList('fund-it')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="text-2xl">All Access Pass</CardTitle>
                    <CardDescription>Unlimited access to every tool</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {getToolsList('all-access')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-12 text-center">
                <Button variant="outline" size="lg" asChild>
                  <Link to="/pricing">View Pricing Details</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default BeforeYouStart;
