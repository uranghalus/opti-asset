import * as React from "react"
import { CalendarIcon, ChevronDownIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: Date | string | null
  onChange?: (date: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function parseDate(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return value
  }

  const parsed = new Date(value)

  return isNaN(parsed.getTime()) ? null : parsed
}

export function DatePicker({
  value,
  onChange,
  disabled,
  placeholder = "Pilih tanggal",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(() =>
    parseDate(value)
  )

  React.useEffect(() => {
    setSelectedDate(parseDate(value))
  }, [value])

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      onChange?.(toISODate(date))
    } else {
      setSelectedDate(null)
      onChange?.("")
    }

    setOpen(false)
  }

  const formattedDate = selectedDate
    ? selectedDate.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : ""

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-9 w-full justify-start gap-2 rounded-md border-input bg-transparent px-3 font-normal shadow-xs",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            !selectedDate && "text-muted-foreground",
            disabled && "opacity-50",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="size-4" />
          {formattedDate || placeholder}
          <ChevronDownIcon className="ml-auto size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate ?? undefined}
          onSelect={handleSelect}
          className="rounded-md border"
        />
      </PopoverContent>
    </Popover>
  )
}