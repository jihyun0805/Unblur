"use client";

import React, { useEffect, useRef } from "react";
import {
  FilesetResolver,
  FaceLandmarker,
  FaceLandmarkerResult,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";

interface BeautyFilterProps {
  stream: MediaStream | null;
  blurLevel: number;    // 블라인드 처리용 (전체 블러)
  smoothness: number;   // 피부 보정 강도 (0 ~ 100)
  lipIntensity: number; // 입술 색상 강도 (0 ~ 100)
}

const FEATURE_INDICES = {
  lips: {
    upper: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191, 78, 62, 76],
    lower: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95],
  },
  faceOval: {
    outline: [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
      397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
      172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
    ],
  },
  exclude: {
    leftEye: [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7],
    rightEye: [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382],
    nose: [1, 2, 98, 327, 279, 360, 437, 217, 131, 49],
  }
} as const;

const HIGHLIGHT_INDICES = {
  leftCheek: [116, 123, 147, 213, 192, 214, 210, 127, 34, 143, 156], 
  rightCheek: [345, 352, 376, 433, 416, 434, 430, 356, 264, 372, 383] 
};

const ANATOMY_INDICES = {
  noseTip: 1,
  upperLipTop: 13,
  chin: 152,
  leftEye: 33,
  rightEye: 263,
  mouthLeft: 61,
  mouthRight: 291
};

const FEATURE_STYLE = {
  lips: {
    blurPx: 2,
    blend: "source-over" as GlobalCompositeOperation,
  },
} as const;

const LIMITS = {
  smoothnessMax: 100,
  lipMinAlpha: 0.1,
  lipMaxAlpha: 0.4,
  lipConfidenceThreshold: 0.75,
} as const;

