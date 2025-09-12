import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, ThumbsUp } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { toast } from 'sonner';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolName: string;
  resultId: string;
  onFeedbackSubmitted?: () => void;
}

export const FeedbackModal = ({ isOpen, onClose, toolName, resultId, onFeedbackSubmitted }: FeedbackModalProps) => {
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submitFeedback } = useAnalytics();

  const predefinedSuggestions = [
    'More detailed explanations',
    'Better structure and formatting',
    'More specific examples',
    'Clearer action steps',
    'Industry-specific insights',
    'Updated information',
    'More creative suggestions'
  ];

  const handleSuggestionToggle = (suggestion: string) => {
    setSuggestions(prev => 
      prev.includes(suggestion) 
        ? prev.filter(s => s !== suggestion)
        : [...prev, suggestion]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedback(toolName, resultId, rating, feedbackText, suggestions);
      toast.success('Thank you for your feedback!');
      onFeedbackSubmitted?.();
      onClose();
      
      // Reset form
      setRating(0);
      setFeedbackText('');
      setSuggestions([]);
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ThumbsUp className="h-5 w-5 text-primary" />
            Rate This Result
          </DialogTitle>
          <DialogDescription>
            Help us improve our AI tools by sharing your feedback
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>How helpful was this result?</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Text */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Additional Comments (Optional)</Label>
            <Textarea
              id="feedback"
              placeholder="Tell us what worked well or what could be improved..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={3}
            />
          </div>

          {/* Improvement Suggestions */}
          {rating < 4 && (
            <div className="space-y-2">
              <Label>What could we improve? (Select all that apply)</Label>
              <div className="grid grid-cols-1 gap-2">
                {predefinedSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionToggle(suggestion)}
                    className={`p-2 text-sm rounded border text-left transition-colors ${
                      suggestions.includes(suggestion)
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted border-border hover:bg-muted/80'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};