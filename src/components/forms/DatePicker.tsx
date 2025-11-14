import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/src/style.css';
import { format, parse } from 'date-fns';
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
              .date-picker-calendar.rdp-root {
                --rdp-accent-color: #2563eb;
                --rdp-accent-background-color: #eff6ff;
                --rdp-day-height: 40px;
                --rdp-day-width: 40px;
                --rdp-day_button-height: 40px;
                --rdp-day_button-width: 40px;
                --rdp-day_button-border-radius: 8px;
                --rdp-day_button-border: 2px solid transparent;
                --rdp-today-color: #2563eb;
                font-family: inherit;
              }

              .date-picker-calendar .rdp-month_caption {
                display: flex;
                justify-content: space-between;
                align-items: center;
                height: 40px;
                margin-bottom: 0.5rem;
              }

              .date-picker-calendar .rdp-caption_label {
                font-size: 0.875rem;
                font-weight: 600;
                color: #111827;
              }

              .date-picker-calendar .rdp-nav {
                display: flex;
                gap: 0.25rem;
              }

              .date-picker-calendar .rdp-button_previous,
              .date-picker-calendar .rdp-button_next {
                width: 2rem;
                height: 2rem;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border: none;
                border-radius: 0.375rem;
                background: transparent;
                color: #2563eb;
                cursor: pointer;
                transition: background-color 0.15s;
              }

              .date-picker-calendar .rdp-button_previous:hover:not(:disabled),
              .date-picker-calendar .rdp-button_next:hover:not(:disabled) {
                background: #eff6ff;
              }

              .date-picker-calendar .rdp-chevron {
                width: 1.25rem;
                height: 1.25rem;
              }

              .date-picker-calendar .rdp-weekday {
                font-size: 0.75rem;
                font-weight: 500;
                color: #6b7280;
                text-transform: uppercase;
              }

              .date-picker-calendar .rdp-day_button {
                font-size: 0.875rem;
                color: #111827;
                font-weight: 400;
              }

              .date-picker-calendar .rdp-day_button:hover:not([disabled]):not(.rdp-day_selected .rdp-day_button) {
                background: #f3f4f6;
              }

              .date-picker-calendar .rdp-day_selected .rdp-day_button {
                background: var(--rdp-accent-color);
                color: white;
                font-weight: 600;
              }

              .date-picker-calendar .rdp-day_selected .rdp-day_button:hover {
                background: #1d4ed8;
              }

              .date-picker-calendar .rdp-day_today:not(.rdp-day_selected) .rdp-day_button {
                border: 2px solid #2563eb !important;
                font-weight: 600;
                color: #2563eb !important;
              }

              .date-picker-calendar .rdp-day_outside .rdp-day_button {
                color: #d1d5db;
              }

              .date-picker-calendar .rdp-day_button:disabled {
                color: #d1d5db;
                cursor: not-allowed;
              }

              .date-picker-calendar .rdp-day_button:disabled:hover {
                background: transparent;
              }
            `}</style>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              showOutsideDays
              className="date-picker-calendar"
              components={{
                Chevron: (props) => {
                  if (props.orientation === 'left') {
                    return <ChevronLeft className="rdp-chevron" />;
                  }
                  return <ChevronRight className="rdp-chevron" />;
                },
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
