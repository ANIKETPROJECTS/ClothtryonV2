import { useRef, useEffect, useState, useCallback } from "react";
import type { PoseKeypoints, SizeRecommendation, SizeChart, SizeKey } from "@shared/schema";

interface UsePoseDetectionOptions {
  onPoseDetected?: (keypoints: PoseKeypoints) => void;
  sizeChart?: SizeChart;
}

interface PoseDetectionResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isLoading: boolean;
  isTracking: boolean;
  error: string | null;
  keypoints: PoseKeypoints | null;
  sizeRecommendation: SizeRecommendation | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

const defaultSizeChart: SizeChart = {
  S: { shoulder: 42, chest: 96 },
  M: { shoulder: 44, chest: 102 },
  L: { shoulder: 46, chest: 108 },
  XL: { shoulder: 48, chest: 114 },
};

export function usePoseDetection(options: UsePoseDetectionOptions = {}): PoseDetectionResult {
  const { sizeChart = defaultSizeChart } = options;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keypoints, setKeypoints] = useState<PoseKeypoints | null>(null);
  const [sizeRecommendation, setSizeRecommendation] = useState<SizeRecommendation | null>(null);

  const calculateSizeRecommendation = useCallback(
    (kp: PoseKeypoints): SizeRecommendation => {
      const shoulderWidth = Math.abs(kp.rightShoulder.x - kp.leftShoulder.x) * 100;
      const chestWidth = shoulderWidth * 2.2;

      let recommendedSize: SizeKey = "M";
      let minDiff = Infinity;

      (Object.keys(sizeChart) as SizeKey[]).forEach((size) => {
        const diff = Math.abs(sizeChart[size].shoulder - shoulderWidth) +
                     Math.abs(sizeChart[size].chest - chestWidth);
        if (diff < minDiff) {
          minDiff = diff;
          recommendedSize = size;
        }
      });

      const visibility = Math.min(
        kp.leftShoulder.visibility,
        kp.rightShoulder.visibility,
        kp.leftHip.visibility,
        kp.rightHip.visibility
      );

      return {
        recommendedSize,
        shoulderWidth: Math.round(shoulderWidth),
        chestWidth: Math.round(chestWidth),
        confidence: visibility,
      };
    },
    [sizeChart]
  );

  const simulatePoseDetection = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const shoulderOffset = canvas.width * 0.15;
    const hipOffset = canvas.width * 0.12;
    const bodyHeight = canvas.height * 0.25;

    const time = Date.now() * 0.001;
    const breathOffset = Math.sin(time * 2) * 3;

    const simulatedKeypoints: PoseKeypoints = {
      leftShoulder: {
        x: (centerX - shoulderOffset) / canvas.width,
        y: (centerY - bodyHeight * 0.3 + breathOffset) / canvas.height,
        visibility: 0.95,
      },
      rightShoulder: {
        x: (centerX + shoulderOffset) / canvas.width,
        y: (centerY - bodyHeight * 0.3 + breathOffset) / canvas.height,
        visibility: 0.95,
      },
      leftHip: {
        x: (centerX - hipOffset) / canvas.width,
        y: (centerY + bodyHeight * 0.5) / canvas.height,
        visibility: 0.9,
      },
      rightHip: {
        x: (centerX + hipOffset) / canvas.width,
        y: (centerY + bodyHeight * 0.5) / canvas.height,
        visibility: 0.9,
      },
    };

    setKeypoints(simulatedKeypoints);
    
    const recommendation = calculateSizeRecommendation(simulatedKeypoints);
    setSizeRecommendation(recommendation);

    ctx.fillStyle = "rgba(59, 130, 246, 0.8)";
    const pointRadius = 6;
    
    Object.values(simulatedKeypoints).forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x * canvas.width, point.y * canvas.height, pointRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(simulatedKeypoints.leftShoulder.x * canvas.width, simulatedKeypoints.leftShoulder.y * canvas.height);
    ctx.lineTo(simulatedKeypoints.rightShoulder.x * canvas.width, simulatedKeypoints.rightShoulder.y * canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(simulatedKeypoints.leftHip.x * canvas.width, simulatedKeypoints.leftHip.y * canvas.height);
    ctx.lineTo(simulatedKeypoints.rightHip.x * canvas.width, simulatedKeypoints.rightHip.y * canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(simulatedKeypoints.leftShoulder.x * canvas.width, simulatedKeypoints.leftShoulder.y * canvas.height);
    ctx.lineTo(simulatedKeypoints.leftHip.x * canvas.width, simulatedKeypoints.leftHip.y * canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(simulatedKeypoints.rightShoulder.x * canvas.width, simulatedKeypoints.rightShoulder.y * canvas.height);
    ctx.lineTo(simulatedKeypoints.rightHip.x * canvas.width, simulatedKeypoints.rightHip.y * canvas.height);
    ctx.stroke();

    animationRef.current = requestAnimationFrame(simulatePoseDetection);
  }, [calculateSizeRecommendation]);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsTracking(true);
        simulatePoseDetection();
      }
    } catch (err) {
      setError("Unable to access camera. Please allow camera permissions.");
      console.error("Camera error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [simulatePoseDetection]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsTracking(false);
    setKeypoints(null);
    setSizeRecommendation(null);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    isLoading,
    isTracking,
    error,
    keypoints,
    sizeRecommendation,
    startCamera,
    stopCamera,
  };
}
