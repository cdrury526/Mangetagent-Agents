import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parse } from 'date-fns';
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-day-picker/dist/style.css';

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  required = false,
  disabled = false,
  error,
  helpText,
  className = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? parseLocalDate(value) : undefined
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setSelectedDate(parseLocalDate(value));
    } else {
      setSelectedDate(undefined);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  function parseLocalDate(dateString: string): Date {
    if (!dateString) return new Date();
    const parsed = parse(dateString, 'yyyy-MM-dd', new Date());
    return parsed;
  }

  function formatLocalDate(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  function handleDateSelect(date: Date | undefined) {
    if (date) {
      setSelectedDate(date);
      onChange(formatLocalDate(date));
      setIsOpen(false);
    }
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedDate(undefined);
    onChange('');
  }

  const displayValue = selectedDate ? format(selectedDate, 'MMM dd, yyyy') : '';

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          } ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'cursor-pointer'} ${
            !displayValue ? 'text-gray-400' : 'text-gray-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{displayValue || placeholder}</span>
            <div className="flex items-center gap-1">
              {displayValue && !disabled && (
                <X
                  className="w-4 h-4 text-gray-400 hover:text-gray-600"
                  onClick={handleClear}
                />
              )}
              <Calendar className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
            <style>{`
              .rdp-custom {
                --rdp-cell-size: 36px;
                --rdp-accent-color: #2563eb;
              }
              .rdp-custom .rdp-months {
                display: flex;
              }
              .rdp-custom .rdp-month {
                margin: 0;
              }
              .rdp-custom .rdp-caption {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 0 12px 0;
              }
              .rdp-custom .rdp-caption_label {
                font-size: 14px;
                font-weight: 500;
                color: #111827;
              }
              .rdp-custom .rdp-nav {
                display: flex;
                gap: 4px;
              }
              .rdp-custom .rdp-nav_button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                padding: 0;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                background: transparent;
                color: #6b7280;
                cursor: pointer;
                transition: all 0.15s;
              }
              .rdp-custom .rdp-nav_button:hover {
                background: #f3f4f6;
                color: #111827;
              }
              .rdp-custom .rdp-nav_button svg {
                width: 16px;
                height: 16px;
              }
              .rdp-custom .rdp-table {
                width: 100%;
                border-collapse: collapse;
              }
              .rdp-custom .rdp-head_cell {
                width: var(--rdp-cell-size);
                height: var(--rdp-cell-size);
                text-align: center;
                font-size: 12px;
                font-weight: 400;
                color: #6b7280;
              }
              .rdp-custom .rdp-cell {
                width: var(--rdp-cell-size);
                height: var(--rdp-cell-size);
                text-align: center;
                padding: 0;
              }
              .rdp-custom .rdp-day {
                width: var(--rdp-cell-size);
                height: var(--rdp-cell-size);
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 400;
                color: #111827;
                cursor: pointer;
                transition: all 0.15s;
                border: none;
                background: transparent;
              }
              .rdp-custom .rdp-day:hover:not(.rdp-day_selected):not(.rdp-day_disabled) {
                background: #f3f4f6;
              }
              .rdp-custom .rdp-day_selected {
                background: var(--rdp-accent-color) !important;
                color: white !important;
                font-weight: 500;
              }
              .rdp-custom .rdp-day_today:not(.rdp-day_selected) {
                background: #f3f4f6;
                font-weight: 500;
              }
              .rdp-custom .rdp-day_outside {
                color: #d1d5db;
              }
              .rdp-custom .rdp-day_disabled {
                color: #d1d5db;
                cursor: not-allowed;
              }
            `}</style>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rdp-custom"
              components={{
                IconLeft: () => <ChevronLeft />,
                IconRight: () => <ChevronRight />,
              }}
            />
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helpText && !error && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
    </div>
  );
}
