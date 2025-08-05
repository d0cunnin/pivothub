import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="section-spacing bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="page-container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="section-header mb-6">Our Story</h1>
            <p className="section-description">
              Empowering individuals to relaunch their careers and build sustainable futures in a rapidly changing world.
            </p>
          </div>
          <div className="floating-orb top-20 left-10"></div>
          <div className="floating-orb bottom-20 right-10 animation-delay-2s"></div>
        </div>
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
              <h3 className="section-header">Happy at Work</h3>
              <p className="section-body-text">
                Creating environments where professionals find fulfillment, purpose, and growth opportunities in their daily work experience. We believe that when people are engaged and satisfied in their roles, both individuals and organizations thrive.
              </p>
            </div>
            <div className="lg:ml-4">
              <img 
                src="/lovable-uploads/8d6ceafa-b82d-4c50-a345-214b613d62c1.png"
                alt="Professional leadership fostering workplace happiness" 
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