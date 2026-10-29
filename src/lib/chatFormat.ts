/**
 * Turns an assistant reply into clean markdown with clear spacing, whatever
 * bullet style the AI used: "•"-style bullets (even run together on one
 * line) become list items, short "Heading:" lines become bold headings, and
 * paragraphs and lists are separated by blank lines.
 */
export function formatChatReply(raw: string): string {
  let text = raw.replace(/\r/g, '').trim();

  // Bullets written inline ("this week: • One. • Two.") go on their own lines.
  text = text.replace(/[ \t]+[•●▪◦‣]\s+/g, '\n- ');
  // Bullet characters at the start of a line become markdown list items.
  text = text.replace(/^[ \t]*[•●▪◦‣][ \t]*/gm, '- ');

  // "Sentence. Next steps for this week:" -> paragraph, then its own heading line.
  text = text.replace(/^(.*[.!?])[ \t]+([^.!?\n]{3,60}:)[ \t]*$/gm, '$1\n$2');

  const out: string[] = [];
  let prevKind: 'blank' | 'list' | 'text' = 'blank';
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (prevKind !== 'blank') out.push('');
      prevKind = 'blank';
      continue;
    }
    const isList = /^([-*+]|\d+[.)])\s+/.test(trimmed);
    // A short line ending in ":" is a mini heading, e.g. "Next steps for this week:".
    const isHeading = !isList && trimmed.length <= 60 && /:$/.test(trimmed) && !/^\*\*/.test(trimmed);
    const kind = isList ? 'list' : 'text';
    // Blank line between paragraphs, and between a paragraph and a list.
    if (prevKind !== 'blank' && (kind !== prevKind || kind === 'text')) out.push('');
    out.push(isHeading ? `**${trimmed.replace(/:$/, '')}**` : isList ? boldLead(trimmed) : line);
    prevKind = kind;
  }
  return out.join('\n').trim();
}

/** "- List your skills. Write down..." -> "- **List your skills.** Write down..." (short lead sentence only). */
function boldLead(item: string): string {
  const m = item.match(/^([-*+]|\d+[.)])\s+(?!\*\*)([^.!?]{3,60}[.!?])\s+(\S.*)$/);
  return m ? `${m[1]} **${m[2]}** ${m[3]}` : item;
}
