"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Video, VideoOff, Check, AlertCircle, Sparkles } from "lucide-react"

interface CameraTestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReady: () => void
}

const BLUR_LEVELS = [
  { level: 20, label: "1라운드", description: "강한 블러" },
  { level: 10, label: "2라운드", description: "약한 블러" },
  { level: 3, label: "3라운드", description: "투명" },
  { level: 0, label: "최종", description: "완전 공개" },
]

export function CameraTestModal({ open, onOpenChange, onReady }: CameraTestModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasCamera, setHasCamera] = useState<boolean | null>(null)
  const [selectedBlur, setSelectedBlur] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const [beautyFilter, setBeautyFilter] = useState({
    enabled: false,
    smoothness: 50,
    brightness: 50,
  })

  useEffect(() => {
    if (open) {
      initCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [open])

  useEffect(() => {
    if (!stream || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number

    const render = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Draw video frame
        ctx.drawImage(video, 0, 0)

        if (beautyFilter.enabled) {
          // Apply brightness
          const brightnessValue = (beautyFilter.brightness - 50) * 2
          ctx.filter = `brightness(${100 + brightnessValue}%)`
          ctx.drawImage(canvas, 0, 0)
          ctx.filter = "none"

          // Apply smoothness (simplified skin smoothing effect)
          if (beautyFilter.smoothness > 30) {
            ctx.globalAlpha = beautyFilter.smoothness / 200
            ctx.filter = `blur(${beautyFilter.smoothness / 25}px)`
            ctx.drawImage(canvas, 0, 0)
            ctx.filter = "none"
            ctx.globalAlpha = 1
          }
        }
      }
      animationId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animationId)
  }, [stream, beautyFilter])

  const initCamera = async () => {
    try {
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("[v0] MediaDevices API not supported")
        setHasCamera(false)
        return
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setHasCamera(true)
    } catch (error: any) {
      console.error("[v0] Camera access error:", error?.name, error?.message)
      // Permission denied, device not found, etc.
      setHasCamera(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  const handleReady = () => {
    stopCamera()
    onReady()
  }

  const currentBlur = BLUR_LEVELS[selectedBlur]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-background max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">카메라 테스트</DialogTitle>
          <p className="text-muted-foreground text-center text-sm">
            매칭 전에 카메라를 확인하고 블러 단계를 미리 체험해보세요
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Camera Preview */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#2a2a2a]">
            {hasCamera === false ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <AlertCircle className="w-12 h-12 mb-4 text-destructive" />
                <p className="font-medium">카메라에 접근할 수 없습니다</p>
                <p className="text-sm text-muted-foreground mt-2">브라우저 설정에서 카메라 권한을 허용해주세요</p>
              </div>
            ) : (
              <>
                {/* Hidden video for capture */}
                <video ref={videoRef} autoPlay playsInline muted className="hidden" />
                {/* Canvas with filters applied */}
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-cover transition-all duration-500"
                  style={{ filter: `blur(${currentBlur.level}px)` }}
                />
                {/* Blur level badge */}
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-primary/80 backdrop-blur-sm">
                  <span className="text-primary-foreground text-sm font-medium">
                    {currentBlur.label} - {currentBlur.description}
                  </span>
                </div>
                {/* Beauty filter badge */}
                {beautyFilter.enabled && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-pink-500/80 backdrop-blur-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-white" />
                    <span className="text-white text-sm font-medium">뷰티 필터 ON</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Blur Level Selector */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">블러 단계 미리보기</Label>
            <div className="grid grid-cols-4 gap-2">
              {BLUR_LEVELS.map((blur, index) => (
                <button
                  key={blur.level}
                  onClick={() => setSelectedBlur(index)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedBlur === index ? "bg-primary text-primary-foreground" : "bg-card hover:bg-card/80"
                  }`}
                >
                  <p className="font-medium text-sm">{blur.label}</p>
                  <p
                    className={`text-xs mt-1 ${selectedBlur === index ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                  >
                    {blur.level}px
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Beauty Filter Settings */}
          <div className="space-y-4 p-4 rounded-xl bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" />
                <Label className="text-sm font-medium">뷰티 필터</Label>
              </div>
              <Switch
                checked={beautyFilter.enabled}
                onCheckedChange={(checked) => setBeautyFilter({ ...beautyFilter, enabled: checked })}
              />
            </div>

            {beautyFilter.enabled && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">피부 보정</Label>
                    <span className="text-xs text-muted-foreground">{beautyFilter.smoothness}%</span>
                  </div>
                  <Slider
                    value={[beautyFilter.smoothness]}
                    onValueChange={([value]) => setBeautyFilter({ ...beautyFilter, smoothness: value })}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">밝기</Label>
                    <span className="text-xs text-muted-foreground">{beautyFilter.brightness}%</span>
                  </div>
                  <Slider
                    value={[beautyFilter.brightness]}
                    onValueChange={([value]) => setBeautyFilter({ ...beautyFilter, brightness: value })}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div
            className={`flex items-center gap-3 p-4 rounded-xl ${hasCamera ? "bg-green-500/10" : "bg-destructive/10"}`}
          >
            {hasCamera ? (
              <>
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Video className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-600">카메라 준비 완료</p>
                  <p className="text-sm text-muted-foreground">카메라가 정상적으로 작동합니다</p>
                </div>
              </>
            ) : hasCamera === false ? (
              <>
                <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                  <VideoOff className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-destructive">카메라 접근 불가</p>
                  <p className="text-sm text-muted-foreground">카메라 권한이 필요합니다. 브라우저 설정을 확인해주세요.</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center animate-pulse">
                  <Video className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">카메라 연결 중...</p>
                  <p className="text-sm text-muted-foreground">잠시만 기다려주세요</p>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              취소
            </Button>
            <Button 
              onClick={handleReady} 
              disabled={!hasCamera}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Check className="w-4 h-4 mr-2" />
              준비 완료
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
