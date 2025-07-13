'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useCameraDevices,
  CameraWithMarkerDetection,
  type DetectedMarker,
  type MarkerDetectionOptions
} from '@/features/camera';
import AdminLayout from '@/components/admin/AdminLayout';

interface Room {
  id: string;
  ownerId: string;
  status: 'waiting' | 'playing' | 'finished';
  currentUserId: string | null;
  turn: number;
  createdAt: number;
  updatedAt: number;
}

export default function RoomDetailPage() {
  // すべてのHooksを最上部で実行
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { devices, isLoading, error: devicesError, refreshDevices } = useCameraDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [detectedMarkers, setDetectedMarkers] = useState<DetectedMarker[]>([]);

  // すべてのuseEffectを配置
  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0]?.deviceId || '');
    }
  }, [devices, selectedDeviceId]);

  useEffect(() => {
    if (!roomId) return;
    
    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}`);
        
        if (response.ok) {
          const data = await response.json();
          setRoom(data);
        } else if (response.status === 404) {
          setError('ルームが見つかりません');
        } else {
          const error = await response.json();
          setError(error.error || '不明なエラーが発生しました');
        }
      } catch (err) {
        setError('ルーム情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  // すべてのハンドラー関数を定義
  const handleMarkersDetected = (markers: DetectedMarker[]) => {
    setDetectedMarkers(markers);
  };

  const handleStartGame = async () => {
    if (!room) return;
    
    try {
      const response = await fetch(`/api/rooms/${roomId}/start`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const updatedRoom = await response.json();
        setRoom(updatedRoom);
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error}`);
      }
    } catch (err) {
      alert('ゲーム開始に失敗しました');
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/rooms/${roomId}`);
      
      if (response.ok) {
        const data = await response.json();
        setRoom(data);
      } else {
        const error = await response.json();
        setError(error.error || '不明なエラーが発生しました');
      }
    } catch (err) {
      setError('ルーム情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return '待機中';
      case 'playing': return 'プレイ中';
      case 'finished': return '終了';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'playing': return 'bg-green-100 text-green-800';
      case 'finished': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 単一のreturn文で条件分岐
  return (
    <div>
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-lg">カメラデバイスを検索中...</p>
        </div>
      ) : devicesError ? (
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
      ) : loading ? (
        <AdminLayout title="ルーム詳細">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">読み込み中...</div>
          </div>
        </AdminLayout>
      ) : error ? (
        <AdminLayout title="ルーム詳細">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-800 mb-2">エラー</h2>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                >
                  再試行
                </button>
                <button
                  onClick={() => router.push('/admin/home')}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                >
                  ホームに戻る
                </button>
              </div>
            </div>
          </div>
        </AdminLayout>
      ) : !room ? (
        <AdminLayout title="ルーム詳細">
          <div className="max-w-2xl mx-auto">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">ルームが見つかりません</h2>
              <p className="text-yellow-700 mb-4">指定されたルームが存在しないか、削除されています。</p>
              <button
                onClick={() => router.push('/admin/home')}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                ホームに戻る
              </button>
            </div>
          </div>
        </AdminLayout>
      ) : (
        <AdminLayout title={`ルーム詳細: ${room.id}`}>
          <div className="max-w-4xl mx-auto space-y-6">
            {/* ルーム情報 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{room.id}</h2>
                  <p className="text-gray-600">あいことば</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(room.status)}`}>
                    {getStatusText(room.status)}
                  </span>
                  <button
                    onClick={handleRefresh}
                    className="bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600 transition-colors text-sm"
                  >
                    更新
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 mb-6">
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
                  <div className="max-w-full overflow-hidden rounded-lg border">
                    <CameraWithMarkerDetection
                      deviceId={selectedDeviceId}
                      width={640}
                      height={480}
                      className="max-w-full h-auto"
                      markerDetectionEnabled={true}
                      onStreamReady={(stream: MediaStream) => {
                        console.log('Stream ready:', stream);
                      }}
                      onMarkersDetected={handleMarkersDetected}
                    />
                  </div>
                </div>

                {/* 検出結果表示 */}
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">検出結果</h3>
                  <div className="bg-gray-50 rounded p-4 max-h-64 overflow-y-auto">
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
                  <div className="bg-gray-50 rounded p-4 max-h-32 overflow-y-auto">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">オーナー</p>
                  <p className="text-lg font-semibold">{room.ownerId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ターン数</p>
                  <p className="text-lg font-semibold">{room.turn}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">現在のプレイヤー</p>
                  <p className="text-lg font-semibold">{room.currentUserId || '未設定'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">作成日時</p>
                  <p className="text-lg font-semibold">{new Date(room.createdAt).toLocaleString('ja-JP')}</p>
                </div>
              </div>
            </div>

            {/* 操作ボタン */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">ルーム操作</h3>
              <div className="flex gap-4">
                {room.status === 'waiting' && (
                  <button
                    onClick={handleStartGame}
                    className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors"
                  >
                    ゲーム開始
                  </button>
                )}
                <button
                  onClick={() => router.push('/admin/rooms/new')}
                  className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  新しいルーム作成
                </button>
                <button
                  onClick={() => router.push('/admin/home')}
                  className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors"
                >
                  ホームに戻る
                </button>
              </div>
            </div>
          </div>
        </AdminLayout>
      )}
    </div>
  );
}
