"use client"

import { BackgroundLayout } from "./background-layout"
import { Header } from "./header"
import { FloatingTestButton } from "./floating-test-button"

interface MainLayoutProps {
  children: React.ReactNode
  onLogout?: () => void
  hideFloatingTestButton?: boolean
}

export function MainLayout({ children, onLogout, hideFloatingTestButton = false }: MainLayoutProps) {
  return (
    <BackgroundLayout className="h-screen flex flex-col overflow-hidden">
      <Header onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">{children}</main>
      {!hideFloatingTestButton && <FloatingTestButton />}
    </BackgroundLayout>
  )
}
