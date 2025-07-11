// カメラ関連の型定義（最小限）
export interface CameraDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export interface CameraStreamOptions {
  deviceId?: string;
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
}
