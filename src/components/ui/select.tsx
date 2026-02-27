import { type SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, options, placeholder, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-text-secondary">
            {label}
            {props.required && <span className="ml-1 text-accent">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={`block w-full rounded-[var(--radius-input)] border bg-bg-input px-3 py-2 text-sm text-text-primary transition-colors duration-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 ${error ? "border-danger" : "border-border"} ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";
