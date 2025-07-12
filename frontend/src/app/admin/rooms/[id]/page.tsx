'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <AdminLayout title="ルーム詳細">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">読み込み中...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
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
    );
  }

  if (!room) {
    return (
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
    );
  }

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

  return (
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
  );
}
