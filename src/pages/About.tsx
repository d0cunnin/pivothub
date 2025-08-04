import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-32 px-4 overflow-hidden">
        <div className="floating-orb floating-orb-1"></div>
        <div className="floating-orb floating-orb-2"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-block p-8 bg-gradient-to-r from-secondary/10 to-accent/10 rounded-3xl mb-8 shadow-premium backdrop-blur-sm">
              <h1 className="text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent">Our Story</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Empowering individuals to relaunch their careers and build sustainable futures in a rapidly changing world.
            </p>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="section-divider"></div>

      {/* Story Content */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            {/* Text Content */}
            <div className="animate-fade-in space-y-8">
              <div className="space-y-6 text-lg leading-relaxed">
                <p className="text-foreground">
                  ReLaunch was born out of necessity during a critical period in our economy. Between January and July 2025, 
                  hundreds of thousands of people found themselves unemployed or underemployed, facing an unprecedented challenge 
                  in securing meaningful work.
                </p>
                <p className="text-muted-foreground">
                  As we witnessed this crisis unfold, it became clear that traditional approaches to career development were 
                  no longer sufficient. The accelerated pace of technological advancement was reshaping entire industries, 
                  creating both challenges and opportunities for the workforce.
                </p>
              </div>
            </div>

            {/* Image */}
            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="premium-card overflow-hidden">
                <img 
                  src="/lovable-uploads/6dbaa8ab-9c93-4c2a-b08e-63196b35ecab.png" 
                  alt="Successful professional celebrating achievement" 
                  className="w-full h-96 object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            {/* Image */}
            <div className="animate-fade-in lg:order-1 order-2">
              <div className="premium-card overflow-hidden">
                <img 
                  src="/lovable-uploads/a848a1b8-cd18-4243-a70f-0ba5af49802a.png" 
                  alt="Professional handshake partnership" 
                  className="w-full h-96 object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>

            {/* Text Content */}
            <div className="animate-fade-in lg:order-2 order-1 space-y-8">
              <div className="space-y-6 text-lg leading-relaxed">
                <p className="text-foreground">
                  We realized that people needed more than just job search assistance. They needed comprehensive tools to either 
                  upskill for the evolving job market or forge their own path through entrepreneurship.
                </p>
                <p className="text-muted-foreground">
                  ReLaunch was created to provide exactly that: a platform where individuals can either reskill to become more 
                  marketable for employment or launch their own businesses with the tools and guidance they need to succeed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="section-divider"></div>

      {/* Team Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-muted/5 to-transparent relative overflow-hidden">
        <div className="floating-orb floating-orb-3"></div>
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-6">
              Our Mission in Action
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Today, we're proud to be part of the solution, helping thousands of people relaunch their vocations 
              and build sustainable futures that create positive economic impact.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="premium-card text-center overflow-hidden group">
              <img 
                src="/lovable-uploads/01e0edd3-5dc1-45ef-986a-d0f9404e0159.png" 
                alt="Professional team member" 
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">Happy at Work</h3>
                <p className="text-muted-foreground">Creating positive work environments where professionals thrive</p>
              </div>
            </div>

            <div className="premium-card text-center overflow-hidden group">
              <img 
                src="/lovable-uploads/ff570306-7c9e-46e8-9820-4eeea020f969.png" 
                alt="Professional working on business plan" 
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">Strategic Planning</h3>
                <p className="text-muted-foreground">Developing comprehensive strategies for career and business success</p>
              </div>
            </div>
          </div>

          <div className="premium-card overflow-hidden">
            <div className="p-8 text-center">
              <h3 className="text-3xl font-semibold text-foreground mb-6">Building Relationships</h3>
              <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Strong partnerships and meaningful connections form the foundation of successful 
                career transitions and business growth. We believe in the power of community and collaboration.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}