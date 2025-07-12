'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';

interface Room {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  status: string;
  ownerId: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      } else {
        const error = await response.json();
        setError(error.error || 'ルーム一覧の取得に失敗しました');
      }
    } catch (err) {
      setError('ルーム一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetchRooms();
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

  if (loading) {
    return (
      <AdminLayout title="ルーム一覧">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">読み込み中...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="ルーム一覧">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">エラー</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
            >
              再試行
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="ルーム一覧">
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ルーム一覧</h2>
            <p className="text-gray-600">{rooms.length} 個のルームが見つかりました</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              更新
            </button>
            <Link
              href="/admin/rooms/new"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              新しいルーム作成
            </Link>
          </div>
        </div>

        {/* ルーム一覧 */}
        {rooms.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ルームがありません</h3>
            <p className="text-gray-600 mb-4">新しいルームを作成して始めましょう</p>
            <Link
              href="/admin/rooms/new"
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              新しいルーム作成
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                        {getStatusText(room.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">プレイヤー数:</span> {room.playerCount}/{room.maxPlayers}
                      </div>
                      <div>
                        <span className="font-medium">オーナー:</span> {room.ownerId}
                      </div>
                      <div>
                        <span className="font-medium">作成日時:</span> {new Date(room.createdAt).toLocaleString('ja-JP')}
                      </div>
                    </div>
                    {room.description && (
                      <p className="mt-2 text-gray-700">{room.description}</p>
                    )}
                  </div>
                  <div className="ml-4 flex gap-2">
                    <Link
                      href={`/admin/rooms/${room.id}`}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
                    >
                      詳細
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
