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
  
  // Split by double newlines first
  let sections = sanitized.split(/\n\n+/).filter(section => section.trim().length > 10);
  
  // If we don't have enough sections, try splitting by single newlines
  if (sections.length < expectedSections) {
    sections = sanitized.split(/\n/).filter(section => section.trim().length > 10);
  }
  
  // Ensure we have the expected number of sections
  while (sections.length < expectedSections) {
    sections.push(`Section ${sections.length + 1} content will be generated based on your input.`);
  }
  
  return sections.slice(0, expectedSections).map(section => sanitizeAIContent(section));
}
