import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number | undefined;
  onValueChange: (value: number) => void;
  currency?: string;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ className, value, onValueChange, currency, ...props }, ref) => {
    // Internal string state to handle user typing "100." before "100.5"
    const [displayValue, setDisplayValue] = React.useState("");

    // Format number to "1 234 567,89"
    const formatValue = (val: number | undefined) => {
      if (val === undefined || val === null || isNaN(val)) return "";
      return new Intl.NumberFormat("ru-RU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);
    };

    // Update display value when prop value changes externally
    React.useEffect(() => {
      // Only update if the parsed display value is different to avoid cursor jumps on simple re-renders
      // or if the field is not currently focused (simplified approach)
      const parsedDisplay = parseFloat(displayValue.replace(/\s/g, "").replace(",", "."));
      if (value !== parsedDisplay) {
         setDisplayValue(formatValue(value));
      }
    }, [value, displayValue, setDisplayValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Allow only numbers, spaces, commas, dots
      if (!/^[\d\s,.]*$/.test(inputValue)) return;

      setDisplayValue(inputValue);

      // Normalize for parsing: remove spaces, replace comma with dot
      const normalized = inputValue.replace(/\s/g, "").replace(",", ".");
      const numericValue = parseFloat(normalized);

      if (!isNaN(numericValue)) {
        onValueChange(numericValue);
      } else if (normalized === "") {
        onValueChange(0);
      }
    };

    const handleBlur = () => {
      // On blur, enforce the strict formatting
      if (value !== undefined) {
        setDisplayValue(formatValue(value));
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        // Optional: Remove formatting on focus to make editing easier? 
        // For now, let's keep it simple, user can edit the string.
        // Or strip formatting:
        const raw = value?.toString().replace('.', ',') || "";
        setDisplayValue(raw);
        e.target.select();
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className={cn("text-right font-mono", className)}
        {...props}
      />
    );
  }
);

MoneyInput.displayName = "MoneyInput";
