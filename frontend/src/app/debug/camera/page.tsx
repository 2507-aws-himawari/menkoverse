'use client';

import React, { useEffect, useState } from 'react';
import { 
  useCameraDevices, 
  CameraWithMarkerDetection,
  type DetectedMarker,
  type MarkerDetectionOptions 
} from '@/features/camera';

export default function CameraDebugPage() {
  const { devices, isLoading, error: devicesError, refreshDevices } = useCameraDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [detectedMarkers, setDetectedMarkers] = useState<DetectedMarker[]>([]);

  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0]?.deviceId || '');
    }
  }, [devices, selectedDeviceId]);

  const handleMarkersDetected = (markers: DetectedMarker[]) => {
    setDetectedMarkers(markers);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg">カメラデバイスを検索中...</p>
      </div>
    );
  }

  if (devicesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <h2 className="text-lg font-semibold text-red-800 mb-2">エラー</h2>
        <p className="text-red-700">{devicesError}</p>
        <button
          onClick={refreshDevices}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">カメラ・マーカー検出デバッグ</h2>
        
        {/* カメラ選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            カメラデバイス選択
          </label>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        </div>

        {/* カメラプレビュー（マーカー検出統合） */}
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">カメラプレビュー</h3>
          <CameraWithMarkerDetection
            deviceId={selectedDeviceId}
            width={640}
            height={480}
            className="max-w-full"
            markerDetectionEnabled={true}
            onStreamReady={(stream: MediaStream) => {
              console.log('Stream ready:', stream);
            }}
            onMarkersDetected={handleMarkersDetected}
          />
        </div>

        {/* 検出結果表示 */}
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">検出結果</h3>
          <div className="bg-gray-50 rounded p-4">
            {detectedMarkers.length === 0 ? (
              <p className="text-gray-500">マーカーが検出されていません</p>
            ) : (
              <div className="space-y-2">
                {detectedMarkers.map((marker, index) => (
                  <div key={`${marker.id}-${index}`} className="p-2 bg-white rounded border">
                    <div className="font-medium text-sm">マーカー ID: {marker.id}</div>
                    <div className="text-xs text-gray-600">
                      信頼度: {(marker.confidence * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">
                      位置: x={marker.position.x.toFixed(2)}, y={marker.position.y.toFixed(2)}, z={marker.position.z.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* デバイス情報 */}
        <div>
          <h3 className="text-lg font-medium mb-2">検出されたカメラデバイス</h3>
          <div className="bg-gray-50 rounded p-4">
            {devices.length === 0 ? (
              <p className="text-gray-500">カメラデバイスが見つかりません</p>
            ) : (
              <ul className="space-y-2">
                {devices.map((device, index) => (
                  <li key={device.deviceId} className="text-sm">
                    <span className="font-medium">#{index + 1}:</span> {device.label}
                    <br />
                    <span className="text-gray-500 text-xs">ID: {device.deviceId}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
