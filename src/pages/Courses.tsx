import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, BookOpen, TrendingUp, Target, Code } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Courses = () => {
  const miniCourses = [
    {
      title: "AI & Technology Essentials",
      description: "Learn AI basics in simple terms and get comfortable with AI tools that can actually help you in daily life and work.",
      icon: TrendingUp,
      duration: "3-4 hours",
      lessons: "11 lessons",
      thumbnail: heroImage
    },
    {
      title: "Business Building Basics", 
      description: "Start your business with confidence using practical steps without the complexity. Perfect for solopreneurs and beginners.",
      icon: Target,
      duration: "4-5 hours",
      lessons: "8 lessons",
      thumbnail: heroImage
    },
    {
      title: "Web Development Fundamentals",
      description: "Learn the fundamentals of web and software development - perfect for beginners wanting to understand the tech world.",
      icon: Code,
      duration: "5-6 hours",
      lessons: "6 lessons",
      thumbnail: heroImage
    }
  ];

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
              <span className="text-3xl font-bold text-white tracking-wider">COURSES</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up">
              Build new skills
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in max-w-4xl mx-auto" style={{ animationDelay: '0.2s' }}>
              Short focused learning experiences designed to give you relevant information quickly
            </p>
          </div>
        </div>
      </section>

      {/* Mini Courses Section */}
      <section className="py-16 bg-background">
        <div className="page-container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-4">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Micro Courses
              </h2>
            </div>
            <div className="bg-gradient-card/20 border border-accent/30 rounded-lg p-4 mb-6">
              <p className="text-lg font-semibold text-accent mb-2">
                🚧 Coming Soon!
              </p>
              <p className="text-muted-foreground">
                Our micro courses are currently under development and will be available soon. Stay tuned for these exciting learning opportunities!
              </p>
            </div>
            <p className="text-lg text-muted-foreground">
              Short focused learning experiences designed to give you relevant information quickly. Each course delivers practical information in a concise format, so you can learn what you need without a large time commitment. Perfect for busy learners, these courses help you grow, adapt, and learn fast.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 mini-courses-grid gap-8">
            {miniCourses.map((course, index) => {
              const IconComponent = course.icon;
              return (
                <Card key={index} className="overflow-hidden bg-gradient-card/30 backdrop-blur-sm border border-white/10 hover:shadow-lg transition-all duration-300">
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src="/lovable-uploads/8d5741f6-0644-4cca-9d98-60d55c2bf66d.png" 
                      alt={`${course.title} - Professional learning environment`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold">{course.title}</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{course.lessons}</span>
                      </div>
                    </div>

                    <Button className="w-full" size="lg">
                      Start Course
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Courses;