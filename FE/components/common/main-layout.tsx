"use client"

import { BackgroundLayout } from "./background-layout"
import { Header } from "./header"

interface MainLayoutProps {
  children: React.ReactNode
  onLogout?: () => void
}

export function MainLayout({ children, onLogout }: MainLayoutProps) {
  return (
    <BackgroundLayout className="h-screen flex flex-col overflow-hidden">
      <Header onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">{children}</main>
    </BackgroundLayout>
  )
}
