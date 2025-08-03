import { Briefcase, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-8 w-8" />
              <h3 className="text-2xl font-bold">CareerLaunch</h3>
            </div>
            <p className="text-primary-foreground/80">
              Empowering individuals to transform their careers through reskilling and entrepreneurship.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-5 w-5 hover:text-accent cursor-pointer transition-colors" />
              <Twitter className="h-5 w-5 hover:text-accent cursor-pointer transition-colors" />
              <Linkedin className="h-5 w-5 hover:text-accent cursor-pointer transition-colors" />
              <Instagram className="h-5 w-5 hover:text-accent cursor-pointer transition-colors" />
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Reskill</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><a href="#" className="hover:text-accent transition-colors">Certifications</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Skills Assessment</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Learning Paths</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Career Guidance</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">HireYourself</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><a href="#" className="hover:text-accent transition-colors">Business Planning</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Market Research</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Grant Writing</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Pitch Decks</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><a href="#" className="hover:text-accent transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Blog</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-primary-foreground/60">
          <p>&copy; 2024 CareerLaunch. All rights reserved. Empowering careers, enabling dreams.</p>
        </div>
      </div>
    </footer>
  );
};