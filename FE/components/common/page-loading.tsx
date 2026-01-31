"use client"

interface PageLoadingProps {
  /** 화면 중앙에 표시할 메시지 (기본: "로딩 중...") */
  message?: string
}

/**
 * 전체 화면 로딩 UI (스피너 + 메시지).
 * 인증 체크 중, 리다이렉트 대기 등 페이지 단위 로딩에 사용.
 */
export function PageLoading({ message = "로딩 중..." }: PageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"
          aria-hidden
        />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
