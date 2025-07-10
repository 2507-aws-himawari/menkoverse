import React from 'react';
import { useCameraStream } from '../hooks/useCameraStream';
import type { CameraStreamOptions } from '../types';

interface CameraPreviewProps {
  deviceId?: string;
  width?: number;
  height?: number;
  onStreamReady?: (stream: MediaStream) => void;
  className?: string;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  deviceId,
  width = 640,
  height = 480,
  onStreamReady,
  className = '',
}) => {
  const { videoRef, isStreaming, error, startStream, stopStream } = useCameraStream();

  React.useEffect(() => {
    const options: CameraStreamOptions = {
      deviceId,
      width,
      height,
    };
    startStream(options);

    return () => stopStream();
  }, [deviceId, width, height]);

  React.useEffect(() => {
    if (isStreaming && videoRef.current?.srcObject && onStreamReady) {
      onStreamReady(videoRef.current.srcObject as MediaStream);
    }
  }, [isStreaming, onStreamReady]);

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
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-75 text-white rounded">
          <p className="text-sm text-center p-4">
            エラー: {error}
          </p>
        </div>
      )}
      {!isStreaming && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 text-white rounded">
          <p className="text-sm">カメラを起動中...</p>
        </div>
      )}
    </div>
  );
};
