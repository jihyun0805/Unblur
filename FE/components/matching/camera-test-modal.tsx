"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Video, VideoOff, Check, AlertCircle, Sparkles, Mic, MicOff } from "lucide-react"
import { registerStream, unregisterStream } from "@/lib/media-streams"
import BeautyFilter from "./beauty-filter"

interface CameraTestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReady: () => void
}

const BLUR_LEVELS = [
  { level: 20, label: "1라운드", description: "블라인드" },
  { level: 10, label: "2라운드", description: "강한 블러" },
  { level: 5, label: "3라운드", description: "약간 블러" },
  { level: 0, label: "최종", description: "완전 공개" },
]

export function CameraTestModal({ open, onOpenChange, onReady }: CameraTestModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasCamera, setHasCamera] = useState<boolean | null>(null)
  const [hasMicrophone, setHasMicrophone] = useState<boolean | null>(null)
  const [selectedBlur, setSelectedBlur] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const BEAUTY_STORAGE_KEY = "beauty_filter_settings"

  const [beautyFilter, setBeautyFilter] = useState({
    enabled: false,
    smoothness: 50,
    lipIntensity: 67,
  })

  const isFinalRound = selectedBlur === BLUR_LEVELS.length - 1
  const isBeautyActive = beautyFilter.enabled && isFinalRound

  useEffect(() => {
    if (!open) return
    try {
      const raw = localStorage.getItem(BEAUTY_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        enabled?: boolean
        smoothness?: number
        lipIntensity?: number
      }
      setBeautyFilter((prev) => ({
        enabled: parsed.enabled ?? prev.enabled,
        smoothness: Number.isFinite(parsed.smoothness) ? Number(parsed.smoothness) : prev.smoothness,
        lipIntensity: Number.isFinite(parsed.lipIntensity) ? Number(parsed.lipIntensity) : prev.lipIntensity,
      }))
    } catch {
      // ignore corrupted storage
    }
  }, [open])

  useEffect(() => {
    try {
      localStorage.setItem(BEAUTY_STORAGE_KEY, JSON.stringify(beautyFilter))
    } catch {
      // ignore storage failures
    }
  }, [beautyFilter])

  useEffect(() => {
    if (open) {
      initCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [open])

  useEffect(() => {
    if (isBeautyActive) return
    if (!stream || !videoRef.current) return

    if (videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream
    }
    videoRef.current.play().catch((error) => {
      if (error?.name === "AbortError") return
      // Autoplay may be blocked; user interaction will start playback.
    })
  }, [stream, isBeautyActive])

  useEffect(() => {
    if (!isFinalRound && beautyFilter.enabled) {
      setBeautyFilter((prev) => ({ ...prev, enabled: false }))
    }
  }, [isFinalRound, beautyFilter.enabled])

  const initCamera = async () => {
    // Check if mediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("[CameraTest] MediaDevices API not supported")
      setHasCamera(false)
      setHasMicrophone(false)
      return
    }

    setHasCamera(null) // 로딩 상태
    setHasMicrophone(null) // 로딩 상태

    let videoStream: MediaStream | null = null
    let audioStream: MediaStream | null = null

    // 카메라 개별 확인
    try {
      videoStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user", 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      })
      
      const videoTracks = videoStream.getVideoTracks()
      const cameraAvailable = videoTracks.length > 0 && videoTracks[0].readyState === "live"
      setHasCamera(cameraAvailable)
      console.log("[CameraTest] Camera check:", cameraAvailable)
      
      // 트랙 상태 변경 감지
      videoTracks.forEach((track) => {
        track.onended = () => setHasCamera(false)
        track.onmute = () => setHasCamera(false)
        track.onunmute = () => setHasCamera(true)
      })
    } catch (error: any) {
      console.error("[CameraTest] Camera access error:", error?.name, error?.message)
      setHasCamera(false)
    }

    // 마이크 개별 확인
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      })
      
      const audioTracks = audioStream.getAudioTracks()
      const micAvailable = audioTracks.length > 0 && audioTracks[0].readyState === "live"
      setHasMicrophone(micAvailable)
      console.log("[CameraTest] Microphone check:", micAvailable)
      
      // 트랙 상태 변경 감지
      audioTracks.forEach((track) => {
        track.onended = () => setHasMicrophone(false)
        track.onmute = () => setHasMicrophone(false)
        track.onunmute = () => setHasMicrophone(true)
      })
    } catch (error: any) {
      console.error("[CameraTest] Microphone access error:", error?.name, error?.message)
      setHasMicrophone(false)
    }

    // 스트림 합치기 (둘 다 있거나 하나만 있는 경우 모두 처리)
    if (videoStream || audioStream) {
      const combinedStream = new MediaStream()
      
      if (videoStream) {
        videoStream.getVideoTracks().forEach(track => combinedStream.addTrack(track))
      }
      if (audioStream) {
        audioStream.getAudioTracks().forEach(track => combinedStream.addTrack(track))
      }
      
      setStream(combinedStream)
      registerStream(combinedStream)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop()
        stream.removeTrack(track)
      })
      unregisterStream(stream)
      setStream(null)
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
  }

  const handleReady = () => {
    stopCamera()
    onReady()
  }

  const currentBlur = BLUR_LEVELS[selectedBlur]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl w-[90vw] h-[85vh] bg-background p-0 overflow-hidden flex flex-col max-[1023px]:h-[85vh] max-[1023px]:max-h-[85vh] max-[768px]:fixed max-[768px]:inset-0 max-[768px]:w-screen max-[768px]:h-screen max-[768px]:max-w-none max-[768px]:max-h-none max-[768px]:rounded-none max-[768px]:border-0 max-[768px]:top-0 max-[768px]:left-0 max-[768px]:translate-x-0 max-[768px]:translate-y-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-center">카메라 테스트</DialogTitle>
          <p className="text-muted-foreground text-center text-sm">
            매칭 전에 카메라를 확인하고 블러 단계를 미리 체험해보세요
          </p>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
          {/* 왼쪽: Camera Preview */}
          <div className="flex-1 p-4 flex items-center justify-center min-w-0 md:min-h-0 max-[768px]:h-[45vh] max-[768px]:flex-none">
            <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden bg-[#2a2a2a] max-[768px]:h-full max-[768px]:w-full max-[768px]:max-w-none max-[768px]:aspect-auto max-[1023px]:max-w-[360px]">
            {hasCamera === false ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <AlertCircle className="w-12 h-12 mb-4 text-destructive" />
                <p className="font-medium">카메라에 접근할 수 없습니다</p>
                <p className="text-sm text-muted-foreground mt-2">브라우저 설정에서 카메라 권한을 허용해주세요</p>
              </div>
            ) : (
              <>
                {/* Video element - 뷰티 필터가 없을 때는 직접 표시 */}
                {!isBeautyActive ? (
                  <video 
                    ref={videoRef} 
                    playsInline 
                    muted 
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-500 -scale-x-100"
                    style={{ filter: `blur(${currentBlur.level}px)` }}
                    onLoadedMetadata={() => {
                      console.log("[CameraTest] Video metadata loaded", {
                        width: videoRef.current?.videoWidth,
                        height: videoRef.current?.videoHeight,
                        readyState: videoRef.current?.readyState
                      })
                    }}
                    onCanPlay={() => {
                      console.log("[CameraTest] Video can play")
                    }}
                  />
                ) : (
                  <div className="absolute inset-0">
                    <BeautyFilter
                      stream={stream}
                      blurLevel={currentBlur.level}
                      smoothness={beautyFilter.smoothness}
                      lipIntensity={beautyFilter.lipIntensity}
                    />
                  </div>
                )}
                {/* Blur level badge */}
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-primary/80 backdrop-blur-sm">
                  <span className="text-primary-foreground text-sm font-medium">
                    {currentBlur.label} - {currentBlur.description}
                  </span>
                </div>
                {/* Beauty filter badge */}
                {isBeautyActive && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-pink-500/80 backdrop-blur-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-white" />
                    <span className="text-white text-sm font-medium">뷰티 필터 ON</span>
                  </div>
                )}
                {/* 카메라 연결 중 표시 */}
                {hasCamera === null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="text-white text-sm">카메라 연결 중...</div>
                  </div>
                )}
              </>
            )}
            </div>
          </div>

          {/* 오른쪽: 컨트롤 패널 */}
          <div className="w-full md:w-[360px] border-t md:border-t-0 md:border-l overflow-y-auto p-4 flex flex-col gap-4 max-[1023px]:min-h-0">
            {/* Blur Level Selector */}
            <div className="space-y-2 flex-shrink-0">
              <Label className="text-sm font-medium">블러 단계 미리보기</Label>
              <div className="grid grid-cols-4 max-[400px]:grid-cols-2 gap-2">
              {BLUR_LEVELS.map((blur, index) => (
                <button
                  key={blur.level}
                  onClick={() => setSelectedBlur(index)}
                  className={`p-3 max-[400px]:p-2 rounded-xl text-center transition-all ${
                    selectedBlur === index ? "bg-primary text-primary-foreground" : "bg-card hover:bg-card/80"
                  }`}
                >
                  <p className="font-medium text-sm max-[400px]:text-xs">{blur.label}</p>
                  <p
                    className={`text-xs max-[400px]:text-[11px] mt-1 ${
                      selectedBlur === index ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    {blur.description}
                  </p>
                </button>
              ))}
            </div>
            </div>

            {/* Beauty Filter Settings */}
            <div className="space-y-4 p-4 rounded-xl bg-card flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" />
                <Label className="text-sm font-medium">뷰티 필터</Label>
              </div>
              <Switch
                checked={beautyFilter.enabled}
                onCheckedChange={(checked) => setBeautyFilter((prev) => ({ ...prev, enabled: checked }))}
                disabled={!isFinalRound}
              />
            </div>

            {!isFinalRound && (
              <p className="text-xs text-muted-foreground">뷰티 필터는 최종 라운드에서만 확인할 수 있어요.</p>
            )}

            {beautyFilter.enabled && isFinalRound && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">피부 보정</Label>
                    <span className="text-xs text-muted-foreground">{beautyFilter.smoothness}%</span>
                  </div>
                  <Slider
                    value={[beautyFilter.smoothness]}
                    onValueChange={([value]) => setBeautyFilter((prev) => ({ ...prev, smoothness: value }))}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">입술 색감</Label>
                    <span className="text-xs text-muted-foreground">{beautyFilter.lipIntensity}%</span>
                  </div>
                  <Slider
                    value={[beautyFilter.lipIntensity]}
                    onValueChange={([value]) => setBeautyFilter((prev) => ({ ...prev, lipIntensity: value }))}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            )}
            </div>

            {/* Status */}
            <div className="space-y-2 flex-shrink-0">
              {/* 카메라 상태 */}
              <div
                className={`flex items-center gap-3 p-3 rounded-xl ${hasCamera ? "bg-green-500/10" : "bg-destructive/10"}`}
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

              {/* 마이크 상태 */}
              <div
                className={`flex items-center gap-3 p-3 rounded-xl ${hasMicrophone ? "bg-green-500/10" : "bg-destructive/10"}`}
              >
              {hasMicrophone ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Mic className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-600">마이크 준비 완료</p>
                    <p className="text-sm text-muted-foreground">마이크가 정상적으로 작동합니다</p>
                  </div>
                </>
              ) : hasMicrophone === false ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                    <MicOff className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-destructive">마이크 접근 불가</p>
                    <p className="text-sm text-muted-foreground">마이크 권한이 필요합니다. 브라우저 설정을 확인해주세요.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center animate-pulse">
                    <Mic className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">마이크 연결 중...</p>
                    <p className="text-sm text-muted-foreground">잠시만 기다려주세요</p>
                  </div>
                </>
              )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t flex-shrink-0 mt-auto">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                취소
              </Button>
              <Button 
                onClick={handleReady} 
                disabled={!hasCamera || !hasMicrophone}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Check className="w-4 h-4 mr-2" />
                준비 완료
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
