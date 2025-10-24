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
              <span className="text-3xl font-bold text-white tracking-wider">ABOUT US</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up text-center">
              About Our Mission
            </h1>
          <p className="text-lg md:text-xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in max-w-4xl mx-auto text-center" style={{ animationDelay: '0.2s' }}>
            Empowering careers and transforming lives through innovation, mentorship, and opportunity
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
                  PivotHub was born out of necessity during a critical period in our economy. Between January and October 2025, 
                  hundreds of thousands of people found themselves unemployed or underemployed, facing an unprecedented challenge 
                  in securing meaningful work.
                </p>
                <p className="section-body-text">
                  As we witnessed this crisis unfold, it became clear that traditional approaches to career development were 
                  no longer sufficient. The accelerated pace of technological advancement was reshaping entire industries, 
                  creating both challenges and opportunities for the workforce.
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
                  We realized that people needed more than just job search assistance. They needed comprehensive tools to either 
                  upskill for the evolving job market or forge their own path through entrepreneurship.
                </p>
                <p className="section-body-text">
                  PivotHub was created to provide exactly that: a platform where individuals can either develop new skills to become more 
                  marketable for employment or launch their own businesses with the tools and guidance they need to succeed.
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
            <p className="section-description text-white/90">
              Empowering individuals to navigate career transitions through comprehensive assessment tools, skill development, entrepreneurship support, and preparation resources—all powered by AI-driven tools and expert guidance.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center mb-16">
            <div className="space-y-6">
              <h3 className="section-header text-white">Discover Your Path</h3>
              <p className="section-body-text text-white/90">
                Start with our comprehensive career assessment tools to identify your strengths, skills, and ideal career direction. Whether you're pivoting to a new industry, developing new skills for emerging opportunities, or preparing to launch your own venture, our AI-powered tools provide personalized insights to guide your journey.
              </p>
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
              <p className="section-body-text text-white/90">
                From job preparation and interview coaching to launching your own business, teaching a skill, or securing funding—we provide end-to-end support. Our platform includes AI-powered resume builders, business plan generators, pitch deck creators, funding assistance, and course development tools to help you succeed in any direction you choose.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center mb-16">
            <div className="space-y-6">
              <h3 className="section-header text-white">Learn & Grow</h3>
              <p className="section-body-text text-white/90">
                Access curated learning pathways designed to help you master in-demand skills. Whether you're learning to code, developing business acumen, or gaining expertise to teach others, our interactive courses and AI mentorship provide the knowledge and confidence you need to thrive in today's digital economy.
              </p>
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
            <p className="section-body-text text-white/90 mb-6">
              Since July 2025, we've been helping professionals navigate career transitions with confidence. Whether you're seeking your next job opportunity, launching a business, teaching your expertise, or securing grant funding, PivotHub provides the comprehensive tools, AI-powered guidance, and supportive community you need to pivot successfully into your future.
            </p>
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