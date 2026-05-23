import './Button.css';

export default function Button({ variant = 'primary', children, href, onClick, type, disabled, className, ...props }) {
  const classes = `btn btn--${variant} ${disabled ? 'btn--disabled' : ''} ${className || ''}`.trim();

  if (href) {
    return (
      <a
        href={disabled ? undefined : href}
        className={classes}
        aria-disabled={disabled || undefined}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes} {...props}>
      {children}
    </button>
  );
}
