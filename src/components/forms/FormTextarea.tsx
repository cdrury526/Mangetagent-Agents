import { forwardRef } from 'react';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
  maxCharCount?: number;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, helperText, showCharCount, maxCharCount, className = '', value, ...props }, ref) => {
    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
          ref={ref}
          value={value}
          className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          } ${className}`}
          {...props}
        />
        <div className="flex justify-between items-center mt-1">
          <div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
          </div>
          {showCharCount && (
            <p className="text-xs text-gray-500">
              {charCount}
              {maxCharCount && `/${maxCharCount}`}
            </p>
          )}
        </div>
      </div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
