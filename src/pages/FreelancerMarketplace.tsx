import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Search, Star, MapPin, Clock, DollarSign, Users, Code, Smartphone, Palette, Database, Globe, Shield, TrendingUp, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  { icon: Code, name: "Web Development", count: "150+ freelancers" },
  { icon: Smartphone, name: "App Development", count: "120+ freelancers" },
  { icon: Database, name: "AI & Data Science", count: "80+ freelancers" },
  { icon: Palette, name: "UI/UX Design", count: "200+ freelancers" },
  { icon: Globe, name: "Digital Marketing", count: "90+ freelancers" },
  { icon: Shield, name: "IT Support & Cloud", count: "60+ freelancers" }
];

const featuredFreelancers = [
  {
    id: 1,
    name: "Sarah Chen",
    title: "Full-Stack Developer",
    rating: 4.9,
    reviews: 47,
    location: "San Francisco, CA",
    hourlyRate: 85,
    skills: ["React", "Node.js", "TypeScript", "AWS"],
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    description: "Experienced full-stack developer with 5+ years building scalable web applications."
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    title: "AI/ML Engineer",
    rating: 5.0,
    reviews: 32,
    location: "Austin, TX",
    hourlyRate: 120,
    skills: ["Python", "TensorFlow", "PyTorch", "Data Science"],
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    description: "Machine learning specialist helping businesses implement AI solutions."
  },
  {
    id: 3,
    name: "Emily Watson",
    title: "UI/UX Designer",
    rating: 4.8,
    reviews: 63,
    location: "New York, NY",
    hourlyRate: 75,
    skills: ["Figma", "Adobe XD", "Prototyping", "User Research"],
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    description: "Creative designer focused on user-centered design and digital experiences."
  }
];

export default function FreelancerMarketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative hero-glow section-spacing-lg">
        <div className="absolute inset-0 bg-gradient-hero-subtle"></div>
        <div className="floating-orb floating-orb-1"></div>
        <div className="floating-orb floating-orb-2"></div>
        <div className="floating-orb floating-orb-3"></div>
        
        <div className="relative page-container">
          <div className="content-width text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Find the Tech Talent You Need —
              <span className="block text-accent"> or Showcase Your Skills to the World</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              Talent.PivotHub.io is your trusted marketplace to connect businesses with skilled tech professionals. Whether you're hiring or freelancing, we make the digital pivot simple.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Link to="/freelancer-onboarding" className="flex-1">
                <Button size="lg" variant="heroWhite" className="w-full">
                  🔹 I'm a Tech Freelancer
                </Button>
              </Link>
              <Link to="/client-onboarding" className="flex-1">
                <Button size="lg" variant="heroWhite" className="w-full">
                  🔹 I'm Hiring a Tech Freelancer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="section-spacing-sm bg-gradient-section-1">
        <div className="page-container">
          <div className="content-width-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search for skills, services, or freelancers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-64 h-12">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.name} value={category.name.toLowerCase()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="lg" className="h-12 px-8">
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-spacing bg-gradient-section-2">
        <div className="page-container">
          <div className="content-width text-center">
            <h2 className="section-header">How It Works</h2>
            <p className="section-description content-spacing">
              Get started in three simple steps, whether you're a freelancer or looking to hire.
            </p>
            
            <div className="grid md:grid-cols-2 gap-12 mt-12">
              {/* For Freelancers */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-primary mb-8">For Freelancers</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                    <div>
                      <h4 className="font-semibold mb-2">Create your profile</h4>
                      <p className="text-muted-foreground">Showcase your skills, experience, and portfolio</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                    <div>
                      <h4 className="font-semibold mb-2">List your services</h4>
                      <p className="text-muted-foreground">Set your rates and describe what you offer</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                    <div>
                      <h4 className="font-semibold mb-2">Get hired and grow</h4>
                      <p className="text-muted-foreground">Connect with clients and build your career</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* For Clients */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-secondary mb-8">For Clients</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold">1</div>
                    <div>
                      <h4 className="font-semibold mb-2">Post your project</h4>
                      <p className="text-muted-foreground">Describe your needs, budget, and timeline</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold">2</div>
                    <div>
                      <h4 className="font-semibold mb-2">Browse and hire</h4>
                      <p className="text-muted-foreground">Review proposals and hire the perfect freelancer</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold">3</div>
                    <div>
                      <h4 className="font-semibold mb-2">Get results</h4>
                      <p className="text-muted-foreground">Collaborate and get your project done with confidence</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="section-spacing bg-gradient-section-3">
        <div className="page-container">
          <div className="content-width">
            <div className="text-center content-spacing">
              <h2 className="section-header">Browse by Category</h2>
              <p className="section-description">
                Find the perfect freelancer for your specific needs
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-spacing">
              {categories.map((category) => (
                <Card key={category.name} className="premium-card hover-scale cursor-pointer">
                  <CardContent className="card-padding text-center">
                    <category.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                    <p className="text-muted-foreground">{category.count}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Freelancers */}
      <section className="section-spacing bg-gradient-section-1">
        <div className="page-container">
          <div className="content-width">
            <div className="text-center content-spacing">
              <h2 className="section-header">Featured Freelancers</h2>
              <p className="section-description">
                Meet some of our top-rated tech professionals
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-spacing">
              {featuredFreelancers.map((freelancer) => (
                <Card key={freelancer.id} className="premium-card">
                  <CardContent className="card-padding">
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={freelancer.avatar}
                        alt={freelancer.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-lg">{freelancer.name}</h3>
                        <p className="text-muted-foreground">{freelancer.title}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="font-medium">{freelancer.rating}</span>
                        <span className="text-muted-foreground">({freelancer.reviews})</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{freelancer.location}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">{freelancer.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {freelancer.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="font-semibold">${freelancer.hourlyRate}/hr</span>
                      </div>
                      <Button size="sm">View Profile</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-spacing bg-gradient-section-2">
        <div className="page-container">
          <div className="content-width">
            <div className="text-center content-spacing">
              <h2 className="section-header">Why Use Talent.PivotHub.io?</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 grid-spacing">
              <div className="text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Community-Driven</h3>
                <p className="text-muted-foreground">Not overcrowded - a curated community of quality professionals</p>
              </div>
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Seamless Integration</h3>
                <p className="text-muted-foreground">Works perfectly with PivotHub's learning and business tools</p>
              </div>
              <div className="text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Safe & Professional</h3>
                <p className="text-muted-foreground">Secure payments and a supportive environment</p>
              </div>
              <div className="text-center">
                <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Future-Ready</h3>
                <p className="text-muted-foreground">Built for the future of tech talent</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-spacing bg-gradient-hero">
        <div className="page-container">
          <div className="content-width text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Pivot Forward?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of professionals making their mark in the digital world
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Link to="/freelancer-onboarding" className="flex-1">
                <Button size="lg" variant="heroWhite" className="w-full">
                  Create a Freelancer Profile
                </Button>
              </Link>
              <Link to="/client-onboarding" className="flex-1">
                <Button size="lg" variant="heroWhite" className="w-full">
                  Post a Project Today
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}