"use client"

interface StepProgressProps {
  currentStep: number
  totalSteps: number
}

export function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={`w-8 h-1 rounded-full ${currentStep >= step ? "bg-primary" : "bg-muted"}`}
        />
      ))}
    </div>
  )
}
