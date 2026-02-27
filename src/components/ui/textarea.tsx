import { type TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, hint, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-text-secondary">
            {label}
            {props.required && <span className="ml-1 text-accent">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          rows={4}
          className={`block w-full rounded-[var(--radius-input)] border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 resize-y ${error ? "border-danger" : "border-border"} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
