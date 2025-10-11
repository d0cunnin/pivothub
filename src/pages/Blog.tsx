import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User } from "lucide-react";

const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      title: "10 Essential Skills for Career Success in 2024",
      excerpt: "Discover the most in-demand skills that will set you apart in today's competitive job market.",
      author: "Sarah Johnson",
      date: "March 15, 2024",
      readTime: "5 min read",
      category: "Career Development",
      image: "/lovable-uploads/collaborative-learning.jpg"
    },
    {
      id: 2,
      title: "From Idea to Launch: A Step-by-Step Business Guide",
      excerpt: "Learn how to transform your business idea into a successful venture with our comprehensive guide.",
      author: "Mike Chen",
      date: "March 12, 2024",
      readTime: "8 min read",
      category: "Entrepreneurship",
      image: "/lovable-uploads/collaborative-learning.jpg"
    },
    {
      id: 3,
      title: "Navigating Career Transitions: A Complete Roadmap",
      excerpt: "Whether you're changing industries or roles, this guide will help you make a smooth transition.",
      author: "Emily Rodriguez",
      date: "March 10, 2024",
      readTime: "6 min read",
      category: "Career Change",
      image: "/lovable-uploads/collaborative-learning.jpg"
    },
    {
      id: 4,
      title: "Funding 101: Securing Grants for Your Startup",
      excerpt: "Master the art of securing funding and unlock grant opportunities for your business venture.",
      author: "David Thompson",
      date: "March 8, 2024",
      readTime: "7 min read",
      category: "Funding",
      image: "/lovable-uploads/collaborative-learning.jpg"
    },
    {
      id: 5,
      title: "Building Your Personal Brand: A Professional's Guide",
      excerpt: "Learn how to create and maintain a strong personal brand that opens doors to new opportunities.",
      author: "Lisa Wang",
      date: "March 5, 2024",
      readTime: "4 min read",
      category: "Personal Development",
      image: "/lovable-uploads/collaborative-learning.jpg"
    },
    {
      id: 6,
      title: "The Future of Work: Remote, Hybrid, and Beyond",
      excerpt: "Explore how the workplace is evolving and what it means for your career strategy.",
      author: "Alex Rivera",
      date: "March 1, 2024",
      readTime: "6 min read",
      category: "Future of Work",
      image: "/lovable-uploads/collaborative-learning.jpg"
    }
  ];

  const categories = ["All", "Career Development", "Entrepreneurship", "Career Change", "Funding", "Personal Development", "Future of Work"];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-primary py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              PivotHub Blog
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Insights, tips, and strategies to help you succeed in your career journey 
              and business ventures.
            </p>
          </div>
        </section>

        {/* Categories */}
        <section className="py-8 border-b bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={category === "All" ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{post.category}</Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        {post.readTime}
                      </div>
                    </div>
                    <CardTitle className="line-clamp-2 hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {post.author}
                      </div>
                      <div className="flex items-center">
                        <CalendarDays className="w-4 h-4 mr-1" />
                        {post.date}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="bg-muted py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Stay Updated
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter and never miss our latest insights on career development and entrepreneurship.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-md border border-input bg-background"
              />
              <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;