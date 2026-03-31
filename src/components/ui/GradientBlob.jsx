import './GradientBlob.css';

export default function GradientBlob({ color = 'var(--color-accent)', size = 400, top, left, right, bottom, delay = 0 }) {
  return (
    <div
      className="gradient-blob"
      style={{
        width: size,
        height: size,
        top,
        left,
        right,
        bottom,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}
