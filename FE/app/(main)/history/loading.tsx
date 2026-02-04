// app/(main)/history/loading.tsx
function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} />
}

export default function Loading() {
  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6">
      {/* 상단 검색/필터 자리 */}
      <SkeletonBlock className="h-12 w-full" />

      {/* 요약 카드 자리 (모바일 1열, 데스크탑 2~3열 느낌) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SkeletonBlock className="h-28 w-full" />
        <SkeletonBlock className="h-28 w-full" />
      </div>

      {/* 히스토리 아이템 카드들 */}
      <div className="space-y-4">
        <SkeletonBlock className="h-28 w-full" />
        <SkeletonBlock className="h-28 w-full" />
        <SkeletonBlock className="h-28 w-full" />
        <SkeletonBlock className="h-28 w-full" />
      </div>

      {/* 페이지네이션 자리 */}
      <div className="flex justify-center gap-2 pt-2">
        <SkeletonBlock className="h-10 w-10 rounded-lg" />
        <SkeletonBlock className="h-10 w-10 rounded-lg" />
        <SkeletonBlock className="h-10 w-10 rounded-lg" />
        <SkeletonBlock className="h-10 w-10 rounded-lg" />
        <SkeletonBlock className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  )
}
