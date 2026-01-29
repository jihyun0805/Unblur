"use client"

import React, { useEffect, useRef } from 'react';
import { FilesetResolver, FaceLandmarker, FaceLandmarkerResult, NormalizedLandmark } from '@mediapipe/tasks-vision';

interface BeautyFilterProps {
  stream: MediaStream | null;
  blurLevel: number;
  smoothness: number;
  brightness: number;
  lipIntensity: number;
  underEyeIntensity: number;
  underEyeTone: number;
}

const FEATURE_INDICES = {
  lips: {
    upper: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191, 78, 62, 76],
    lower: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95],
  },
  underEyes: {
    right: [123, 117, 118, 101, 50, 205, 203, 165, 214, 192, 213, 147, 123],
    left: [352, 346, 347, 330, 280, 425, 423, 391, 434, 416, 433, 376, 352],
  },
} as const;

const FEATURE_STYLE = {
  lips: {
    blurPx: 4,
    blend: "multiply" as GlobalCompositeOperation,
  },
  underEyes: {
    blurPx: 10,
    blend: "screen" as GlobalCompositeOperation,
  }
} as const;

const LIMITS = {
  brightnessMin: 40,
  brightnessMax: 60,
  smoothnessMax: 60,
  lipMinAlpha: 0.05,
  lipMaxAlpha: 0.8,
  lipConfidenceThreshold: 0.55,
  underEyeMinAlpha: 0.05,
  underEyeMaxAlpha: 0.8,
} as const;

