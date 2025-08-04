import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="section-spacing-lg relative">
        <div className="floating-orb floating-orb-1"></div>
        <div className="floating-orb floating-orb-2"></div>
        <div className="page-container">
          <div className="content-width text-center content-spacing animate-fade-in">
            <div className="inline-block card-padding bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent">Our Story</h1>
            </div>
            <p className="text-lg text-muted-foreground content-width-sm">
              Empowering individuals to relaunch their careers and build sustainable futures in a rapidly changing world.
            </p>
          </div>
        </div>
      </section>

      {/* Story Content */}
      <section className="section-spacing relative">
        <div className="page-container">
          <div className="content-width content-spacing">
            <div className="grid lg:grid-cols-2 grid-spacing items-center">
              <div className="animate-fade-in content-spacing-sm">
                <div className="text-base leading-relaxed space-y-4">
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

              <div className="animate-fade-in">
                <div className="premium-card overflow-hidden">
                  <img 
                    src="/lovable-uploads/93826e68-3e48-4081-ab4a-ba232392d1a6.png" 
                    alt="Professional team collaboration and success" 
                    className="w-full h-80 object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 grid-spacing items-center">
              <div className="animate-fade-in lg:order-1 order-2">
                <div className="premium-card overflow-hidden">
                  <img 
                    src="/lovable-uploads/a848a1b8-cd18-4243-a70f-0ba5af49802a.png" 
                    alt="Professional handshake partnership" 
                    className="w-full h-80 object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              </div>

              <div className="animate-fade-in lg:order-2 order-1 content-spacing-sm">
                <div className="text-base leading-relaxed space-y-4">
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
        </div>
      </section>

      {/* Team Section */}
      <section className="section-spacing bg-gradient-section-1 relative">
        <div className="floating-orb floating-orb-3"></div>
        <div className="page-container">
          <div className="content-width">
            <div className="text-center content-spacing mb-12">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Our Mission in Action
              </h2>
              <p className="text-lg text-muted-foreground content-width-sm">
                Today, we're proud to be part of the solution, helping thousands of people relaunch their vocations 
                and build sustainable futures that create positive economic impact.
              </p>
            </div>

            <div className="grid md:grid-cols-2 grid-spacing-sm mb-8">
              <div className="premium-card text-center overflow-hidden group card-padding">
                <img 
                  src="/lovable-uploads/a0a1a53e-8956-475c-97cd-acc5f732b5bc.png" 
                  alt="Professional businesswoman representing leadership" 
                  className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105 rounded-lg mb-4"
                />
                <h3 className="text-lg font-semibold text-foreground mb-2">Happy at Work</h3>
                <p className="text-muted-foreground text-sm">Creating positive work environments where professionals thrive</p>
              </div>

              <div className="premium-card text-center overflow-hidden group card-padding">
                <img 
                  src="/lovable-uploads/ee28fb16-2345-4e1b-a162-97d7223536c1.png" 
                  alt="Successful entrepreneur with innovative business" 
                  className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105 rounded-lg mb-4"
                />
                <h3 className="text-lg font-semibold text-foreground mb-2">Strategic Planning</h3>
                <p className="text-muted-foreground text-sm">Developing comprehensive strategies for career and business success</p>
              </div>
            </div>

            <div className="premium-card card-padding text-center">
              <h3 className="text-2xl font-semibold text-foreground mb-4">Building Relationships</h3>
              <p className="text-muted-foreground content-width-sm mx-auto">
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