import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Content sanitization utility for AI responses
export function sanitizeAIContent(content: string): string {
  if (!content) return "";
  
  return content
    // Remove markdown headers (###, ##, #)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove excessive markdown formatting
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    // Remove markdown links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Remove leading/trailing whitespace
    .trim()
    // Remove any remaining markdown artifacts
    .replace(/^\s*[-*+]\s+/gm, '• ')
    // Clean up bullet points
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove any "####" or similar patterns
    .replace(/#{2,}/g, '')
    // Clean up extra spaces
    .replace(/\s{2,}/g, ' ');
}

// Parse AI content into structured sections
export function parseAISections(content: string, expectedSections: number = 3): string[] {
  const sanitized = sanitizeAIContent(content);
  
  // Try to split by [SECTION] markers first (for biography content)
  if (content.includes('[BIOGRAPHY]') || content.includes('[VISION]') || content.includes('[MISSION]')) {
    const bioMatch = content.match(/\[BIOGRAPHY\]\s*([\s\S]*?)(?=\[VISION\]|$)/i);
    const visionMatch = content.match(/\[VISION\]\s*([\s\S]*?)(?=\[MISSION\]|$)/i);
    const missionMatch = content.match(/\[MISSION\]\s*([\s\S]*?)$/i);
    
    const sections = [
      bioMatch?.[1]?.trim() || '',
      visionMatch?.[1]?.trim() || '',
      missionMatch?.[1]?.trim() || ''
    ].filter(s => s.length > 0);
    
    if (sections.length === expectedSections) {
      return sections.map(section => sanitizeAIContent(section));
    }
  }
  
  // Try numbered sections (1., 2., 3.)
  if (content.match(/^\s*\d+\./m)) {
    const numberedSections = content.split(/^\s*\d+\.\s*/m).filter(s => s.trim().length > 10);
    if (numberedSections.length >= expectedSections) {
      return numberedSections.slice(0, expectedSections).map(section => sanitizeAIContent(section));
    }
  }
  
  // Split by double newlines
  let sections = sanitized.split(/\n\n+/).filter(section => section.trim().length > 20);
  
  // If we don't have enough sections, try splitting by single newlines with longer content
  if (sections.length < expectedSections) {
    sections = sanitized.split(/\n/).filter(section => section.trim().length > 50);
  }
  
  // Take the longest sections if we have too many
  if (sections.length > expectedSections) {
    sections = sections
      .sort((a, b) => b.length - a.length)
      .slice(0, expectedSections);
  }
  
  // If still not enough sections, return what we have
  return sections.slice(0, expectedSections).map(section => sanitizeAIContent(section));
}
