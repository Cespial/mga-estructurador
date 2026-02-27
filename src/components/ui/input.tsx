import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, hint, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-[13px] font-medium text-text-primary">
            {label}
            {props.required && <span className="ml-1 text-danger">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`block w-full rounded-[var(--radius-input)] border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted transition-all duration-150 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/8 ${error ? "border-danger" : "border-border"} ${className}`}
          {...props}
        />
        {error && <p className="text-[12px] text-danger">{error}</p>}
        {hint && !error && <p className="text-[12px] text-text-muted">{hint}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";
