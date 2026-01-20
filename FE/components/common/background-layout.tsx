"use client"

import Image from "next/image"

interface BackgroundLayoutProps {
  children: React.ReactNode
  imageSrc?: string
  imageOpacity?: number
  overlayClassName?: string
  className?: string
  useNextImage?: boolean
}

export function BackgroundLayout({
  children,
  imageSrc = "/sunset-ocean.jpg",
  imageOpacity = 35,
  overlayClassName = "bg-white/30",
  className = "",
  useNextImage = false,
}: BackgroundLayoutProps) {
  return (
    <div className={`min-h-screen relative ${className}`}>
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        {useNextImage ? (
          <Image
            src={imageSrc}
            alt="Background"
            fill
            className="object-cover"
            style={{ opacity: imageOpacity / 100 }}
            priority
          />
        ) : (
          <img
            src={imageSrc}
            alt="Background"
            className="w-full h-full object-cover"
            style={{ opacity: imageOpacity / 100 }}
          />
        )}
        <div className={`absolute inset-0 ${overlayClassName}`} />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
