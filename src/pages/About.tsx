import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Users } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-hero hero-glow overflow-hidden">
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
            <div className="w-24 h-24 bg-white/15 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow backdrop-blur-sm animate-fade-in-scale">
              <Users className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up text-center">
              About Our Mission
            </h1>
            <div className="text-left max-w-4xl mx-auto">
              <p className="text-lg md:text-xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Empowering careers and transforming lives through innovation, mentorship, and opportunity
              </p>
            </div>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      {/* Story Content */}
      <section className="section-spacing">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-8 items-center mb-16">
            <div className="space-y-6">
              <h2 className="section-header">The Beginning of ReLaunch</h2>
              <div className="space-y-4">
                <p className="section-body-text">
                  ReLaunch was born out of necessity during a critical period in our economy. Between January and July 2025, 
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
                  src="/lovable-uploads/55e6a726-43cb-426b-924c-84bf4a8ebab7.png"
                  alt="Professional team collaboration and success" 
                  className="max-w-md aspect-video object-cover rounded-xl shadow-md hover:shadow-lg transition-shadow"
                />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="lg:mr-4 order-2 lg:order-1">
              <div className="relative">
                <img 
                  src="/lovable-uploads/6dbaa8ab-9c93-4c2a-b08e-63196b35ecab.png"
                  alt="Professional mentorship and partnership" 
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
                  ReLaunch was created to provide exactly that: a platform where individuals can either reskill to become more 
                  marketable for employment or launch their own businesses with the tools and guidance they need to succeed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission and Values */}
      <section className="section-spacing bg-gradient-to-br from-secondary/5 via-background to-accent/5">
        <div className="page-container">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="section-header mb-6">Our Mission & Values</h2>
            <p className="section-description">
              We believe in fostering environments where professionals thrive, businesses grow strategically, and meaningful relationships drive success.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center mb-16">
            <div className="space-y-6">
              <h3 className="section-header">Find Your Career Path</h3>
              <p className="section-body-text">
                Discover your ideal career direction with personalized guidance and assessment tools. Whether you're looking to reskill for new opportunities or launch your own business, we help you identify the path that aligns with your goals, skills, and aspirations.
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
              <h3 className="section-header">Strategic Planning</h3>
              <p className="section-body-text">
                Empowering individuals and organizations with the tools and insights needed for long-term success and sustainable growth. Our strategic approach helps you navigate complex challenges and identify opportunities for advancement.
              </p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto text-center">
            <h3 className="section-header">Join Our Mission</h3>
            <p className="section-body-text mb-6">
              Whether you're looking to advance your career, reskill for the future, or launch your own business, we're here to provide the tools, guidance, and community support you need to succeed.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}