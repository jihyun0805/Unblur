import { Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { getTemperatureColor } from "./utils"

interface HistorySummaryProps {
  totalCount: number
  totalDuration: string
  temperature: number
  className?: string
}

export function HistorySummary({
  totalCount,
  totalDuration,
  temperature,
  className,
}: HistorySummaryProps) {
  return (
    <div
      className={cn("rounded-2xl bg-white border border-border shadow-sm p-5 sm:p-6 mb-8 sm:mb-10", className)}
    >
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl bg-secondary flex items-center justify-center">
          <Users className="w-6 sm:w-7 h-6 sm:h-7 text-secondary-foreground" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold">나의 활동</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">지금까지의 소개팅 기록</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="text-center p-3 sm:p-4 rounded-xl bg-secondary/20">
          <p className="text-xl sm:text-2xl font-bold text-primary">{totalCount}</p>
          <p className="text-xs text-muted-foreground">매칭 수</p>
        </div>
        <div className="text-center p-3 sm:p-4 rounded-xl bg-secondary/20">
          <p className="text-xl sm:text-2xl font-bold text-foreground">{totalDuration}</p>
          <p className="text-xs text-muted-foreground">대화 시간</p>
        </div>
        <div className="text-center p-3 sm:p-4 rounded-xl bg-secondary/20">
          <p className={`text-xl sm:text-2xl font-bold ${getTemperatureColor(temperature)}`}>
            {Math.round(temperature)}%
          </p>
          <p className="text-xs text-muted-foreground">선명도</p>
        </div>
      </div>
    </div>
  )
}
