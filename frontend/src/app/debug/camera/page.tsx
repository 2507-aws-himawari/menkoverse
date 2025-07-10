'use client';

import React, { useState } from 'react';
import { useCameraDevices, CameraPreview } from '@/features/camera';

export default function CameraDebugPage() {
  const { devices, isLoading, error: devicesError, refreshDevices } = useCameraDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  React.useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0]?.deviceId || '');
    }
  }, [devices, selectedDeviceId]);

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
        <h2 className="text-xl font-semibold mb-4">カメラデバッグ</h2>
        
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

        {/* カメラプレビュー */}
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">プレビュー</h3>
          <CameraPreview
            deviceId={selectedDeviceId}
            width={640}
            height={480}
            className="max-w-full"
            onStreamReady={(stream) => {
              console.log('Stream ready:', stream);
            }}
          />
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
