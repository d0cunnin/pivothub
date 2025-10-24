import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import heroImage from "@/assets/hero-image.jpg";
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
        <section className="py-20 bg-primary relative overflow-hidden">
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80"></div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-accent"></div>
          <div className="absolute top-10 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-10 w-24 h-24 bg-accent/15 rounded-full blur-lg"></div>
          
          <div className="container mx-auto px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-5xl mx-auto">
              <div className="inline-flex items-center justify-center px-8 py-4 rounded-3xl bg-white/15 mb-8 shadow-glow backdrop-blur-sm animate-fade-in-scale border border-white/20">
                <span className="text-3xl font-bold text-white tracking-wider">BEFORE YOU GET STARTED</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up">
                Before You Get Started
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in max-w-4xl mx-auto" style={{ animationDelay: '0.2s' }}>
                Learn how PivotHub works and discover which tools are right for your journey. Get guidance on starting your path to income, clarity, career, or business growth.
              </p>
            </div>
          </div>
        </section>

        {/* Section 1: Introduction */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                What Is PivotHub?
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                PivotHub is a comprehensive platform designed to help you achieve income, career clarity, or business growth. Whether you're looking to upskill, prepare for your next career move, earn extra income, teach others, build a business, or find funding, we have the tools to guide you every step of the way.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: How PivotHub Works */}
        <section className="py-20 bg-accent">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                How PivotHub Works
              </h2>
              <p className="text-lg text-white/90 leading-relaxed">
                Our platform offers different tools to support specific goals. Each tool is designed to give you actionable guidance and results quickly.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: The Tools */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-foreground">
                The Tools
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool, index) => (
                  <Card key={index} className="premium-card flex flex-col hover:shadow-lg transition-elegant hover:scale-105">
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
        <section className="py-20 bg-primary relative overflow-hidden">
          <div className="absolute top-10 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-10 w-24 h-24 bg-accent/15 rounded-full blur-lg"></div>
          
          <div className="container mx-auto px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                Not Sure Where to Start?
              </h2>
              <p className="text-lg text-white/90 mb-8">
                If you're unsure which tool is right for you, we recommend starting with <strong>Assess It</strong>. This tool helps you understand your skills, goals, and the best path forward.
              </p>
              <Button size="lg" variant="hero" className="shadow-glow transition-elegant hover:scale-105" asChild>
                <Link to="/assessit">
                  <Target className="w-5 h-5 mr-2" />
                  Start with Assess It
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Section 5: Subscription Visibility */}
        <section className="py-20 bg-accent">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-white">
                What Is Included in Each Tier
              </h2>
              <div className="space-y-6">
                <Card className="premium-card">
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

                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle className="text-2xl">Assess It + Prep It + Learn It Package</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {getToolsList('assess-prep-learn')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle className="text-2xl">Build It + Teach It + Launch It Package</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {getToolsList('build-teach-launch')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle className="text-2xl">Fund It Package</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {getToolsList('fund-it')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="premium-card border-primary">
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
                <Button variant="hero" size="lg" asChild>
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
