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

// ArUco関連型定義
export interface ArUcoMarkerConfig {
  dictionaryName: string; // '4x4_1000'
  markerSize: number;     // マーカーサイズ（mm）
}

export interface DetectedMarker {
  id: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  confidence: number;
  timestamp: number;
}

export interface MarkerDetectionOptions {
  enabled: boolean;
  sensitivity: number;
  frameRate: number;
}
