"use client"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface CheckboxGroupOption {
  value: string
  label: string
}

interface CheckboxGroupFieldProps {
  label: string
  values: string[]
  options: CheckboxGroupOption[]
  onChange: (values: string[]) => void
  fieldId: string
  maxSelection?: number
  showCount?: boolean
  className?: string
  gridCols?: number
}

export function CheckboxGroupField({
  label,
  values,
  options,
  onChange,
  fieldId,
  maxSelection,
  showCount = false,
  className,
  gridCols = 1,
}: CheckboxGroupFieldProps) {
  const toggleItem = (item: string) => {
    if (values.includes(item)) {
      onChange(values.filter((i) => i !== item))
    } else if (!maxSelection || values.length < maxSelection) {
      onChange([...values, item])
    }
  }

  // Tailwind의 동적 클래스 문제를 피하기 위해 명시적으로 클래스 지정
  const getGridClass = (cols: number) => {
    const gridClasses: Record<number, string> = {
      1: "flex flex-wrap gap-5",
      2: "grid grid-cols-2 gap-2",
      3: "grid grid-cols-3 gap-2",
      4: "grid grid-cols-4 gap-2",
    }
    return gridClasses[cols] || gridClasses[1]
  }

  const containerClass = className || getGridClass(gridCols)
  const checkboxClass = className
    ? "border-2 border-foreground/30 data-[state=checked]:border-primary"
    : "rounded-full border-2 border-foreground/20 data-[state=checked]:border-primary size-4 data-[state=checked]:bg-transparent [&>svg]:hidden data-[state=checked]:after:content-[''] data-[state=checked]:after:absolute data-[state=checked]:after:top-1/2 data-[state=checked]:after:left-1/2 data-[state=checked]:after:-translate-x-1/2 data-[state=checked]:after:-translate-y-1/2 data-[state=checked]:after:w-2 data-[state=checked]:after:h-2 data-[state=checked]:after:rounded-full data-[state=checked]:after:bg-primary relative"

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {maxSelection && ` (최대 ${maxSelection}개)`}
      </Label>
      <div className={containerClass}>
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center space-x-2">
            <Checkbox
              id={`${fieldId}-${opt.value}`}
              checked={values.includes(opt.value)}
              onCheckedChange={() => toggleItem(opt.value)}
              disabled={!values.includes(opt.value) && maxSelection ? values.length >= maxSelection : false}
              className={checkboxClass}
            />
            <label htmlFor={`${fieldId}-${opt.value}`} className="text-sm cursor-pointer">
              {opt.label}
            </label>
          </div>
        ))}
      </div>
      {showCount && maxSelection && (
        <p className="text-xs text-muted-foreground">
          {values.length}/{maxSelection} 선택됨
        </p>
      )}
    </div>
  )
}
