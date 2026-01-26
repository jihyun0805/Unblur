"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Video, VideoOff, Check, AlertCircle, Sparkles, Mic, MicOff } from "lucide-react"

interface CameraTestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReady: () => void
}

const BLUR_LEVELS = [
  { level: 20, label: "1라운드", description: "강한 블러" },
  { level: 10, label: "2라운드", description: "약한 블러" },
  { level: 5, label: "3라운드", description: "투명" },
  { level: 0, label: "최종", description: "완전 공개" },
]

export function CameraTestModal({ open, onOpenChange, onReady }: CameraTestModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasCamera, setHasCamera] = useState<boolean | null>(null)
  const [hasMicrophone, setHasMicrophone] = useState<boolean | null>(null)
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
    if (!stream || !videoRef.current || !canvasRef.current) {
      console.log("[CameraTest] Missing dependencies:", { stream: !!stream, video: !!videoRef.current, canvas: !!canvasRef.current })
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) {
      console.error("[CameraTest] Failed to get canvas context")
      return
    }

    let animationId: number
    let isRendering = true

    const render = () => {
      if (!isRendering || !video || !canvas) return

      // 비디오가 준비되었는지 확인
      if (video.readyState >= video.HAVE_METADATA && video.videoWidth > 0 && video.videoHeight > 0) {
        // Canvas 크기를 비디오 크기에 맞춤
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          console.log("[CameraTest] Canvas resized to:", canvas.width, "x", canvas.height)
        }

        try {
          // Draw video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

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
        } catch (error) {
          console.error("[CameraTest] Render error:", error)
        }
      } else {
        // 비디오가 아직 준비되지 않음
        console.log("[CameraTest] Video not ready:", {
          readyState: video.readyState,
          width: video.videoWidth,
          height: video.videoHeight
        })
      }
      
      if (isRendering) {
        animationId = requestAnimationFrame(render)
      }
    }

    // 비디오가 로드되면 렌더링 시작
    const handleLoadedMetadata = () => {
      console.log("[CameraTest] Video metadata loaded in effect")
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        render()
      }
    }

    const handleCanPlay = () => {
      console.log("[CameraTest] Video can play")
      render()
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("canplay", handleCanPlay)
    
    // 약간의 지연 후 렌더링 시작 (비디오가 준비될 시간을 줌)
    const timeoutId = setTimeout(() => {
      if (video.readyState >= video.HAVE_METADATA) {
        render()
      }
    }, 100)

    return () => {
      isRendering = false
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("canplay", handleCanPlay)
    }
  }, [stream, beautyFilter])

  const initCamera = async () => {
    try {
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("[CameraTest] MediaDevices API not supported")
        setHasCamera(false)
        return
      }

      setHasCamera(null) // 로딩 상태
      setHasMicrophone(null) // 로딩 상태

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user", 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true, // 마이크 활성화
      })
      
      setStream(mediaStream)
      
      // 비디오 트랙 확인
      const videoTracks = mediaStream.getVideoTracks()
      const audioTracks = mediaStream.getAudioTracks()
      
      setHasCamera(videoTracks.length > 0 && videoTracks[0].readyState === "live")
      setHasMicrophone(audioTracks.length > 0 && audioTracks[0].readyState === "live")
      
      // 트랙 상태 변경 감지
      videoTracks.forEach((track) => {
        track.onended = () => {
          setHasCamera(false)
        }
        track.onmute = () => {
          setHasCamera(false)
        }
        track.onunmute = () => {
          setHasCamera(true)
        }
      })
      
      audioTracks.forEach((track) => {
        track.onended = () => {
          setHasMicrophone(false)
        }
        track.onmute = () => {
          setHasMicrophone(false)
        }
        track.onunmute = () => {
          setHasMicrophone(true)
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        
        // 비디오가 로드될 때까지 대기
        videoRef.current.onloadedmetadata = () => {
          console.log("[CameraTest] Video loaded, dimensions:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight)
          console.log("[CameraTest] Video readyState:", videoRef.current?.readyState)
        }
        
        videoRef.current.oncanplay = () => {
          console.log("[CameraTest] Video can play")
        }
        
        videoRef.current.onplay = () => {
          console.log("[CameraTest] Video playing")
        }
        
        // 비디오 재생 강제
        videoRef.current.play().catch((error) => {
          console.error("[CameraTest] Failed to play video:", error)
        })
      }
    } catch (error: any) {
      console.error("[CameraTest] Camera access error:", error?.name, error?.message)
      
      let errorMessage = "카메라 또는 마이크에 접근할 수 없습니다"
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage = "카메라/마이크 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요."
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMessage = "카메라/마이크를 찾을 수 없습니다. 장치가 연결되어 있는지 확인해주세요."
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        errorMessage = "카메라/마이크에 접근할 수 없습니다. 다른 애플리케이션에서 사용 중일 수 있습니다."
      }
      
      setHasCamera(false)
      setHasMicrophone(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop()
        stream.removeTrack(track)
      })
      setStream(null)
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }

  const handleReady = () => {
    stopCamera()
    onReady()
  }

  const currentBlur = BLUR_LEVELS[selectedBlur]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl w-[90vw] h-[85vh] bg-background p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-center">카메라 테스트</DialogTitle>
          <p className="text-muted-foreground text-center text-sm">
            매칭 전에 카메라를 확인하고 블러 단계를 미리 체험해보세요
          </p>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* 왼쪽: Camera Preview */}
          <div className="flex-1 p-4 flex items-center justify-center min-w-0">
            <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden bg-[#2a2a2a]">
            {hasCamera === false ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <AlertCircle className="w-12 h-12 mb-4 text-destructive" />
                <p className="font-medium">카메라에 접근할 수 없습니다</p>
                <p className="text-sm text-muted-foreground mt-2">브라우저 설정에서 카메라 권한을 허용해주세요</p>
              </div>
            ) : (
              <>
                {/* Video element - 뷰티 필터가 없을 때는 직접 표시 */}
                {!beautyFilter.enabled ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover transition-all duration-500 -scale-x-100"
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
                  <>
                    {/* Hidden video for capture (뷰티 필터 사용 시) */}
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="hidden"
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
                    {/* Canvas with filters applied */}
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full object-cover transition-all duration-500 -scale-x-100"
                      style={{ filter: `blur(${currentBlur.level}px)` }}
                      width={640}
                      height={480}
                    />
                  </>
                )}
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
          <div className="w-[400px] border-l overflow-y-auto p-6 flex flex-col gap-4">
            {/* Blur Level Selector */}
            <div className="space-y-2 flex-shrink-0">
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
            <div className="flex gap-3 pt-2 border-t flex-shrink-0">
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
