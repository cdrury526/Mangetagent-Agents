import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
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
          <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 calendar-container">
            <style>{`
              .calendar-container .rdp {
                --rdp-cell-size: 40px;
                --rdp-accent-color: #2563eb;
                --rdp-background-color: #2563eb;
                margin: 0;
              }

              .calendar-container .rdp-months {
                display: flex;
                justify-content: center;
              }

              .calendar-container .rdp-month {
                margin: 0;
              }

              .calendar-container .rdp-caption {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
              }

              .calendar-container .rdp-caption_label {
                font-size: 14px;
                font-weight: 600;
                color: #111827;
              }

              .calendar-container .rdp-nav {
                display: flex;
                gap: 4px;
              }

              .calendar-container .rdp-nav_button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                padding: 0;
                border: none;
                border-radius: 6px;
                background: transparent;
                color: #2563eb;
                cursor: pointer;
                transition: background-color 0.15s;
              }

              .calendar-container .rdp-nav_button:hover:not(:disabled) {
                background: #eff6ff;
              }

              .calendar-container .rdp-nav_button:disabled {
                opacity: 0.3;
                cursor: not-allowed;
              }

              .calendar-container .rdp-nav_button svg {
                width: 20px;
                height: 20px;
              }

              .calendar-container .rdp-table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
              }

              .calendar-container .rdp-head {
                margin-bottom: 4px;
              }

              .calendar-container .rdp-head_row {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
              }

              .calendar-container .rdp-head_cell {
                width: var(--rdp-cell-size);
                height: var(--rdp-cell-size);
                font-size: 12px;
                font-weight: 500;
                color: #6b7280;
                text-align: center;
                vertical-align: middle;
                padding: 0;
              }

              .calendar-container .rdp-tbody {
                border: 0;
              }

              .calendar-container .rdp-row {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                margin-top: 2px;
              }

              .calendar-container .rdp-cell {
                width: var(--rdp-cell-size);
                height: var(--rdp-cell-size);
                text-align: center;
                padding: 0;
                position: relative;
              }

              .calendar-container .rdp-day {
                width: var(--rdp-cell-size);
                height: var(--rdp-cell-size);
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 400;
                color: #111827;
                cursor: pointer;
                transition: all 0.15s;
                border: none;
                background: transparent;
                padding: 0;
              }

              .calendar-container .rdp-day:hover:not(.rdp-day_selected):not(.rdp-day_disabled):not(.rdp-day_outside) {
                background: #f3f4f6;
              }

              .calendar-container .rdp-day_selected {
                background: var(--rdp-accent-color) !important;
                color: white !important;
                font-weight: 500;
              }

              .calendar-container .rdp-day_today:not(.rdp-day_selected) {
                background: #f3f4f6;
                font-weight: 600;
              }

              .calendar-container .rdp-day_outside {
                color: #d1d5db;
              }

              .calendar-container .rdp-day_disabled {
                color: #d1d5db;
                cursor: not-allowed;
              }

              .calendar-container .rdp-day_disabled:hover {
                background: transparent;
              }
            `}</style>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              showOutsideDays
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
