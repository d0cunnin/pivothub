import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import heroImage from "@/assets/hero-image.jpg";
import dandreaBolden from "@/assets/dandrea-bolden.jpg";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-primary hero-glow overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80"></div>
        </div>
        
        {/* Sophisticated floating orbs */}
        <div className="floating-orb top-16 right-16 w-40 h-40 bg-primary/8 animate-float"></div>
        <div className="floating-orb bottom-24 left-16 w-32 h-32 bg-secondary/10 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="floating-orb top-1/3 right-1/3 w-24 h-24 bg-accent/12 animate-float" style={{ animationDelay: '4s' }}></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center justify-center px-8 py-4 rounded-3xl bg-white/15 mb-8 shadow-glow backdrop-blur-sm animate-fade-in-scale border border-white/20">
              <span className="text-3xl font-bold text-white tracking-wider">ABOUT</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up text-center">
              Our Story + Visionary
            </h1>
          <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in max-w-4xl mx-auto text-center" style={{ animationDelay: '0.2s' }}>
            Your Pathway to What's Next
          </p>
          </div>
        </div>
      </section>

      {/* Story Content */}
      <section className="section-spacing bg-white">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-8 items-center mb-16">
            <div className="space-y-6">
              <h2 className="section-header">The Beginning of PivotHub</h2>
              <div className="space-y-4">
                <p className="section-body-text">
                  PivotHub was created for a world in transition. Between January and October 2025, hundreds of thousands of people faced income loss and job uncertainty, revealing a hard truth: traditional career development tools were no longer enough.
                </p>
                <p className="section-body-text">
                  As industries evolved faster than ever before, people needed more than advice; they needed direction, strategy, and a way forward. PivotHub was born out of that necessity, an AI-powered platform designed to guide individuals and organizations through change with clarity, confidence, and purpose.
                </p>
                <p className="section-body-text italic text-primary font-medium">
                  Clarity is power, and forward is a direction, not a deadline.
                </p>
              </div>
            </div>
            <div className="lg:ml-4">
              <div className="relative">
                <img 
                  src="/lovable-uploads/d09b060a-7d04-49c0-ba9a-8685338c29c1.png"
                  alt="Diverse team of professionals collaborating in a modern meeting environment" 
                  className="max-w-md aspect-video object-cover rounded-xl shadow-md hover:shadow-lg transition-shadow"
                />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="lg:mr-4 order-2 lg:order-1">
              <div className="relative">
                <img 
                  src="/lovable-uploads/0dc8e049-6853-488a-ba7e-2c5087721c46.png"
                  alt="Professional woman with curly hair looking at innovative digital technology displays" 
                  className="max-w-md aspect-video object-cover rounded-xl shadow-md hover:shadow-lg transition-shadow"
                />
              </div>
            </div>
            <div className="space-y-6 order-1 lg:order-2">
              <h2 className="section-header">Growing Together</h2>
              <div className="space-y-4">
                <p className="section-body-text">
                  At PivotHub, we believe transitions are not roadblocks; they are turning points. We realized people did not just need job search assistance; they needed a pathway. PivotHub bridges the gap between where you are and where you want to go, offering AI-powered tools that simplify rebuilding, reskilling, and reimagining what comes next.
                </p>
                <p className="section-body-text italic text-primary font-medium">
                  You are not lost. You are in transition.
                </p>
                <p className="section-body-text">
                  Our platform helps users take action, one guided step at a time, with personalized AI insights that translate uncertainty into opportunity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission and Values */}
      <section className="section-spacing bg-accent">
        <div className="page-container">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="section-header mb-6 text-white">Our Mission & Values</h2>
            
            <div className="space-y-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-3">Our Mission</h3>
                <p className="section-description text-white/90">
                  To empower people through life's transitions with clarity and confidence by providing AI-powered pathways and personalized guidance that create opportunity, inspire purpose, and bring structure to every next step.
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-3">Our Vision</h3>
                <p className="section-description text-white/90">
                  A world where every person, regardless of background or circumstance, has access to the tools, knowledge, and technology needed to reinvent themselves, create new income, and thrive in an ever-changing economy.
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center mb-16">
            <div className="space-y-6">
              <h3 className="section-header text-white">Discover Your Path</h3>
              <div className="space-y-4">
                <p className="section-body-text text-white/90">
                  Every journey starts with clarity. PivotHub's comprehensive assessments and interactive tools help you uncover your strengths, identify opportunities, and take the next right step toward your future.
                </p>
                <p className="section-body-text text-white/90 font-medium italic">
                  Our Promise: Every experience with PivotHub delivers clarity, direction, and measurable progress.
                </p>
                <p className="section-body-text text-white/90">
                  Whether you are pivoting into a new industry, developing new skills, or preparing to launch your own venture, PivotHub gives you the structure, insights, and tools to move forward with clarity and confidence.
                </p>
              </div>
            </div>
            <div className="lg:ml-4">
              <img 
                src="/lovable-uploads/8d6ceafa-b82d-4c50-a345-214b613d62c1.png"
                alt="Professional guidance for career path discovery" 
                className="max-w-md aspect-video object-cover rounded-xl shadow-md hover:shadow-lg transition-shadow"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center mb-16">
            <div className="lg:mr-4 order-2 lg:order-1">
              <img 
                src="/lovable-uploads/ee28fb16-2345-4e1b-a162-97d7223536c1.png" 
                alt="Strategic business planning and innovation" 
                className="max-w-md aspect-video object-cover rounded-xl shadow-md hover:shadow-lg transition-shadow"
              />
            </div>
            <div className="space-y-6 order-1 lg:order-2">
              <h3 className="section-header text-white">Build Your Future</h3>
              <div className="space-y-4">
                <p className="section-body-text text-white/90">
                  From job preparation and interview coaching to launching a business or creating digital products, PivotHub provides end-to-end support. Our AI-powered tools include resume builders, business plan generators, pitch deck creators, and course development systems designed to help you plan, build, and succeed in any direction you choose.
                </p>
                <p className="section-body-text text-white/90 font-medium italic">
                  Forward does not have to be fast. It just has to be yours.
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center mb-16">
            <div className="space-y-6">
              <h3 className="section-header text-white">Learn and Grow</h3>
              <div className="space-y-4">
                <p className="section-body-text text-white/90">
                  Explore curated learning pathways built to help you develop practical, in-demand skills for today's evolving world. Whether you are strengthening professional abilities, expanding entrepreneurial knowledge, or preparing to teach what you know, PivotHub gives you the confidence, community, and clarity you need to grow at your own pace.
                </p>
                <p className="section-body-text text-white/90 font-medium italic">
                  Because when you learn, you lead. And when you lead, you help others pivot forward too.
                </p>
              </div>
            </div>
            <div className="lg:ml-4">
              <img 
                src="/lovable-uploads/15ff2b92-41d2-4845-9967-ed77d59d05c2.jpg"
                alt="Diverse team learning and growing together in a supportive environment" 
                className="max-w-md aspect-video object-cover rounded-xl shadow-md hover:shadow-lg transition-shadow"
              />
            </div>
          </div>

          <div className="max-w-3xl mx-auto text-center">
            <h3 className="section-header text-white">Join the PivotHub Community</h3>
            <div className="space-y-4">
              <p className="section-body-text text-white/90">
                In 2025, PivotHub has been helping professionals, entrepreneurs, and creators turn transition into transformation.
              </p>
              <p className="section-body-text text-white/90">
                Whether you are seeking your next opportunity, launching a business, or developing your next big idea, PivotHub is your pathway to what comes next.
              </p>
              <p className="section-body-text text-white/90 font-bold text-xl">
                Rebuild. Reimagine. Relaunch.
              </p>
              <p className="section-body-text text-white/90 italic">
                Together, we move forward, one pivot at a time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Visionary */}
      <section className="section-spacing bg-white">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="lg:mr-4">
              <img 
                src={dandreaBolden}
                alt="D'Andrea Bolden, MA - Founder & CEO of Bold AI Solutions" 
                className="w-full max-w-md mx-auto aspect-[3/4] object-cover object-top rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              />
            </div>
            <div className="space-y-6">
              <h2 className="section-header">The Visionary</h2>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-primary">D'Andrea Bolden, MA</h3>
                <p className="text-lg text-muted-foreground">Founder & CEO, Bold AI Solutions</p>
              </div>
              <div className="space-y-4">
                <p className="section-body-text">
                  D'Andrea Bolden is an entrepreneur, nonprofit leader, and technology strategist with more than 17 years of corporate experience. She holds a bachelor's degree in psychology and chemistry (minor), a master's degree in counseling, a master's degree in medical sciences, and a certification in AI Development.
                </p>
                <p className="section-body-text">
                  Beyond her corporate background, D'Andrea has built and led community-focused initiatives through entrepreneurship and the nonprofit sectors, developing programs that support workforce readiness, skills development, and access to opportunity.
                </p>
                <p className="section-body-text">
                  She is the founder of Bold AI Solutions, through which PivotHub was created as a platform designed to help individuals pivot forward with practical tools, structure, and pathways for growth.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}