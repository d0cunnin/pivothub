/**
 * Reads the text out of a resume file in the browser (the file never leaves
 * the user's device). Supports PDF, Word (.docx) and plain text. The PDF and
 * Word readers are loaded only when needed.
 */
export const RESUME_FILE_ACCEPT = '.pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';
const MAX_BYTES = 10 * 1024 * 1024;

export async function readResumeFile(file: File): Promise<string> {
  if (file.size > MAX_BYTES) throw new Error('That file is larger than 10 MB. Please upload a smaller file.');
  const name = file.name.toLowerCase();

  if (name.endsWith('.txt') || file.type === 'text/plain') {
    return clean(await file.text());
  }

  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    const pdfjs = await import('pdfjs-dist');
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const content = await (await pdf.getPage(i)).getTextContent();
      // Rebuild lines: items on a new line carry hasEOL.
      let line = '';
      const lines: string[] = [];
      for (const item of content.items as Array<{ str?: string; hasEOL?: boolean }>) {
        line += item.str ?? '';
        if (item.hasEOL) { lines.push(line); line = ''; }
      }
      if (line) lines.push(line);
      pages.push(lines.join('\n'));
    }
    const text = clean(pages.join('\n\n'));
    if (text.replace(/\s/g, '').length < 30) {
      throw new Error('We could not read text from this PDF. It may be a scanned image. Please paste your resume text instead.');
    }
    return text;
  }

  if (name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = await import('mammoth/mammoth.browser.min.js');
    const lib = (mammoth as unknown as { default?: typeof mammoth }).default ?? mammoth;
    const result = await (lib as unknown as { extractRawText: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> })
      .extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return clean(result.value);
  }

  if (name.endsWith('.doc')) {
    throw new Error('Older Word files (.doc) are not supported. Please save it as .docx or PDF, or paste the text.');
  }
  throw new Error('Please upload a PDF, Word (.docx) or .txt file, or paste your resume text.');
}

function clean(text: string): string {
  return text.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
