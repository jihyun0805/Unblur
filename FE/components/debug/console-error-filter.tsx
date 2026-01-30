"use client"

import { useEffect } from "react"

const IGNORE_SUBSTRINGS = ["Created TensorFlow Lite XNNPACK delegate for CPU"]

const shouldIgnoreConsoleError = (args: unknown[]) =>
  args.some((arg) => {
    if (typeof arg === "string") {
      return IGNORE_SUBSTRINGS.some((text) => arg.includes(text))
    }
    if (arg instanceof Error) {
      return IGNORE_SUBSTRINGS.some((text) => arg.message.includes(text))
    }
    return false
  })

export function ConsoleErrorFilter() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return

    const originalError = console.error
    console.error = (...args: unknown[]) => {
      if (shouldIgnoreConsoleError(args)) return
      originalError(...args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  return null
}
