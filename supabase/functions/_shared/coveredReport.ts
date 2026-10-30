import { generateText, type ChatMessage, type GenerateOptions } from './aiGenerate.ts';
import { missingItems } from './reportCoverage.ts';

/**
 * Generates a text report, checks that it addresses every item the user
 * selected, and rewrites it once (when time allows) if any were skipped.
 * Anything still missing is listed in a short "Please Review" note so it is
 * never silently dropped.
 */
export async function generateCoveredReport(
  apiKey: string,
  messages: ChatMessage[],
  opts: GenerateOptions,
  required: Record<string, Array<string | null | undefined>>,
): Promise<string> {
  const started = Date.now();
  const check = (text: string) =>
    Object.entries(required).flatMap(([label, items]) => missingItems(text, items).map((i) => `${label}: "${i}"`));

  let text = await generateText(apiKey, messages, opts);
  let missing = check(text);
  if (missing.length && Date.now() - started < 60_000) {
    console.log('[coverage] rewriting, missing:', JSON.stringify(missing));
    try {
      const retry = await generateText(apiKey, [
        ...messages,
        { role: 'assistant', content: text },
        { role: 'user', content: `Your report did not address these selections from the user:\n${missing.map((m) => `- ${m}`).join('\n')}\nWrite the complete report again, keeping everything that was good, and address each of these specifically.` },
      ], opts);
      const after = check(retry);
      if (after.length < missing.length) { text = retry; missing = after; }
    } catch (e) {
      console.error('[coverage] rewrite failed:', e instanceof Error ? e.message : e);
    }
  }
  if (missing.length) {
    text += `\n\n## Please Review\n\nOur automatic check could not find these selections from your form in this report:\n\n${missing.map((m) => `- ${m}`).join('\n')}\n\nYou can generate the report again, or ask the related chat assistant about them.`;
  }
  return text;
}
