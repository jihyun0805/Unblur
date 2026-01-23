"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface RegisterFormWrapperProps {
  title: string
  description?: string
  onSubmit: (e: React.FormEvent) => void
  onPrev?: () => void
  children: React.ReactNode
  submitLabel?: string
  submitDisabled?: boolean
  submitLoading?: boolean
  submitLoadingText?: string
  className?: string
}

export function RegisterFormWrapper({
  title,
  description,
  onSubmit,
  onPrev,
  children,
  submitLabel = "다음",
  submitDisabled = false,
  submitLoading = false,
  submitLoadingText,
  className = "space-y-10 mt-4",
}: RegisterFormWrapperProps) {
  const loadingText = submitLoadingText || "처리 중..."

  return (
    <form onSubmit={onSubmit} className={className}>
      <div className="space-y-1">
        <h3 className="font-semibold text-center">{title}</h3>
        {description && <p className="text-sm text-muted-foreground text-center">{description}</p>}
      </div>

      {children}

      <div className="flex gap-3">
        {onPrev && (
          <Button type="button" variant="outline" onClick={onPrev} className="flex-1">
            이전
          </Button>
        )}
        <Button
          type="submit"
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={submitDisabled || submitLoading}
        >
          {submitLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {loadingText}
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  )
}
