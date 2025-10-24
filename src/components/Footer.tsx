import { Facebook } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
          <div className="space-y-4">
            <img 
              src="/lovable-uploads/e9310b7d-2004-432c-a5dc-11828a70f8e7.png" 
              alt="PivotHub Logo" 
              className="h-12 w-auto"
            />
            <p className="text-sm text-primary-foreground/80 leading-tight max-w-xs">
              Practical tools and step-by-step guidance to help you assess your skills, learn new ones, and pivot into your next opportunity with confidence.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-5 w-5 hover:text-accent cursor-pointer transition-colors" />
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 md:place-self-center md:w-full md:max-w-2xl">
          
          <div>
            <h4 className="font-semibold mb-4">Discovery & Growth</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link to="/assessit" className="hover:text-accent transition-colors">Assess It</Link></li>
              <li><Link to="/learnit" className="hover:text-accent transition-colors">Learn It</Link></li>
              <li><Link to="/prepit" className="hover:text-accent transition-colors">Prep It</Link></li>
              <li><Link to="/earnit" className="hover:text-accent transition-colors">Earn It</Link></li>
              <li><Link to="/scheduleit" className="hover:text-accent transition-colors">Schedule It</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Build & Launch</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link to="/buildit" className="hover:text-accent transition-colors">Build It</Link></li>
              <li><Link to="/fundit" className="hover:text-accent transition-colors">Fund It</Link></li>
              <li><Link to="/launchit" className="hover:text-accent transition-colors">Launch It</Link></li>
              <li><Link to="/teachit" className="hover:text-accent transition-colors">Teach It</Link></li>
              <li><Link to="/hostit" className="hover:text-accent transition-colors">Host It</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link to="/about" className="hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/faq" className="hover:text-accent transition-colors">FAQs</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">Contact Us</Link></li>
              <li><a href="https://discord.gg/hbT6yvDg" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Community</a></li>
              <li><Link to="/blog" className="hover:text-accent transition-colors">Blog</Link></li>
              <li><Link to="/terms" className="hover:text-accent transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-primary-foreground/60">
          <p>&copy; 2025 PivotHub. All rights reserved. Progress starts here.</p>
        </div>
      </div>
    </footer>
  );
};