const BeautyFilter = ({
  stream,
  blurLevel,
  smoothness,
  brightness,
  lipIntensity,
  underEyeIntensity,
  underEyeTone,
}: BeautyFilterProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const isRenderingRef = useRef(false);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

  useEffect(() => {
    const initMediapipe = async () => {
      // WASM 파일 로드
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      // 모델 생성
      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numFaces: 1
      });

      startRenderLoop();
    };

    initMediapipe();

    // Cleanup: 컴포넌트가 언마운트될 때 실행
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      isRenderingRef.current = false;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current || !stream) return;

    videoRef.current.srcObject = stream;
    videoRef.current.onloadeddata = () => {
      startRenderLoop();
    };
    videoRef.current.play().catch(() => {
      // Autoplay may be blocked; render loop will start on loadeddata when possible.
    });
  }, [stream]);

  const startRenderLoop = () => {
    if (isRenderingRef.current) return;
    isRenderingRef.current = true;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // 비디오나 캔버스가 없으면 중단 (null check)
    if (!video || !canvas) {
      isRenderingRef.current = false;
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      isRenderingRef.current = false;
      return;
    }

    // 캔버스 크기 동기화
    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    if (video.readyState >= video.HAVE_METADATA && video.videoWidth > 0 && video.videoHeight > 0) {
      // 화면 초기화
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 기본 프레임 렌더
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const clampedBrightness = clamp(brightness, LIMITS.brightnessMin, LIMITS.brightnessMax);
      const clampedSmoothness = Math.min(smoothness, LIMITS.smoothnessMax);
      applySkinAndBrightness(ctx, canvas, clampedBrightness, clampedSmoothness);

      // 모델이 로드되었는지 확인
      if (faceLandmarkerRef.current) {
        const startTimeMs = performance.now();
        // detectForVideo는 TS에서 비디오 요소를 인자로 잘 받습니다.
        const result: FaceLandmarkerResult = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);

        if (result.faceLandmarks) {
          for (const landmarks of result.faceLandmarks) {
            if (shouldRenderFeature(landmarks, FEATURE_INDICES.lips.upper, LIMITS.lipConfidenceThreshold)) {
              drawFeature(
                ctx,
                landmarks,
                FEATURE_INDICES.lips.upper,
                canvas.width,
                canvas.height,
                buildLipStyle(lipIntensity)
              );
              drawFeature(
                ctx,
                landmarks,
                FEATURE_INDICES.lips.lower,
                canvas.width,
                canvas.height,
                buildLipStyle(lipIntensity)
              );
            }
            if (shouldRenderFeature(landmarks, FEATURE_INDICES.underEyes.right, LIMITS.lipConfidenceThreshold)) {
              drawFeature(
                ctx,
                landmarks,
                FEATURE_INDICES.underEyes.right,
                canvas.width,
                canvas.height,
                buildUnderEyesStyle(underEyeIntensity, underEyeTone)
              );
              drawFeature(
                ctx,
                landmarks,
                FEATURE_INDICES.underEyes.left,
                canvas.width,
                canvas.height,
                buildUnderEyesStyle(underEyeIntensity, underEyeTone)
              );
            }
          }
        }
      }
    }

    requestRef.current = requestAnimationFrame(() => {
      isRenderingRef.current = false;
      startRenderLoop();
    });
  };

  const applySkinAndBrightness = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    brightnessValue: number,
    smoothnessValue: number
  ) => {
    const normalizedBrightness = (brightnessValue - 50) * 2;
    ctx.filter = `brightness(${100 + normalizedBrightness}%)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = "none";

    if (smoothnessValue > 30) {
      ctx.globalAlpha = smoothnessValue / 200;
      ctx.filter = `blur(${smoothnessValue / 25}px)`;
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = "none";
      ctx.globalAlpha = 1;
    }
  };

  const buildLipStyle = (intensity: number) => {
    const ratio = clamp(intensity, 0, 100) / 100;
    const alpha = LIMITS.lipMinAlpha + (LIMITS.lipMaxAlpha - LIMITS.lipMinAlpha) * ratio;
    return {
      ...FEATURE_STYLE.lips,
      color: `rgba(255, 105, 135, ${alpha})`,
    };
  };

  const buildUnderEyesStyle = (intensity: number, tone: number) => {
    const ratio = clamp(intensity, 0, 100) / 100;
    const alpha = LIMITS.underEyeMinAlpha + (LIMITS.underEyeMaxAlpha - LIMITS.underEyeMinAlpha) * ratio;
    const toneRatio = clamp(tone, 0, 100) / 100;
    const warm = { r: 255, g: 235, b: 210 };
    const cool = { r: 220, g: 230, b: 255 };
    const r = Math.round(warm.r + (cool.r - warm.r) * toneRatio);
    const g = Math.round(warm.g + (cool.g - warm.g) * toneRatio);
    const b = Math.round(warm.b + (cool.b - warm.b) * toneRatio);
    return {
        ...FEATURE_STYLE.underEyes,
        color: `rgba(${r}, ${g}, ${b}, ${alpha})`,
    };
  };

  const shouldRenderFeature = (
    landmarks: NormalizedLandmark[],
    indices: readonly number[],
    threshold: number
  ) => {
    let sum = 0;
    let count = 0;

    for (const index of indices) {
      const point = landmarks[index];
      if (!point) continue;
      const visibility = typeof point.visibility === "number" ? point.visibility : 1;
      sum += visibility;
      count += 1;
    }

    if (count === 0) return false;
    return sum / count >= threshold;
  };

  const clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
  };

  const drawFeature = (
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    indices: readonly number[] | number[],
    width: number,
    height: number,
    style: { color: string; blurPx: number; blend: GlobalCompositeOperation }
  ) => {
    ctx.beginPath();
    
    const firstIndex = indices[0];
    const startPoint = landmarks[firstIndex];
    
    if (!startPoint) return;

    ctx.moveTo(startPoint.x * width, startPoint.y * height);

    for (let i = 1; i < indices.length; i++) {
      const index = indices[i];
      const point = landmarks[index];
      if (point) {
        ctx.lineTo(point.x * width, point.y * height);
      }
    }
    
    ctx.closePath();
    
    ctx.fillStyle = style.color;
    ctx.globalCompositeOperation = style.blend;
    ctx.filter = `blur(${style.blurPx}px)`;
    ctx.fill();
    
    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-over";
  };

  return (
    <div className="w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
      />
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover transition-all duration-500 -scale-x-100"
        style={{ filter: `blur(${blurLevel}px)` }}
      />
    </div>
  );
};

export default BeautyFilter;
