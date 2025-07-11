import React from 'react';
import { useCameraStream } from '../hooks/useCameraStream';
import { useArUcoDetector } from '../hooks/useArUcoDetector';
import { MarkerDetectionOverlay } from './MarkerDetectionOverlay';
import type { CameraStreamOptions, DetectedMarker, MarkerDetectionOptions } from '../types';

interface CameraWithMarkerDetectionProps {
  deviceId?: string;
  width?: number;
  height?: number;
  onStreamReady?: (stream: MediaStream) => void;
  onMarkersDetected?: (markers: DetectedMarker[]) => void;
  markerDetectionEnabled?: boolean;
  markerDetectionOptions?: Partial<MarkerDetectionOptions>;
  className?: string;
}

export const CameraWithMarkerDetection: React.FC<CameraWithMarkerDetectionProps> = ({
  deviceId,
  width = 640,
  height = 480,
  onStreamReady,
  onMarkersDetected,
  markerDetectionEnabled = true,
  markerDetectionOptions = {},
  className = '',
}) => {
  const { videoRef, isStreaming, error: streamError, startStream, stopStream } = useCameraStream();
  
  // マーカー検出Hook
  const {
    detectedMarkers,
    isDetecting,
    error: detectionError,
    updateOptions,
  } = useArUcoDetector(videoRef.current);

  // カメラストリーム開始
  React.useEffect(() => {
    const options: CameraStreamOptions = {
      deviceId,
      width,
      height,
    };
    startStream(options);

    return () => stopStream();
  }, [deviceId, width, height]);

  // ストリーム準備完了時
  React.useEffect(() => {
    if (isStreaming && videoRef.current?.srcObject && onStreamReady) {
      onStreamReady(videoRef.current.srcObject as MediaStream);
    }
  }, [isStreaming, onStreamReady]);

  // マーカー検出結果の通知
  React.useEffect(() => {
    if (detectedMarkers.length > 0 && onMarkersDetected) {
      onMarkersDetected(detectedMarkers);
    }
  }, [detectedMarkers, onMarkersDetected]);

  // マーカー検出オプション更新
  React.useEffect(() => {
    const options: MarkerDetectionOptions = {
      enabled: markerDetectionEnabled,
      sensitivity: 0.5,
      frameRate: 15,
      ...markerDetectionOptions,
    };
    updateOptions(options);
  }, [markerDetectionEnabled, markerDetectionOptions, updateOptions]);

  const error = streamError || detectionError;

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        width={width}
        height={height}
        className="w-full h-auto bg-black rounded"
      />
      
      {/* マーカー検出オーバーレイ */}
      {markerDetectionEnabled && isStreaming && (
        <MarkerDetectionOverlay
          markers={detectedMarkers}
          videoWidth={width}
          videoHeight={height}
        />
      )}

      {/* エラー表示 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-75 text-white rounded">
          <p className="text-sm text-center p-4">
            エラー: {error}
          </p>
        </div>
      )}

      {/* ローディング表示 */}
      {!isStreaming && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 text-white rounded">
          <p className="text-sm">カメラを起動中...</p>
        </div>
      )}

      {/* 検出状況インジケーター */}
      {markerDetectionEnabled && isStreaming && (
        <div className="absolute bottom-2 left-2">
          <div className={`px-2 py-1 rounded text-xs text-white ${
            isDetecting ? 'bg-green-500' : 'bg-gray-500'
          }`}>
            {isDetecting ? 'マーカー検出中' : 'マーカー検出待機'}
          </div>
        </div>
      )}
    </div>
  );
};
