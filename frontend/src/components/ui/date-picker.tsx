
import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { ru } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { useTranslation } from "@/lib/i18n"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string
  onChange: (date: string) => void
  className?: string
  placeholder?: string
}

export function DatePicker({ value, onChange, className, placeholder }: DatePickerProps) {
  const { t } = useTranslation();
  const finalPlaceholder = placeholder || t('components.date_picker.placeholder');
  const [date, setDate] = React.useState<Date | undefined>(undefined)

  React.useEffect(() => {
    if (value) {
      // Try parsing DD.MM.YYYY first
      let parsed = parse(value, "dd.MM.yyyy", new Date())
      if (isValid(parsed)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDate(parsed)
        return
      }

      // Try parsing ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)
      try {
        parsed = new Date(value)
        if (isValid(parsed)) {
          setDate(parsed)
          return
        }
      } catch {
        // Invalid date
      }

      setDate(undefined)
    } else {
      setDate(undefined)
    }
  }, [value])

  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate)
    if (newDate) {
      onChange(format(newDate, "dd.MM.yyyy"))
    } else {
      onChange("")
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd.MM.yyyy") : (value || <span>{finalPlaceholder}</span>)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          locale={ru}
        />
      </PopoverContent>
    </Popover>
  )
}
