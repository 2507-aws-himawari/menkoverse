import { useState, useRef } from 'react';
import type { CameraStreamOptions } from '@/types/camera';

export const useCameraStream = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startStream = async (options: CameraStreamOptions = {}) => {
    try {
      setError(null);
      
      // 既存のストリームを停止
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: options.deviceId ? { exact: options.deviceId } : undefined,
          width: options.width || 640,
          height: options.height || 480,
          facingMode: options.facingMode || 'environment',
        },
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      
      setStream(newStream);
      setIsStreaming(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ストリーム開始エラー');
      setIsStreaming(false);
    }
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  return {
    stream,
    videoRef,
    isStreaming,
    error,
    startStream,
    stopStream,
  };
};
