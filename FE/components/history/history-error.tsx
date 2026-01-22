import { Button } from "@/components/ui/button"

interface HistoryErrorProps {
  onRetry: () => void
}

export function HistoryError({ onRetry }: HistoryErrorProps) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">이력을 불러오는 데 실패했어요.</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
        다시 시도
      </Button>
    </div>
  )
}
