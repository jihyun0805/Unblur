interface UnblurLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function UnblurLogo({ className, size = "md", showText = true }: UnblurLogoProps) {
  const sizeMap = {
    sm: { icon: "w-8 h-8", text: "text-lg" },
    md: { icon: "w-10 h-10", text: "text-xl" },
    lg: { icon: "w-14 h-14", text: "text-2xl" },
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/images/chatgpt-20image-202026-eb-85-84-201-ec-9b-94-2013-ec-9d-bc-20-ec-98-a4-ed-9b-84-2001-55-14-photoroom.png"
        alt="Unblur Logo"
        className={`${sizeMap[size].icon} object-contain`}
        style={{
          filter:
            "brightness(0) saturate(100%) invert(24%) sepia(14%) saturate(1200%) hue-rotate(176deg) brightness(95%) contrast(90%)",
        }}
      />
      {showText && (
        <span className={`font-bold ${sizeMap[size].text}`} style={{ color: "#3d4f6f" }}>
          Unblur
        </span>
      )}
    </div>
  )
}
