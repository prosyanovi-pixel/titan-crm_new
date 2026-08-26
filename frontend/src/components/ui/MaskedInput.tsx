
import * as React from "react";
import { Input } from "@/components/ui/input";

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maskType?: "phone" | "date";
}

export const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ value, onChange, maskType = "phone", ...props }, ref) => {
    
    const formatPhone = (input: string) => {
      // Strip all non-numeric chars
      const digits = input.replace(/\D/g, "");
      
      // Handle backspace/empty
      if (!digits) return "";

      // Russian phone mask +7 (XXX) XXX-XX-XX
      // We assume input usually starts with 7 or 8, normalize to 7
      let formatted = "+7";
      
      if (digits.length > 1) {
        formatted += ` (${digits.substring(1, 4)}`;
      }
      if (digits.length > 4) {
        formatted += `) ${digits.substring(4, 7)}`;
      }
      if (digits.length > 7) {
        formatted += `-${digits.substring(7, 9)}`;
      }
      if (digits.length > 9) {
        formatted += `-${digits.substring(9, 11)}`;
      }
      
      return formatted;
    };

    const formatDate = (input: string) => {
      // DD.MM.YYYY
      const digits = input.replace(/\D/g, "");
      
      if (!digits) return "";

      let formatted = "";
      
      // Day
      if (digits.length > 0) {
        formatted += digits.substring(0, 2);
      }
      // Month
      if (digits.length >= 3) {
        formatted += `.${digits.substring(2, 4)}`;
      }
      // Year
      if (digits.length >= 5) {
        formatted += `.${digits.substring(4, 8)}`;
      }

      return formatted;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Determine if user is deleting (simple heuristic)
      const inputType = (e.nativeEvent as InputEvent).inputType;
      const isDeleting = inputType === "deleteContentBackward";
        
        if (isDeleting) {
            // Allow default deletion behavior via simple onChange
            // But we still might want to re-format slightly or just pass through
            // Passing through allows deleting symbols naturally
            onChange(e);
            return;
        }

        let formatted = e.target.value;

        if (maskType === "phone") {
            formatted = formatPhone(e.target.value);
        } else if (maskType === "date") {
            formatted = formatDate(e.target.value);
        }

        // Create a synthetic event with the formatted value
        const syntheticEvent = {
            ...e,
            target: {
                ...e.target,
                value: formatted
          },
          currentTarget: {
            ...e.currentTarget,
            value: formatted
          }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
    };

    return <Input ref={ref} value={value} onChange={handleChange} maxLength={maskType === "date" ? 10 : 18} {...props} />;
  }
);

MaskedInput.displayName = "MaskedInput";