const BeautyFilter = ({
  stream,
  blurLevel,
  smoothness,
  lipIntensity,
}: BeautyFilterProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const isRenderingRef = useRef(false);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Refs for Props (Closure 문제 해결)
  const paramsRef = useRef({ smoothness, lipIntensity });

  useEffect(() => {
    paramsRef.current = { smoothness, lipIntensity };
  }, [smoothness, lipIntensity]);

  useEffect(() => {
    const initMediapipe = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
      });

      startRenderLoop();
    };

    initMediapipe();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      isRenderingRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current || !stream) return;
    videoRef.current.srcObject = stream;
    videoRef.current.onloadeddata = () => startRenderLoop();
    videoRef.current.play().catch(() => {});
  }, [stream]);

  const startRenderLoop = () => {
    if (isRenderingRef.current) return;
    isRenderingRef.current = true;

    const render = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
        requestRef.current = requestAnimationFrame(render);
        return;
      }

      // willReadFrequently: true는 픽셀 데이터를 자주 읽을 때 성능 최적화
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // 1. 캔버스 초기화
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 2. 원본 비디오 그리기 (Base Layer)
      ctx.save();
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // 3. 뷰티 필터 적용 (Landmark 존재 시)
      if (faceLandmarkerRef.current) {
        const startTimeMs = performance.now();
        const result = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);

        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          const landmarks = result.faceLandmarks[0];
          const { smoothness, lipIntensity } = paramsRef.current;

          // 피부 보정 적용
          if (smoothness > 0) {
            applySkinAndBrightness(ctx, video, canvas, landmarks, smoothness);
          }

          // 입술 색상 적용
          if (lipIntensity > 0) {
              // 1. 기존 기하학적 체크 (화면 이탈, 비정상 비율 감지)
              const lipGeomOk = checkVisibility(landmarks, FEATURE_INDICES.lips.upper);

              // 2. 픽셀 기반 가림 체크 (손으로 입 가림 감지)
              let lipPixelOk = false;

              if (lipGeomOk) {
                // ⚠️ 튜닝 포인트: 150 ~ 250 사이 (기본 180)
                const PIXEL_THRESHOLD = 180;

                const upperPixelVisible = isLipActuallyVisibleByPixels(
                  ctx,
                  landmarks,
                  FEATURE_INDICES.lips.upper,
                  canvas.width,
                  canvas.height,
                  PIXEL_THRESHOLD
                );
                const lowerPixelVisible = isLipActuallyVisibleByPixels(
                  ctx,
                  landmarks,
                  FEATURE_INDICES.lips.lower,
                  canvas.width,
                  canvas.height,
                  PIXEL_THRESHOLD
                );

                // 상단/하단 입술 중 하나라도 '실제로(픽셀상)' 보이면 OK
                lipPixelOk = upperPixelVisible || lowerPixelVisible;
              }

              // 3. 두 조건(형태 정상 + 픽셀 노출)이 모두 맞을 때만 그림
              if (lipGeomOk && lipPixelOk) {
                const lipStyle = buildLipStyle(lipIntensity);
                
                // 윗입술
                drawFeature(
                  ctx, landmarks, FEATURE_INDICES.lips.upper,
                  canvas.width, canvas.height, lipStyle
                );
                // 아랫입술
                drawFeature(
                  ctx, landmarks, FEATURE_INDICES.lips.lower,
                  canvas.width, canvas.height, lipStyle
                );
              }
           }
        }
      }

      requestRef.current = requestAnimationFrame(render);
    };

    render();
  };

  // ✅ [수정됨] 이 함수는 scratchCanvasRef를 사용하므로 컴포넌트 내부에 있어야 함
  const applySkinAndBrightness = (
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    landmarks: NormalizedLandmark[],
    smoothnessValue: number
  ) => {
    if (!landmarks || landmarks.length === 0) return;

    const intensity = (clamp(smoothnessValue, 0, 100) * 0.5) / 100;
    
    const blurAmount = 4 + (intensity * 6);
    const edgeSoftness = 6 + (intensity * 6);
    const brightnessVal = 1.5 + (intensity * 0.3);
    const saturateVal = 0.6 + (intensity * 0.1);

    if (!scratchCanvasRef.current) {
      scratchCanvasRef.current = document.createElement("canvas");
    }
    const scratch = scratchCanvasRef.current;
    if (scratch.width !== canvas.width || scratch.height !== canvas.height) {
      scratch.width = canvas.width;
      scratch.height = canvas.height;
    }
    const scratchCtx = scratch.getContext("2d", { willReadFrequently: true });
    if (!scratchCtx) return;

    scratchCtx.save();
    scratchCtx.clearRect(0, 0, scratch.width, scratch.height);
    scratchCtx.filter = `blur(${blurAmount}px) brightness(${brightnessVal}) saturate(${saturateVal})`;
    scratchCtx.drawImage(video, 0, 0, scratch.width, scratch.height);
    scratchCtx.filter = "none";

    scratchCtx.globalCompositeOperation = "destination-in";
    scratchCtx.beginPath();
    if (!buildPath(scratchCtx, landmarks, FEATURE_INDICES.faceOval.outline, scratch.width, scratch.height)) {
      scratchCtx.restore();
      return;
    }
    scratchCtx.closePath();

    scratchCtx.fillStyle = "black";
    scratchCtx.filter = `blur(${edgeSoftness}px)`;
    scratchCtx.fill();
    scratchCtx.restore();

    ctx.save();
    ctx.globalAlpha = 0.3 + (intensity * 0.3);
    ctx.globalCompositeOperation = "soft-light"; 
    ctx.drawImage(scratch, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    const cheekIndices = [
      ...HIGHLIGHT_INDICES.leftCheek,
      ...HIGHLIGHT_INDICES.rightCheek
    ];
    if (buildPath(ctx, landmarks, cheekIndices, canvas.width, canvas.height)) {
        ctx.closePath();
        ctx.filter = "blur(12px)"; 
        ctx.globalCompositeOperation = "screen"; 
        ctx.fillStyle = "rgba(255, 220, 205, 0.6)"; 
        ctx.globalAlpha = 0.2 + (intensity * 0.2); 
        ctx.fill();
    }
    ctx.restore();
  };

  return (
    <div className="w-full h-full relative">
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

// ==========================================================
// ✅ [외부 Helper 함수들]
// 아래 함수들은 컴포넌트의 state나 ref에 의존하지 않는 
// '순수 함수'들이므로 컴포넌트 바깥(아래)에 두는 것이 성능상 좋습니다.
// ==========================================================

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const buildLipStyle = (intensity: number) => {
  const ratio = clamp(intensity, 0, 100) / 100;
  const alpha = LIMITS.lipMinAlpha + (LIMITS.lipMaxAlpha - LIMITS.lipMinAlpha) * ratio;
  return {
    ...FEATURE_STYLE.lips,
    color: "rgb(200, 60, 80)",
    opacity: alpha,
    blend: "soft-light" as GlobalCompositeOperation,
    blurPx: 3, 
  };
};

const buildPath = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  indices: readonly number[] | number[],
  width: number,
  height: number
) => {
  const firstPoint = landmarks[indices[0]];
  if (!firstPoint) return false;

  ctx.beginPath();
  ctx.moveTo(firstPoint.x * width, firstPoint.y * height);
  for (let i = 1; i < indices.length; i++) {
    const point = landmarks[indices[i]];
    if (point) ctx.lineTo(point.x * width, point.y * height);
  }
  ctx.closePath();
  return true;
};

const drawFeature = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  indices: readonly number[] | number[],
  width: number,
  height: number,
  style: { color: string; opacity: number; blurPx: number; blend: GlobalCompositeOperation }
) => {
  if (!buildPath(ctx, landmarks, indices, width, height)) return;

  ctx.save(); 
  ctx.globalAlpha = style.opacity;
  ctx.globalCompositeOperation = style.blend;
  ctx.fillStyle = style.color;
  if (style.blurPx > 0) {
    ctx.filter = `blur(${style.blurPx}px)`;
  }
  ctx.fill();
  ctx.restore();
};

