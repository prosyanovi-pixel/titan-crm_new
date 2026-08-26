import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Currency label mapping: ISO code → display suffix
 */
const CURRENCY_LABELS: Record<string, string> = {
  RUB: 'руб.',
  USD: '$',
  EUR: '€',
  CNY: '¥',
  GBP: '£',
  KZT: '₸',
};

function getCurrencyLabel(currency: string): string {
  return CURRENCY_LABELS[currency] ?? currency;
}

/** Parse a display string like "232 234,00" to a number */
function parseDisplay(str: string): number {
  const normalized = str
    .replace(/\u00a0/g, '') // non-breaking spaces
    .replace(/\s/g, '')     // regular spaces (digit groups)
    .replace(',', '.');
  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : n;
}

/** Format a number to "232 234,00" (Russian locale, no currency suffix) */
function formatNumber(val: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  /** Numeric value */
  value: number | undefined;
  /** Called with the parsed numeric value on every valid change */
  onValueChange: (value: number) => void;
  /** ISO currency code, e.g. "RUB", "USD" */
  currency?: string;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, currency = 'RUB', ...props }, ref) => {
    const [display, setDisplay] = React.useState(() => formatNumber(value ?? 0));
    const [focused, setFocused] = React.useState(false);

    // Sync from outside only when not focused
    React.useEffect(() => {
      if (!focused) {
        setDisplay(formatNumber(value ?? 0));
      }
    }, [value, focused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Allow only digits, spaces, commas, dots
      if (!/^[\d\s,. ]*$/.test(raw)) return;
      setDisplay(raw);
      const n = parseDisplay(raw);
      onValueChange(n);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      // Show raw numeric string without thousand separators for easy editing
      const raw = value !== undefined && value !== 0 ? String(value).replace('.', ',') : '';
      setDisplay(raw);
      requestAnimationFrame(() => e.target.select());
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      const n = parseDisplay(display);
      onValueChange(n);
      setDisplay(formatNumber(n));
      props.onBlur?.(e);
    };

    const label = getCurrencyLabel(currency);

    return (
      <div className="relative flex items-center">
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={display}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            // base input styles mirroring shadcn Input
            'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
            'transition-colors placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'text-right font-mono tabular-nums pr-12',
            className,
          )}
          {...props}
        />
        <span className="pointer-events-none absolute right-3 select-none text-xs text-muted-foreground font-medium">
          {label}
        </span>
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
