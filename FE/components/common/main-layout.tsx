"use client"

import { BackgroundLayout } from "./background-layout"
import { Header } from "./header"

interface MainLayoutProps {
  children: React.ReactNode
  onLogout?: () => void
}

export function MainLayout({ children, onLogout }: MainLayoutProps) {
  return (
    <BackgroundLayout>
      <Header onLogout={onLogout} />
      <main className="pt-20 pb-10 px-4">{children}</main>
    </BackgroundLayout>
  )
}
