import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RefreshCw, Download, ThumbsUp, MoreHorizontal, Copy, Share2 } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface ResultActionsProps {
  toolName: string;
  resultContent: string;
  onRegenerate?: (focus?: string) => void;
  onDownload?: () => void;
  isGenerating?: boolean;
}

export const ResultActions = ({ 
  toolName, 
  resultContent, 
  onRegenerate, 
  onDownload, 
  isGenerating = false 
}: ResultActionsProps) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const resultId = useState(() => uuidv4())[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resultContent);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${toolName} Result`,
          text: resultContent.substring(0, 200) + '...',
          url: window.location.href
        });
      } catch (error) {
        // User cancelled or error occurred
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const regenerationOptions = [
    { label: 'More Detailed', focus: 'detailed' },
    { label: 'More Concise', focus: 'concise' },
    { label: 'More Creative', focus: 'creative' },
    { label: 'More Professional', focus: 'professional' },
    { label: 'Different Approach', focus: 'alternative' }
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2">
        <Button
          onClick={() => onRegenerate?.()}
          disabled={isGenerating}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Regenerating...' : 'Regenerate'}
        </Button>

        {onRegenerate && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isGenerating}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate with...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {regenerationOptions.map((option) => (
                <DropdownMenuItem
                  key={option.focus}
                  onClick={() => onRegenerate(option.focus)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button
          onClick={() => setShowFeedback(true)}
          variant="outline"
          size="sm"
        >
          <ThumbsUp className="h-4 w-4 mr-2" />
          Rate Result
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleCopy} variant="ghost" size="sm">
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </Button>

        <Button onClick={handleShare} variant="ghost" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>

        {onDownload && (
          <Button onClick={onDownload} variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Text
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Result
            </DropdownMenuItem>
            {onDownload && (
              <DropdownMenuItem onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        toolName={toolName}
        resultId={resultId}
      />
    </div>
  );
};