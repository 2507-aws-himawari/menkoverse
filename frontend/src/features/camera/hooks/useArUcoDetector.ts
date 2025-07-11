import { useState, useEffect, useRef, useCallback } from 'react';
import type { DetectedMarker, MarkerDetectionOptions } from '../types';
import { createMarkerDetector } from '../libs/marker-detector';

export const useArUcoDetector = (videoElement: HTMLVideoElement | null) => {
  const [detectedMarkers, setDetectedMarkers] = useState<DetectedMarker[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const detectorRef = useRef(createMarkerDetector());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const optionsRef = useRef<MarkerDetectionOptions>({
    enabled: true,
    sensitivity: 0.5,
    frameRate: 15, // バッテリー消費を考慮して低めに設定
  });

  // 検出オプション更新
  const updateOptions = useCallback((newOptions: Partial<MarkerDetectionOptions>) => {
    optionsRef.current = { ...optionsRef.current, ...newOptions };
  }, []);

  // 初期化
  const initialize = useCallback(async () => {
    if (!videoElement) {
      console.warn('video element is not ready');
      return;
    };

    if (isInitialized) {
      console.warn('ArUco detector is already initialized');
      return;
    }

    try {
      setError(null);
      
      // 非表示のCanvasを作成（検出処理用）
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
        canvasRef.current.style.display = 'none';
        document.body.appendChild(canvasRef.current);
      }

      await detectorRef.current.initialize(
        canvasRef.current,
        videoElement,
        optionsRef.current
      );

      setIsInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ArUco検出器の初期化に失敗しました';
      setError(errorMessage);
      console.error('ArUco detector initialization failed:', err);
    }
  }, [videoElement, isInitialized]);

  // 検出開始
  const startDetection = useCallback(() => {
    if (!isInitialized || !videoElement || isDetecting) return;

    try {
      setError(null);
      setIsDetecting(true);

      detectorRef.current.startDetection(
        videoElement,
        (markers) => {
          setDetectedMarkers(markers);
        },
        optionsRef.current
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '検出の開始に失敗しました';
      setError(errorMessage);
      setIsDetecting(false);
    }
  }, [isInitialized, videoElement, isDetecting]);

  // 検出停止
  const stopDetection = useCallback(() => {
    if (!isDetecting) return;

    detectorRef.current.stopDetection();
    setIsDetecting(false);
    setDetectedMarkers([]);
  }, [isDetecting]);

  // 自動初期化・開始
  useEffect(() => {
    if (videoElement && optionsRef.current.enabled) {
      initialize();
    }
  }, [videoElement, initialize]);

  useEffect(() => {
    if (isInitialized && optionsRef.current.enabled && !isDetecting) {
      startDetection();
    } else if (!optionsRef.current.enabled && isDetecting) {
      stopDetection();
    }
  }, [isInitialized, startDetection, stopDetection, isDetecting]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (isDetecting) {
        detectorRef.current.stopDetection();
      }
      detectorRef.current.cleanup();
      
      if (canvasRef.current) {
        document.body.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
    };
  }, [isDetecting]);

  return {
    detectedMarkers,
    isDetecting,
    isInitialized,
    error,
    startDetection,
    stopDetection,
    updateOptions,
  };
};
