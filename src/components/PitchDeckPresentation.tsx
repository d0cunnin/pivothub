import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';

interface Slide {
  title: string;
  content: string;
}

interface PitchDeckPresentationProps {
  slides: Slide[];
  companyName: string;
  onClose: () => void;
}

export const PitchDeckPresentation = ({ slides, companyName, onClose }: PitchDeckPresentationProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const slide = slides[currentSlide];

  // Format slide content with better styling
  const formatContent = (content: string) => {
    return content.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      
      // Handle bullet points
      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        return (
          <li key={idx} className="ml-6 mb-2 text-lg">
            {trimmed.replace(/^[•\-]\s*/, '')}
          </li>
        );
      }
      
      // Handle empty lines
      if (!trimmed) {
        return <div key={idx} className="h-4" />;
      }
      
      // Regular paragraphs
      return (
        <p key={idx} className="mb-4 text-lg leading-relaxed">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-background to-transparent z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">{companyName} Pitch Deck</h2>
          <span className="text-sm text-muted-foreground">
            Slide {currentSlide + 1} of {slides.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Slide Area */}
      <div className="h-full flex items-center justify-center p-20">
        <Card className="w-full max-w-5xl h-full max-h-[700px] p-12 flex flex-col justify-center shadow-2xl">
          {/* Slide Title */}
          <h1 className="text-5xl font-bold mb-8 text-foreground bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {slide.title}
          </h1>
          
          {/* Slide Content */}
          <div className="text-muted-foreground space-y-2 flex-1 overflow-y-auto">
            {formatContent(slide.content)}
          </div>
        </Card>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="rounded-full"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Slide Dots */}
        <div className="flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentSlide 
                  ? 'bg-primary w-8' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="rounded-full"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Keyboard Navigation Hint */}
      <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
        Use arrow keys to navigate
      </div>
    </div>
  );
};