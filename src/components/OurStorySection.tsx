export const OurStorySection = () => {

  return (
    <section id="about" className="py-24 px-4 bg-gradient-to-br from-background to-muted/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-accent"></div>
      <div className="container mx-auto animate-fade-in">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block p-6 bg-gradient-to-r from-secondary/10 to-accent/10 rounded-2xl mb-8 shadow-soft">
              <h2 className="text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent">Our Story</h2>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Story Content */}
            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="text-lg text-foreground space-y-6 leading-relaxed text-left">
                <p>
                  PivotHub was born out of necessity during a critical period in our economy. Between January and July 2025, 
                  hundreds of thousands of people found themselves unemployed or underemployed, facing an unprecedented challenge 
                  in securing meaningful work.
                </p>
                <p>
                  As we witnessed this crisis unfold, it became clear that traditional approaches to career development were 
                  no longer sufficient. The accelerated pace of technological advancement was reshaping entire industries, 
                  creating both challenges and opportunities for the workforce.
                </p>
                <p>
                  We realized that people needed more than just job search assistance. They needed comprehensive tools to either 
                  upskill for the evolving job market or forge their own path through entrepreneurship. PivotHub was created 
                  to provide exactly that: a platform where individuals can either reskill to become more marketable for employment 
                  or launch their own businesses with the tools and guidance they need to succeed.
                </p>
                <p>
                  Today, we're proud to be part of the solution, helping thousands of people pivot their vocations and 
                  build sustainable futures that create positive economic impact in our rapidly changing world.
                </p>
              </div>
            </div>

            {/* Image Section */}
            <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-soft">
                <img 
                  src="/lovable-uploads/55e6a726-43cb-426b-924c-84bf4a8ebab7.png" 
                  alt="Happy successful professionals celebrating together" 
                  className="w-full h-auto rounded-lg shadow-soft"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};