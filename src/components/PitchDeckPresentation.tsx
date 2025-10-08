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
  primaryColor: string;
  accentColor: string;
  logo?: string;
  onClose: () => void;
}

export const PitchDeckPresentation = ({ 
  slides, 
  companyName, 
  primaryColor, 
  accentColor, 
  logo, 
  onClose 
}: PitchDeckPresentationProps) => {
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
  const formatContent = (content: string, isFirstSlide: boolean = false) => {
    const lines = content.split('\n').filter(line => line.trim());
    
    // For first slide (cover), use special formatting
    if (isFirstSlide) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-6">
          {logo && (
            <img 
              src={logo} 
              alt="Company Logo" 
              className="max-w-[200px] max-h-[200px] object-contain mb-4"
            />
          )}
          {lines.map((line, index) => {
            const trimmedLine = line.trim().replace(/^•\s*/, '');
            return (
              <div 
                key={index} 
                className="text-center"
                style={{ 
                  fontSize: index === 0 ? '3rem' : index === 1 ? '1.5rem' : '1.25rem',
                  fontWeight: index === 0 ? 'bold' : 'normal',
                  color: index === 0 ? primaryColor : 'inherit'
                }}
              >
                {trimmedLine}
              </div>
            );
          })}
        </div>
      );
    }
    
    // For other slides, format as bullet points
    return (
      <ul className="space-y-4 text-left">
        {lines.map((line, index) => {
          const trimmedLine = line.trim().replace(/^[•\-*]\s*/, '');
          return (
            <li key={index} className="flex items-start">
              <span className="mr-3 text-2xl" style={{ color: accentColor }}>•</span>
              <span className="text-xl leading-relaxed">{trimmedLine}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-background"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}08 0%, ${accentColor}08 100%)`
      }}
    >
      {/* Header */}
      <div 
        className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10"
        style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)`
        }}
      >
        <div className="flex items-center gap-4">
          {logo && (
            <img src={logo} alt={companyName} className="h-10 w-auto object-contain" />
          )}
          <div>
            <h2 className="text-xl font-bold text-white drop-shadow-lg">{companyName}</h2>
            <span className="text-sm text-white/80">
              Slide {currentSlide + 1} of {slides.length}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleFullscreen} className="bg-white/90">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onClose} className="bg-white/90">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Slide Area */}
      <div className="h-full flex items-center justify-center p-20">
        <Card 
          className="w-full max-w-5xl h-full max-h-[700px] p-12 flex flex-col justify-center shadow-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {/* Decorative gradient overlay */}
          <div 
            className="absolute top-0 right-0 w-64 h-64 opacity-10 blur-3xl"
            style={{
              background: `radial-gradient(circle, ${primaryColor} 0%, ${accentColor} 100%)`
            }}
          />
          
          {/* Slide Title - Hidden for cover slide */}
          {currentSlide !== 0 && (
            <h1 
              className="text-5xl font-bold mb-8 relative z-10"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {slide.title}
            </h1>
          )}
          
          {/* Slide Content */}
          <div className={`text-muted-foreground space-y-2 flex-1 overflow-y-auto relative z-10 ${currentSlide === 0 ? 'h-full' : ''}`}>
            {formatContent(slide.content, currentSlide === 0)}
          </div>

          {/* Logo watermark on slide */}
          {logo && currentSlide > 0 && (
            <div className="absolute bottom-6 right-6 opacity-30">
              <img src={logo} alt={companyName} className="h-8 w-auto object-contain" />
            </div>
          )}
        </Card>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="rounded-full hover:bg-black/5"
          style={{ 
            color: primaryColor,
            opacity: currentSlide === 0 ? 0.3 : 1 
          }}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Slide Dots */}
        <div className="flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`rounded-full transition-all ${
                idx === currentSlide 
                  ? 'w-8 h-2' 
                  : 'w-2 h-2 hover:opacity-70'
              }`}
              style={{
                backgroundColor: idx === currentSlide ? primaryColor : `${primaryColor}40`
              }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="rounded-full hover:bg-black/5"
          style={{ 
            color: primaryColor,
            opacity: currentSlide === slides.length - 1 ? 0.3 : 1 
          }}
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