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
  className?: string;
}

export const CameraWithMarkerDetection: React.FC<CameraWithMarkerDetectionProps> = ({
  deviceId,
  width = 640,
  height = 480,
  onStreamReady,
  onMarkersDetected,
  markerDetectionEnabled = true,
  className = '',
}) => {
  const { videoRef, isStreaming, error: streamError, startStream, stopStream } = useCameraStream();
  
  // マーカー検出Hook
  const {
    detectedMarkers,
    isDetecting,
    error: detectionError,
    startDetection,
    stopDetection,
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

  const error = streamError || detectionError;

  // 手動検出の実行
  const handleManualDetection = () => {
    if (markerDetectionEnabled && !isDetecting) {
      startDetection();
    }
  };

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
        <div className="absolute bottom-2 left-2 space-y-2">
          <div className={`px-2 py-1 rounded text-xs text-white ${
            isDetecting ? 'bg-green-500' : 'bg-gray-500'
          }`}>
            {isDetecting ? 'マーカー検出中' : 'マーカー検出待機'}
          </div>
          
          {/* 手動検出ボタン */}
          <button
            onClick={handleManualDetection}
            disabled={isDetecting}
            className={`px-3 py-1 rounded text-xs font-medium ${
              isDetecting 
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isDetecting ? '検出中...' : 'マーカー検出実行'}
          </button>
        </div>
      )}
    </div>
  );
};
