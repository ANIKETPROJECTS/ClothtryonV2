import { useRef, useEffect, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import type { PoseKeypoints, SizeRecommendation, SizeChart, SizeKey } from "@shared/schema";

interface UsePoseDetectionOptions {
  onPoseDetected?: (keypoints: PoseKeypoints) => void;
  sizeChart?: SizeChart;
}

interface BodyBounds {
  leftShoulderX: number;
  leftShoulderY: number;
  rightShoulderX: number;
  rightShoulderY: number;
  leftHipX: number;
  leftHipY: number;
  rightHipX: number;
  rightHipY: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation: number;
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

const SMOOTHING_FACTOR = 0.25;

function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

function lerpAngle(current: number, target: number, factor: number): number {
  let diff = target - current;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return current + diff * factor;
}

function smoothBounds(current: BodyBounds | null, target: BodyBounds): BodyBounds {
  if (!current) return target;
  
  return {
    leftShoulderX: lerp(current.leftShoulderX, target.leftShoulderX, SMOOTHING_FACTOR),
    leftShoulderY: lerp(current.leftShoulderY, target.leftShoulderY, SMOOTHING_FACTOR),
    rightShoulderX: lerp(current.rightShoulderX, target.rightShoulderX, SMOOTHING_FACTOR),
    rightShoulderY: lerp(current.rightShoulderY, target.rightShoulderY, SMOOTHING_FACTOR),
    leftHipX: lerp(current.leftHipX, target.leftHipX, SMOOTHING_FACTOR),
    leftHipY: lerp(current.leftHipY, target.leftHipY, SMOOTHING_FACTOR),
    rightHipX: lerp(current.rightHipX, target.rightHipX, SMOOTHING_FACTOR),
    rightHipY: lerp(current.rightHipY, target.rightHipY, SMOOTHING_FACTOR),
    centerX: lerp(current.centerX, target.centerX, SMOOTHING_FACTOR),
    centerY: lerp(current.centerY, target.centerY, SMOOTHING_FACTOR),
    width: lerp(current.width, target.width, SMOOTHING_FACTOR),
    height: lerp(current.height, target.height, SMOOTHING_FACTOR),
    rotation: lerpAngle(current.rotation, target.rotation, SMOOTHING_FACTOR),
  };
}

export function usePoseDetection(options: UsePoseDetectionOptions = {}): PoseDetectionResult {
  const { sizeChart = defaultSizeChart } = options;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const smoothedBoundsRef = useRef<BodyBounds | null>(null);
  
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

          const lsX = leftShoulder.x * canvas.width;
          const lsY = leftShoulder.y * canvas.height;
          const rsX = rightShoulder.x * canvas.width;
          const rsY = rightShoulder.y * canvas.height;
          const lhX = leftHip.x * canvas.width;
          const lhY = leftHip.y * canvas.height;
          const rhX = rightHip.x * canvas.width;
          const rhY = rightHip.y * canvas.height;

          const shoulderAngle = Math.atan2(rsY - lsY, rsX - lsX);
          const hipAngle = Math.atan2(rhY - lhY, rhX - lhX);
          const avgRotation = (shoulderAngle + hipAngle) / 2;

          const shoulderCenterX = (lsX + rsX) / 2;
          const shoulderCenterY = (lsY + rsY) / 2;
          const hipCenterX = (lhX + rhX) / 2;
          const hipCenterY = (lhY + rhY) / 2;

          const centerX = (shoulderCenterX + hipCenterX) / 2;
          const centerY = (shoulderCenterY + hipCenterY) / 2;

          const shoulderWidth = Math.sqrt(Math.pow(rsX - lsX, 2) + Math.pow(rsY - lsY, 2));
          const torsoHeight = Math.sqrt(Math.pow(hipCenterX - shoulderCenterX, 2) + Math.pow(hipCenterY - shoulderCenterY, 2));

          const clothWidth = shoulderWidth * 2.5;
          const clothHeight = torsoHeight * 1.7;

          const expandFactor = 0.4;
          const shoulderExpandX = (rsX - lsX) * expandFactor;
          const hipExpandX = (rhX - lhX) * expandFactor;

          const rawBounds: BodyBounds = {
            leftShoulderX: lsX - shoulderExpandX,
            leftShoulderY: lsY,
            rightShoulderX: rsX + shoulderExpandX,
            rightShoulderY: rsY,
            leftHipX: lhX - hipExpandX,
            leftHipY: lhY,
            rightHipX: rhX + hipExpandX,
            rightHipY: rhY,
            centerX: centerX,
            centerY: centerY,
            width: clothWidth,
            height: clothHeight,
            rotation: avgRotation,
          };

          const smoothed = smoothBounds(smoothedBoundsRef.current, rawBounds);
          smoothedBoundsRef.current = smoothed;
          setBodyBounds(smoothed);

          ctx.fillStyle = "rgba(34, 197, 94, 0.9)";
          const pointRadius = 24;
          
          [
            { x: smoothed.leftShoulderX, y: smoothed.leftShoulderY },
            { x: smoothed.rightShoulderX, y: smoothed.rightShoulderY },
            { x: smoothed.leftHipX, y: smoothed.leftHipY },
            { x: smoothed.rightHipX, y: smoothed.rightHipY },
          ].forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, pointRadius, 0, Math.PI * 2);
            ctx.fill();
          });

          ctx.strokeStyle = "rgba(34, 197, 94, 0.8)";
          ctx.lineWidth = 8;
          
          ctx.beginPath();
          ctx.moveTo(smoothed.leftShoulderX, smoothed.leftShoulderY);
          ctx.lineTo(smoothed.rightShoulderX, smoothed.rightShoulderY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(smoothed.leftHipX, smoothed.leftHipY);
          ctx.lineTo(smoothed.rightHipX, smoothed.rightHipY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(smoothed.leftShoulderX, smoothed.leftShoulderY);
          ctx.lineTo(smoothed.leftHipX, smoothed.leftHipY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(smoothed.rightShoulderX, smoothed.rightShoulderY);
          ctx.lineTo(smoothed.rightHipX, smoothed.rightHipY);
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
    smoothedBoundsRef.current = null;
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
