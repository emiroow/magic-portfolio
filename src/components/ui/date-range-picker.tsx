'use client';

import { useValidationMessage } from '@/hooks/useValidationMessage';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import gregorian from 'react-date-object/calendars/gregorian';
import persian from 'react-date-object/calendars/persian';
import gregorian_en from 'react-date-object/locales/gregorian_en';
import persian_fa from 'react-date-object/locales/persian_fa';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import 'react-multi-date-picker/styles/backgrounds/bg-dark.css';

interface DateRangePickerProps {
  startValue?: string;
  endValue?: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  locale?: 'fa' | 'en';
  startLabel: string;
  endLabel: string;
  startId?: string;
  endId?: string;
  startPlaceholder?: string;
  endPlaceholder?: string;
  disabled?: boolean;
  /** Drop the end column entirely, for a period that simply has no end. */
  hideEnd?: boolean;
  error?: {
    start?: string;
    end?: string;
  };
}

/** One `MMMM YYYY` month cell of the range. */
function MonthField({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  error,
  calendar,
  calendarLocale,
  panelClass,
}: {
  id?: string;
  label: string;
  value: DateObject | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  calendar: typeof gregorian;
  calendarLocale: typeof gregorian_en;
  panelClass?: string;
}) {
  const tv = useValidationMessage();

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <DatePicker
        id={id}
        value={value}
        onChange={dateObj => {
          if (dateObj) {
            onChange(`${dateObj.year}/${String(dateObj.month.number).padStart(2, '0')}`);
          } else {
            onChange('');
          }
        }}
        onlyMonthPicker
        format="MMMM YYYY"
        calendar={calendar}
        locale={calendarLocale}
        disabled={disabled}
        className={panelClass}
        render={(formatted, openCalendar) => (
          <button
            type="button"
            id={id}
            onClick={openCalendar}
            disabled={disabled}
            aria-label={label}
            className={cn('control cursor-pointer text-start', !formatted && 'text-muted-foreground', error && 'border-destructive')}
          >
            {/* The picker renders its own label; the trigger only shows the value. */}
            <span className="truncate">{formatted || placeholder || label}</span>
            <span aria-hidden className="ms-auto text-muted-foreground">
              ▾
            </span>
          </button>
        )}
      />
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {tv(error)}
        </p>
      )}
    </div>
  );
}

/**
 * Start / end month pickers sharing one grid. Jalali in Persian, Gregorian in
 * English; values are stored as `YYYY/MM`.
 */
export const DateRangePicker = ({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  locale = 'en',
  startLabel,
  endLabel,
  startId,
  endId,
  startPlaceholder,
  endPlaceholder,
  disabled = false,
  hideEnd = false,
  error,
}: DateRangePickerProps) => {
  const { resolvedTheme } = useTheme();
  const calendar = locale === 'fa' ? persian : gregorian;
  const calendarLocale = locale === 'fa' ? persian_fa : gregorian_en;
  const panelClass = resolvedTheme === 'dark' ? 'bg-dark text-white' : undefined;

  // Stored as "YYYY/MM"; the day is irrelevant for a month range.
  const parse = (value?: string) =>
    value?.split('/').length === 2
      ? new DateObject({ date: `${value.split('/')[0]}/${value.split('/')[1]}/01`, calendar, locale: calendarLocale, format: 'YYYY/MM/DD' })
      : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <MonthField
        id={startId}
        label={startLabel}
        value={parse(startValue)}
        onChange={onStartChange}
        placeholder={startPlaceholder}
        disabled={disabled}
        error={error?.start}
        calendar={calendar}
        calendarLocale={calendarLocale}
        panelClass={panelClass}
      />
      {hideEnd ? null : (
        <MonthField
          id={endId}
          label={endLabel}
          value={parse(endValue)}
          onChange={onEndChange}
          placeholder={endPlaceholder}
          disabled={disabled}
          error={error?.end}
          calendar={calendar}
          calendarLocale={calendarLocale}
          panelClass={panelClass}
        />
      )}
    </div>
  );
};
