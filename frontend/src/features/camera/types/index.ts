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
export interface DetectedMarker {
  id: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  confidence: number;
  timestamp: number;
}

export interface MarkerDetectionOptions {
  enabled: boolean;
  // 将来的に拡張可能な構造を保持
}

// OpenCV API レスポンス型定義
export interface OpenCVDetectedMarker {
  id: number;
  corners: number[][];
  confidence: number;
}

export interface OpenCVApiResponse {
  detected_markers: OpenCVDetectedMarker[];
  total_markers: number;
  image_size: {
    width: number;
    height: number;
  };
  rejected_candidates: number;
  filename: string;
  file_size: number;
  content_type: string;
}
