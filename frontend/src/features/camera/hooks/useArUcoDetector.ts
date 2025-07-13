import { useState, useCallback } from 'react';
import type { DetectedMarker, MarkerDetectionOptions, OpenCVDetectedMarker } from '../types';
import { openCVClient } from '../libs/opencv-client';

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

  // OpenCV検出結果をフロントエンド形式に変換
  const convertOpenCVToDetectedMarkers = useCallback((openCVMarkers: OpenCVDetectedMarker[]): DetectedMarker[] => {
    return openCVMarkers.map(marker => {
      // corners から中心位置を計算
      const corners = marker.corners;
      const centerX = corners.reduce((sum, corner) => sum + (corner[0] || 0), 0) / corners.length;
      const centerY = corners.reduce((sum, corner) => sum + (corner[1] || 0), 0) / corners.length;

      return {
        id: marker.id,
        position: { 
          x: centerX - 320, // 画面中心を0とするため調整
          y: centerY - 240, // 画面中心を0とするため調整
          z: 0 
        },
        rotation: { x: 0, y: 0, z: 0 }, // 簡易実装では回転情報は使用しない
        confidence: marker.confidence,
        timestamp: Date.now(),
      };
    });
  }, []);

  // 手動検出実行
  const startDetection = useCallback(async () => {
    if (!videoElement || isDetecting) return;

    setIsDetecting(true);
    setError(null);

    try {
      // Video要素からフレームキャプチャしてOpenCV APIで検出
      console.log('Starting OpenCV marker detection...');
      const result = await openCVClient.detectMarkersFromVideo(videoElement);
      
      console.log('OpenCV detection result:', result);
      
      // 検出結果を変換
      const convertedMarkers = convertOpenCVToDetectedMarkers(result.detected_markers);
      setDetectedMarkers(convertedMarkers);
      
      console.log('Converted markers:', convertedMarkers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '検出に失敗しました';
      setError(errorMessage);
      console.error('Detection error:', err);
    } finally {
      setIsDetecting(false);
    }
  }, [videoElement, isDetecting, convertOpenCVToDetectedMarkers]);

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
