interface CurrencyInputProps {
  label: string;
  value: number | null | undefined | string;
  onChange: (value: number | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function CurrencyInput({
  label,
  value,
  onChange,
  placeholder = '0',
  required = false,
  disabled = false,
}: CurrencyInputProps) {
  const formatCurrency = (val: string): string => {
    const num = val.replace(/\D/g, '');

    if (!num) return '';

    return new Intl.NumberFormat('en-US').format(parseInt(num));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/\D/g, '');

    if (!numericValue) {
      onChange(null);
      return;
    }

    onChange(parseInt(numericValue));
  };

  const displayValue = (() => {
    if (value === null || value === undefined || value === '') return '';

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) return '';

    return formatCurrency(numValue.toString());
  })();

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
          $
        </span>
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
        />
      </div>
    </div>
  );
}
