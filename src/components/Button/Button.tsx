import './Button.css';

export interface ButtonProps {
  /** Visual style of the button */
  variant?: 'primary' | 'secondary';
  /** Size of the button */
  size?: 'small' | 'medium' | 'large';
  /** Button label */
  label: string;
  /** Disable user interaction */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
}

/** Primary UI component for user interaction */
export function Button({
  variant = 'primary',
  size = 'medium',
  label,
  disabled = false,
  onClick,
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`ui-button ui-button--${variant} ui-button--${size}`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