const checkVisibility = (landmarks: NormalizedLandmark[], indices: readonly number[]) => {
  if (!landmarks || landmarks.length === 0) return false;

  const nose = landmarks[ANATOMY_INDICES.noseTip];
  const lipTop = landmarks[ANATOMY_INDICES.upperLipTop];
  const chin = landmarks[ANATOMY_INDICES.chin];
  const leftEye = landmarks[ANATOMY_INDICES.leftEye];
  const rightEye = landmarks[ANATOMY_INDICES.rightEye];
  const mouthLeft = landmarks[ANATOMY_INDICES.mouthLeft];
  const mouthRight = landmarks[ANATOMY_INDICES.mouthRight];

  if (!nose || !lipTop || !chin || !leftEye || !rightEye || !mouthLeft || !mouthRight) return false;

  if (nose.y >= lipTop.y) return false; 
  const lowerFaceHeight = Math.abs(chin.y - nose.y);
  const philtrumHeight = Math.abs(lipTop.y - nose.y);

  if (philtrumHeight < lowerFaceHeight * 0.05) return false;

  const eyeDistance = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
  const mouthWidth = Math.hypot(mouthRight.x - mouthLeft.x, mouthRight.y - mouthLeft.y);

  if (mouthWidth > eyeDistance * 3.0) return false;
  if (mouthWidth < eyeDistance * 0.2) return false;

  if (nose.x < 0 || nose.x > 1 || nose.y < 0 || nose.y > 1) return false;
  if (mouthWidth < 0.02) return false;

  return true;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const getBBoxFromIndices = (
  landmarks: NormalizedLandmark[],
  indices: readonly number[] | number[]
) => {
  if (!landmarks || landmarks.length === 0) return null;

  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  let validCount = 0;

  for (const i of indices) {
    const p = landmarks[i];
    if (!p) continue;
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
    validCount++;
  }

  if (validCount < indices.length * 0.7) return null;

  const padX = (maxX - minX) * 0.35;
  const padY = (maxY - minY) * 0.60;

  return {
    x0: clamp01(minX - padX),
    y0: clamp01(minY - padY),
    x1: clamp01(maxX + padX),
    y1: clamp01(maxY + padY),
  };
};

const varianceLuma = (imgData: Uint8ClampedArray) => {
  let n = 0;
  let mean = 0;
  let m2 = 0;

  const step = 4 * 4; 

  for (let i = 0; i < imgData.length; i += step) {
    const r = imgData[i];
    const g = imgData[i + 1];
    const b = imgData[i + 2];
    
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    n++;
    const delta = l - mean;
    mean += delta / n;
    m2 += delta * (l - mean);
  }

  return n > 1 ? m2 / (n - 1) : 0;
};

const isLipActuallyVisibleByPixels = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  indices: readonly number[] | number[],
  canvasWidth: number,
  canvasHeight: number,
  threshold: number = 180
) => {
  const bb = getBBoxFromIndices(landmarks, indices);
  if (!bb) return false;

  const x = Math.floor(bb.x0 * canvasWidth);
  const y = Math.floor(bb.y0 * canvasHeight);
  const rw = Math.floor((bb.x1 - bb.x0) * canvasWidth);
  const rh = Math.floor((bb.y1 - bb.y0) * canvasHeight);

  if (rw < 8 || rh < 8) return false;

  try {
    const data = ctx.getImageData(x, y, rw, rh).data;
    const v = varianceLuma(data);
    return v > threshold;
  } catch (e) {
    return true; 
  }
};
