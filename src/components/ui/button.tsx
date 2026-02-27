import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", disabled, children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-medium transition-all duration-150 focus-ring rounded-[var(--radius-button)] disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
      primary: "bg-accent hover:bg-accent-hover text-white shadow-sm",
      secondary: "bg-bg-elevated hover:bg-bg-hover text-text-primary border border-border",
      outline: "bg-transparent hover:bg-accent-muted text-accent border border-accent/30 hover:border-accent/50",
      danger: "bg-danger hover:bg-red-700 text-white shadow-sm",
      ghost: "bg-transparent hover:bg-bg-hover text-text-secondary hover:text-text-primary",
    };
    const sizes = {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-6 py-2.5 text-sm gap-2.5",
    };
    return (
      <button ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled} {...props}>
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
