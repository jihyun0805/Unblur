"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface RadioGroupOption {
  value: string
  label: string
}

interface RadioGroupFieldProps {
  label: string
  value: string
  options: RadioGroupOption[]
  onChange: (value: string) => void
  fieldId: string
  className?: string
}

export function RadioGroupField({
  label,
  value,
  options,
  onChange,
  fieldId,
  className = "flex flex-wrap gap-5",
}: RadioGroupFieldProps) {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <RadioGroup value={value} onValueChange={onChange} className={className}>
        {options.map((opt) => (
          <label
            key={opt.value}
            htmlFor={`${fieldId}-${opt.value}`}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <RadioGroupItem
              value={opt.value}
              id={`${fieldId}-${opt.value}`}
              className="border-2 border-foreground/20 data-[state=checked]:border-primary"
            />
            <span className="text-sm font-normal">{opt.label}</span>
          </label>
        ))}
      </RadioGroup>
    </div>
  )
}
