import ReactMarkdown from "react-markdown";
import { formatChatReply } from "@/lib/chatFormat";

/**
 * Chat message body. Assistant replies are lightly formatted markdown
 * (paragraphs, bullet lists, bold); user messages are shown as typed.
 */
export function ChatMessageText({ text, isBot }: { text: string; isBot: boolean }) {
  if (!isBot) {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{text}</p>;
  }
  return (
    <div className="prose prose-sm max-w-none min-w-0 break-words text-foreground dark:prose-invert prose-p:my-3 prose-p:leading-relaxed prose-ul:my-3 prose-ul:pl-5 prose-ol:my-3 prose-li:my-1.5 prose-headings:my-3 prose-headings:text-base prose-strong:text-foreground prose-headings:text-foreground">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
              {children}
            </a>
          ),
        }}
      >
        {formatChatReply(text)}
      </ReactMarkdown>
    </div>
  );
}
