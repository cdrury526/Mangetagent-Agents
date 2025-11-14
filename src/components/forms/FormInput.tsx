import { forwardRef } from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  helpText?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, helpText, className = '', ...props }, ref) => {
    const helpMessage = helpText || helperText;
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          ref={ref}
          className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          } ${props.disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''} ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        {helpMessage && !error && <p className="mt-1 text-xs text-gray-500">{helpMessage}</p>}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
