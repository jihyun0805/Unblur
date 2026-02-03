import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { ChatProvider } from "@/contexts/chat-context"
import { MatchSseProvider } from "@/contexts/match-sse-context"
import { SessionIdProvider } from "@/contexts/session-id-context"
import { MatchRequestToaster } from "@/components/matching/match-request-toaster"
import { Toaster } from "@/components/ui/toaster"
import { ConsoleErrorFilter } from "@/components/debug/console-error-filter"
import { GoogleAnalytics } from '@next/third-parties/google'
import Script from "next/script"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Unblur",
  description:
    "블러 처리된 화면에서 시작하는 특별한 소개팅. 시간이 지날수록 서로를 알아가며, 진정한 대화를 나눠보세요.",
  icons: {
    icon: "/favicon.ico",
  },
}

const MicrosoftClarity = () => {
  return (
      <Script
          id="microsoft-clarity-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
                    (function(c,l,a,r,i,t,y){
                        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                    })(window, document, "clarity", "script", "vb3gerobxl");
                `,
          }}
      />
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${geist.className} antialiased`}>
        <AuthProvider>
          <MatchSseProvider>
            <SessionIdProvider>
              <ChatProvider>
                {children}
                <Toaster />
              </ChatProvider>
              <MatchRequestToaster />
            </SessionIdProvider>
          </MatchSseProvider>
        </AuthProvider>
        <Analytics />
      </body>
      <GoogleAnalytics gaId="G-B57MXQH88P" />
      <MicrosoftClarity />
    </html>
  )
}
