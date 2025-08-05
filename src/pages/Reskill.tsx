import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, BookOpen, Award, Target, Users, TrendingUp } from "lucide-react";
import { CareerAdvisorChatbot } from "@/components/CareerAdvisorChatbot";

const Reskill = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-accent"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-accent/15 rounded-full blur-lg"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-primary/20 rounded-full blur-md"></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="w-24 h-24 bg-white/15 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow backdrop-blur-sm animate-fade-in-scale">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 text-white leading-tight animate-slide-up">
              Reskill for Success
            </h1>
            <p className="text-2xl md:text-3xl text-white/90 mb-12 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Transform your career with industry-recognized certifications and cutting-edge skills training
            </p>
            <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Button variant="hero" size="lg" className="shadow-glow transition-elegant hover:scale-105 px-12 py-6 text-lg">
                Start Learning Today
              </Button>
            </div>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      {/* Skills Assessment */}
      <section className="section-spacing-sm bg-gradient-section-1 relative overflow-hidden">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-10">
            <div className="animate-fade-in space-y-6">
              <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Find Your Perfect Learning Path
                </h2>
              </div>
              <p className="text-lg text-foreground leading-relaxed">
                Our comprehensive skills assessment analyzes your current expertise, career goals, and industry trends to create a personalized learning roadmap. Get matched with the exact courses, certifications, and training programs that will maximize your career growth potential.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Skill Gap Analysis</h4>
                    <p className="text-muted-foreground text-sm">Identify exactly which skills you need to advance in your field</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Personalized Recommendations</h4>
                    <p className="text-muted-foreground text-sm">Get course suggestions tailored to your learning style and schedule</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Career Impact Forecast</h4>
                    <p className="text-muted-foreground text-sm">See potential salary increases and job opportunities</p>
                  </div>
                </div>
              </div>
              <Button variant="default" size="lg" className="transition-elegant hover:scale-105 px-8 py-3">
                Take Free Assessment
              </Button>
            </div>
            
            <div className="flex justify-center lg:justify-end">
              <img 
                src="/lovable-uploads/a848a1b8-cd18-4243-a70f-0ba5af49802a.png" 
                alt="Professional development and skill building" 
                className="w-full h-auto max-w-lg aspect-video object-cover rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] border border-white/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories & Learning Outcomes */}
      <section className="section-spacing-sm bg-gradient-section-3 relative overflow-hidden">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="animate-fade-in space-y-6">
              <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Real Career Transformations
                </h2>
              </div>
              <p className="text-lg text-foreground leading-relaxed">
                See how our learners have advanced their careers, increased their salaries, and transformed their professional lives through strategic reskilling.
              </p>
              
              <div className="space-y-4">
                {[
                  {
                    name: "Jessica Martinez",
                    role: "Marketing Coordinator → Digital Marketing Manager",
                    result: "45% salary increase in 8 months",
                    skill: "Google Analytics & SEO Certification"
                  },
                  {
                    name: "Ahmed Hassan", 
                    role: "Customer Service → Full Stack Developer",
                    result: "Career pivot with $25K salary boost",
                    skill: "Python & React Development"
                  },
                  {
                    name: "Sarah Kim",
                    role: "Sales Associate → Data Analyst",
                    result: "Landed dream job at tech company",
                    skill: "Data Science & Tableau"
                  }
                ].map((story, index) => (
                  <div key={index} className="bg-gradient-card/30 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center">
                        <div className="w-6 h-6 bg-white rounded-lg"></div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-sm">{story.name}</h4>
                        <p className="text-xs text-muted-foreground mb-1">{story.role}</p>
                        <p className="text-xs text-accent font-semibold">{story.result}</p>
                        <p className="text-xs text-muted-foreground mt-1">Completed: {story.skill}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center lg:justify-end">
              <img 
                src="/lovable-uploads/a0a1a53e-8956-475c-97cd-acc5f732b5bc.png" 
                alt="Career transformation and professional growth" 
                className="w-full h-auto max-w-lg aspect-video object-cover rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] border border-white/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Learning Categories */}
      <section className="section-spacing-sm bg-gradient-section-2 relative overflow-hidden">
        <div className="page-container">
          {/* Header with Learning Image */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="animate-fade-in space-y-6">
              <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm">
                <h2 className="section-header">
                  Master In-Demand Skills
                </h2>
              </div>
              <p className="text-lg text-foreground leading-relaxed">
                Access over 350+ courses across the most sought-after skill categories. Our curriculum is designed by industry experts and updated regularly to reflect the latest market demands and emerging technologies.
              </p>
              
              {/* Learning Features List */}
              <div className="bg-gradient-card/30 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <h4 className="font-semibold text-foreground mb-3 text-sm">Learning Features:</h4>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>• Skills Assessment</span>
                  <span>• Personalized Learning Paths</span>
                  <span>• Industry Certifications</span>
                  <span>• Hands-on Projects</span>
                  <span>• Expert Mentorship</span>
                  <span>• Career Guidance</span>
                  <span>• Flexible Scheduling</span>
                  <span>• Progress Tracking</span>
                  <span>• Job Market Insights</span>
                  <span>• Salary Forecasting</span>
                  <span>• Portfolio Building</span>
                  <span>• Lifetime Access</span>
                </div>
              </div>
              
              <div className="bg-gradient-card/50 p-6 rounded-xl backdrop-blur-sm border border-white/10">
                <h4 className="font-semibold text-foreground mb-3">Why Our Courses Stand Out:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Hands-on projects with real-world applications</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Industry-recognized certifications upon completion</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Flexible learning with lifetime access</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Expert mentorship and career guidance</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-center lg:justify-end">
              <img 
                src="/lovable-uploads/55e6a726-43cb-426b-924c-84bf4a8ebab7.png" 
                alt="Popular learning categories and skill development" 
                className="w-full h-auto max-w-lg aspect-video object-cover rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] border border-white/10"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <BookOpen className="h-8 w-8" />,
                title: "Technology & Programming",
                description: "Master coding, web development, AI/ML, cloud computing, and cybersecurity. Build applications, automate processes, and become proficient in the most valuable technical skills of the digital age.",
                courses: "150+ courses",
                highlights: ["Python, JavaScript, React", "AWS, Azure, Google Cloud", "Data Science & AI", "Cybersecurity Fundamentals"]
              },
              {
                icon: <TrendingUp className="h-8 w-8" />,
                title: "Digital Marketing",
                description: "Learn to drive growth through SEO, social media marketing, content creation, email campaigns, and data analytics. Master the art of reaching and converting customers in the digital landscape.",
                courses: "80+ courses",
                highlights: ["Google Ads & Analytics", "Social Media Strategy", "Content Marketing", "Email Automation"]
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: "Business & Management",
                description: "Develop leadership, project management, communication, and strategic thinking skills. Learn to manage teams, drive organizational change, and excel in business operations.",
                courses: "120+ courses",
                highlights: ["Leadership & Management", "Project Management (PMP)", "Business Strategy", "Communication Skills"]
              }
            ].map((category, index) => (
              <Card key={index} className="premium-card p-6 group cursor-pointer transition-elegant hover:scale-105 h-full">
                <div className="w-12 h-12 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center mb-4 text-primary group-hover:shadow-glow transition-elegant">
                  {category.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">{category.title}</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">{category.description}</p>
                <div className="space-y-3 mb-6">
                  <h5 className="font-semibold text-foreground text-sm">Key Skills Include:</h5>
                  <div className="flex flex-wrap gap-2">
                    {category.highlights.map((skill, skillIndex) => (
                      <span key={skillIndex} className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-sm text-accent font-semibold bg-accent/10 px-3 py-1 rounded-full">{category.courses}</span>
                  <Button className="transition-elegant hover:scale-105">
                    Start Learning
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Certification Preview */}
      <section className="section-spacing-sm bg-gradient-section-3 relative overflow-hidden">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-scale space-y-6">
              <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Earn Credentials That Matter
                </h2>
              </div>
              <p className="text-lg text-foreground leading-relaxed">
                Our industry-recognized certifications are developed in partnership with leading technology companies and validated by hiring managers. Each certificate represents verified skills that employers actively seek when making hiring and promotion decisions.
              </p>
              <div className="bg-gradient-card/50 p-6 rounded-xl backdrop-blur-sm border border-white/10">
                <h4 className="font-semibold text-foreground mb-4">Certification Benefits:</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center shadow-glow">
                        <Award className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-foreground font-medium">Industry Recognition</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center shadow-glow">
                        <Award className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-foreground font-medium">Higher Salary Potential</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center shadow-glow">
                        <Award className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-foreground font-medium">Career Advancement</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center shadow-glow">
                        <Award className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-foreground font-medium">Professional Credibility</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Popular Certifications:</h4>
                {[
                  "Google Career Certificates - Digital Marketing & Data Analytics",
                  "Microsoft Azure Fundamentals & Associate Certifications",
                  "Amazon AWS Cloud Practitioner & Solutions Architect",
                  "HubSpot Marketing & Sales Certification Programs"
                ].map((cert, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center shadow-glow">
                      <Award className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-foreground font-medium">{cert}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card className="premium-card p-8 group cursor-pointer transition-elegant hover:scale-105">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-glow transition-elegant">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">Professional Certificate</h3>
                <div className="bg-gradient-card/30 p-4 rounded-lg mb-6 border border-white/10">
                  <div className="text-sm text-muted-foreground mb-2">Certificate of Completion</div>
                  <div className="font-bold text-lg text-foreground">Advanced Web Development</div>
                  <div className="text-sm text-muted-foreground mt-1">Issued by TechSkills Academy</div>
                  <div className="text-xs text-accent mt-2">Verification ID: #WD2024-001</div>
                </div>
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                  Preview what your completed certification will look like. Each certificate includes verification codes and LinkedIn integration.
                </p>
                <Button variant="default" className="transition-elegant hover:scale-105 px-8 py-3">
                  View Sample Certificate
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Career Advisor AI Section */}
      <section className="section-transition py-32 bg-gradient-section-1 relative overflow-hidden">
        {/* Elegant ambient elements */}
        <div className="floating-orb top-20 right-20 w-56 h-56 bg-accent/4 animate-float"></div>
        <div className="floating-orb bottom-20 left-20 w-64 h-64 bg-secondary/3 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="floating-orb top-1/3 left-1/3 w-40 h-40 bg-primary/5 animate-float" style={{ animationDelay: '4s' }}></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-block p-8 bg-gradient-card rounded-3xl mb-6 shadow-elegant backdrop-blur-sm animate-fade-in-scale">
              <h2 className="text-5xl md:text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent leading-tight">
                Get Personalized Career Guidance
              </h2>
            </div>
            <p className="text-xl md:text-2xl text-foreground/80 max-w-4xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Chat with our AI Career Advisor for expert guidance on your career transition and reskilling journey
            </p>
          </div>
          
          <div className="animate-fade-in-scale">
            <CareerAdvisorChatbot />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Reskill;