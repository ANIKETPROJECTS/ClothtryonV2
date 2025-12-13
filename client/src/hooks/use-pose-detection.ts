import { useRef, useEffect, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import type { PoseKeypoints, SizeRecommendation, SizeChart, SizeKey } from "@shared/schema";

interface UsePoseDetectionOptions {
  onPoseDetected?: (keypoints: PoseKeypoints) => void;
  sizeChart?: SizeChart;
}

interface BodyBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  shoulderY: number;
  hipY: number;
}

interface PoseDetectionResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isLoading: boolean;
  isTracking: boolean;
  error: string | null;
  keypoints: PoseKeypoints | null;
  bodyBounds: BodyBounds | null;
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
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keypoints, setKeypoints] = useState<PoseKeypoints | null>(null);
  const [bodyBounds, setBodyBounds] = useState<BodyBounds | null>(null);
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

  const initializeDetector = useCallback(async () => {
    await tf.ready();
    await tf.setBackend("webgl");
    
    const model = poseDetection.SupportedModels.MoveNet;
    const detectorConfig: poseDetection.MoveNetModelConfig = {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true,
    };
    
    detectorRef.current = await poseDetection.createDetector(model, detectorConfig);
  }, []);

  const runPoseDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !detectorRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (video.readyState < 2) {
      animationRef.current = requestAnimationFrame(runPoseDetection);
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
      const poses = await detectorRef.current.estimatePoses(video);
      
      if (poses.length > 0 && poses[0].keypoints) {
        const kp = poses[0].keypoints;
        
        const getKeypoint = (name: string) => {
          const point = kp.find((p) => p.name === name);
          return point ? { 
            x: point.x / canvas.width, 
            y: point.y / canvas.height, 
            visibility: point.score || 0 
          } : { x: 0.5, y: 0.5, visibility: 0 };
        };

        const leftShoulder = getKeypoint("left_shoulder");
        const rightShoulder = getKeypoint("right_shoulder");
        const leftHip = getKeypoint("left_hip");
        const rightHip = getKeypoint("right_hip");

        const minVisibility = 0.3;
        if (
          leftShoulder.visibility > minVisibility &&
          rightShoulder.visibility > minVisibility &&
          leftHip.visibility > minVisibility &&
          rightHip.visibility > minVisibility
        ) {
          const detectedKeypoints: PoseKeypoints = {
            leftShoulder,
            rightShoulder,
            leftHip,
            rightHip,
          };

          setKeypoints(detectedKeypoints);
          
          const recommendation = calculateSizeRecommendation(detectedKeypoints);
          setSizeRecommendation(recommendation);

          const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x) * canvas.width;
          const shoulderCenterX = ((leftShoulder.x + rightShoulder.x) / 2) * canvas.width;
          const shoulderY = ((leftShoulder.y + rightShoulder.y) / 2) * canvas.height;
          const hipY = ((leftHip.y + rightHip.y) / 2) * canvas.height;
          const torsoHeight = hipY - shoulderY;

          const padding = shoulderWidth * 0.3;
          const bounds: BodyBounds = {
            x: shoulderCenterX - shoulderWidth / 2 - padding,
            y: shoulderY - padding * 0.5,
            width: shoulderWidth + padding * 2,
            height: torsoHeight + padding * 1.5,
            shoulderY: shoulderY,
            hipY: hipY,
          };
          setBodyBounds(bounds);

          ctx.fillStyle = "rgba(34, 197, 94, 0.8)";
          const pointRadius = 8;
          
          [leftShoulder, rightShoulder, leftHip, rightHip].forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x * canvas.width, point.y * canvas.height, pointRadius, 0, Math.PI * 2);
            ctx.fill();
          });

          ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
          ctx.lineWidth = 3;
          
          ctx.beginPath();
          ctx.moveTo(leftShoulder.x * canvas.width, leftShoulder.y * canvas.height);
          ctx.lineTo(rightShoulder.x * canvas.width, rightShoulder.y * canvas.height);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(leftHip.x * canvas.width, leftHip.y * canvas.height);
          ctx.lineTo(rightHip.x * canvas.width, rightHip.y * canvas.height);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(leftShoulder.x * canvas.width, leftShoulder.y * canvas.height);
          ctx.lineTo(leftHip.x * canvas.width, leftHip.y * canvas.height);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(rightShoulder.x * canvas.width, rightShoulder.y * canvas.height);
          ctx.lineTo(rightHip.x * canvas.width, rightHip.y * canvas.height);
          ctx.stroke();
        }
      }
    } catch (err) {
      console.error("Pose detection error:", err);
    }

    animationRef.current = requestAnimationFrame(runPoseDetection);
  }, [calculateSizeRecommendation]);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await initializeDetector();

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
        runPoseDetection();
      }
    } catch (err) {
      setError("Unable to access camera or load pose detection model. Please allow camera permissions and try again.");
      console.error("Camera/Model error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [initializeDetector, runPoseDetection]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (detectorRef.current) {
      detectorRef.current.dispose();
      detectorRef.current = null;
    }
    setIsTracking(false);
    setKeypoints(null);
    setBodyBounds(null);
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
    bodyBounds,
    sizeRecommendation,
    startCamera,
    stopCamera,
  };
}
