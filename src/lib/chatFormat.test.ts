import { describe, it, expect } from 'vitest';
import { formatChatReply } from './chatFormat';

describe('formatChatReply', () => {
  it('splits inline bullets and adds spacing', () => {
    const raw = 'Changing careers takes effort. Next steps for this week: • List your skills. • Research the role. • Find a person to learn from. What do you do now?';
    expect(formatChatReply(raw)).toBe(
      'Changing careers takes effort.\n\n**Next steps for this week**\n\n- List your skills.\n- Research the role.\n- **Find a person to learn from.** What do you do now?'
    );
  });

  it('turns bullet lines and short label lines into a list and heading', () => {
    const raw = 'Intro paragraph.\nNext steps for this week:\n• One\n• Two\nClosing question?';
    expect(formatChatReply(raw)).toBe('Intro paragraph.\n\n**Next steps for this week**\n\n- One\n- Two\n\nClosing question?');
  });

  it('bolds the short lead sentence of a bullet', () => {
    expect(formatChatReply('- List your skills. Write down what you do well.')).toBe('- **List your skills.** Write down what you do well.');
  });

  it('leaves well-formed markdown alone', () => {
    const md = 'Hello.\n\n- a\n- b\n\nBye.';
    expect(formatChatReply(md)).toBe(md);
  });
});
