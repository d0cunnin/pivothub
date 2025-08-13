import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <img 
              src="/lovable-uploads/cc448247-be83-4a4b-9120-baa60c7d1c18.png" 
              alt="PivotHub Logo" 
              className="h-12 w-auto"
            />
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
              <li><Link to="/reskill" className="hover:text-accent transition-colors">Skills Assessment</Link></li>
              <li><Link to="/reskill" className="hover:text-accent transition-colors">Career Assessment</Link></li>
              <li><Link to="/reskill" className="hover:text-accent transition-colors">Personality Test</Link></li>
              <li><Link to="/reskill" className="hover:text-accent transition-colors">Career Guidance</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">HireYourself</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><Link to="/hireyourself" className="hover:text-accent transition-colors">Business Planning</Link></li>
              <li><Link to="/hireyourself" className="hover:text-accent transition-colors">Business Ideas</Link></li>
              <li><Link to="/grantwriting" className="hover:text-accent transition-colors">Grant Writing</Link></li>
              <li><Link to="/hireyourself" className="hover:text-accent transition-colors">Pitch Decks</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><Link to="/about" className="hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">Contact Us</Link></li>
              <li><a href="https://discord.gg/hbT6yvDg" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Community</a></li>
              <li><Link to="/blog" className="hover:text-accent transition-colors">Blog</Link></li>
              <li><Link to="/terms" className="hover:text-accent transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-primary-foreground/60">
          <p>&copy; 2024 PivotHub. All rights reserved. Empowering careers, enabling dreams.</p>
        </div>
      </div>
    </footer>
  );
};