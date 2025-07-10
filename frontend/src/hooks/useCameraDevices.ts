import { useState, useEffect } from 'react';
import type { CameraDevice } from '@/types/camera';

export const useCameraDevices = () => {
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 権限をリクエスト
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      // デバイス一覧を取得
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          kind: device.kind,
        }));
      
      setDevices(videoDevices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'カメラアクセスエラー');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getDevices();
  }, []);

  return {
    devices,
    isLoading,
    error,
    refreshDevices: getDevices,
  };
};
