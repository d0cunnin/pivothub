import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ToolGuard } from "@/components/ToolGuard";
import TeachingMaterialsGenerator from "@/components/TeachingMaterialsGenerator";
import heroImage from "@/assets/hero-image.jpg";

const TeachIt = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-primary relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80"></div>
        </div>
        
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-accent"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-accent/15 rounded-full blur-lg"></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center justify-center px-8 py-4 rounded-3xl bg-white/15 mb-8 shadow-glow backdrop-blur-sm animate-fade-in-scale border border-white/20">
              <span className="text-3xl font-bold text-white tracking-wider">TEACH IT</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up">
              Monetize your knowledge
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in max-w-4xl mx-auto" style={{ animationDelay: '0.2s' }}>
              Turn your knowledge into income by teaching others what you know best.
            </p>
            <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Button 
                variant="hero" 
                size="lg" 
                className="shadow-glow transition-elegant hover:scale-105 px-12 py-6 text-lg"
                onClick={() => document.getElementById('getting-started')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Get Started Now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Teach Section */}
      <section className="pt-16 pb-8 bg-white relative overflow-hidden">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-8 items-center mb-8">
            <div>
              <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-4">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Why Teach Online?
                </h2>
              </div>
              <div className="max-w-3xl text-left">
                <ul className="space-y-4 text-lg text-foreground">
                  <li className="flex items-start">
                    <span className="mr-3">•</span>
                    <span>Share your expertise and turn years of experience into valuable lessons that help others succeed</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3">•</span>
                    <span>Build your audience and establish yourself as a thought leader while growing your professional network</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3">•</span>
                    <span>Generate income by creating passive revenue through selling courses and hosting paid webinars</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl shadow-xl">
              <img 
                src="/lovable-uploads/15ff2b92-41d2-4845-9967-ed77d59d05c2.jpg" 
                alt="Team learning together in supportive environment" 
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section id="getting-started" className="pt-8 pb-16 bg-accent relative overflow-hidden">
        <div className="page-container">
          <div className="text-center mb-12">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-4">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                How to Get Started
              </h2>
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Identify Your Topic",
                description: "Choose a subject you're passionate about and have expertise in"
              },
              {
                step: "2",
                title: "Structure Your Content",
                description: "Use our tools to create outlines and organize your knowledge"
              },
              {
                step: "3",
                title: "Create Materials",
                description: "Generate handouts, scripts, and supporting resources"
              },
              {
                step: "4",
                title: "Launch & Teach",
                description: "Host your webinar or publish your course and start teaching"
              }
            ].map((item, index) => (
              <Card key={index} className="bg-white p-6 text-center group cursor-pointer transition-elegant hover:scale-105">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg shadow-glow group-hover:shadow-strong transition-elegant">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Generate Teaching Materials Section */}
      <section id="course-tools" className="section-spacing-sm bg-white relative overflow-hidden">
        <div className="page-container">
          <div className="text-center mb-12">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-4">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Generate Your Teaching Materials
              </h2>
            </div>
            <p className="text-lg text-foreground max-w-3xl mx-auto">
              Provide your skills, experience, and expertise below. We'll generate webinar concepts, course outlines, handouts, and scripts that you can use to teach your subject anywhere.
            </p>
          </div>
          
          <div className="animate-fade-in-scale">
            <ToolGuard toolName="teaching-materials">
              <TeachingMaterialsGenerator />
            </ToolGuard>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TeachIt;
