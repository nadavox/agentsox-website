import './TypingDots.css';

/** Animated "assistant is typing" indicator - three bouncing dots. */
export default function TypingDots() {
  return (
    <span className="typing-dots" role="status" aria-label="Assistant is typing">
      <span className="typing-dots__dot" />
      <span className="typing-dots__dot" />
      <span className="typing-dots__dot" />
    </span>
  );
}
