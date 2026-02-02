'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'

export function Toaster() {
  const pathname = usePathname()
  const { toasts, toast: showToast } = useToast()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = sessionStorage.getItem('pendingToast')
    if (!raw) return
    sessionStorage.removeItem('pendingToast')
    try {
      const data = JSON.parse(raw) as {
        title?: string
        description?: string
        variant?: 'default' | 'destructive'
      }
      if (data?.title || data?.description) {
        showToast({
          title: data.title,
          description: data.description,
          variant: data.variant,
        })
      }
    } catch {
      // ignore malformed pending toast
    }
  }, [pathname, showToast])

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
