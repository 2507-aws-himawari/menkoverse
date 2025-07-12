import { useState, useCallback } from 'react';
import type { DetectedMarker, MarkerDetectionOptions } from '../types';

export const useArUcoDetector = (videoElement: HTMLVideoElement | null) => {
  const [detectedMarkers, setDetectedMarkers] = useState<DetectedMarker[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(true); // 常に初期化済みとする

  // 検出オプション更新
  const updateOptions = useCallback((newOptions: Partial<MarkerDetectionOptions>) => {
    // 現在は何もしない（将来的に拡張可能）
    console.log('Detection options updated:', newOptions);
  }, []);

  // 手動検出実行
  const startDetection = useCallback(async () => {
    if (!videoElement || isDetecting) return;

    setIsDetecting(true);
    setError(null);

    try {
      // 仮の検出結果を返す（テスト用）
      const mockMarkers: DetectedMarker[] = [
        {
          id: 0,
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          confidence: 0.8,
          timestamp: Date.now(),
        },
      ];

      setDetectedMarkers(mockMarkers);
      console.log('Mock marker detection completed:', mockMarkers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '検出に失敗しました';
      setError(errorMessage);
      console.error('Detection error:', err);
    } finally {
      setIsDetecting(false);
    }
  }, [videoElement, isDetecting]);

  // 検出停止
  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    setDetectedMarkers([]);
    console.log('Detection stopped');
  }, []);

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
