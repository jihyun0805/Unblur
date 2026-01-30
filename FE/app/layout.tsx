import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { ConsoleErrorFilter } from "@/components/debug/console-error-filter"

const _geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Unblur",
  description:
    "블러 처리된 화면에서 시작하는 특별한 소개팅. 시간이 지날수록 서로를 알아가며, 진정한 대화를 나눠보세요.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        <AuthProvider>
          <ConsoleErrorFilter />
          {children}
          <Toaster />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
