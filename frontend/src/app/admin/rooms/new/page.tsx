'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AdminLayout from '@/components/admin/AdminLayout';

export default function NewRoomPage() {
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) return;

    // 認証状態の確認
    if (status === 'loading') {
      alert('認証情報を読み込み中です。少しお待ちください。');
      return;
    }

    if (!session?.user?.id) {
      alert('ログインが必要です。認証を完了してください。');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: roomId,
          ownerId: session.user.id,  // JWTからuserIdを取得
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/admin/rooms/${data.roomId}`);
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error}`);
      }
    } catch (error) {
      alert(`エラー: ${error}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AdminLayout title="新しいルーム作成">
      <div className="max-w-2xl mx-auto">
        {/* 認証状態の表示 */}
        {status === 'loading' && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            認証情報を読み込み中...
          </div>
        )}
        
        {status === 'unauthenticated' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            ログインが必要です。認証を完了してください。
          </div>
        )}

        {status === 'authenticated' && session?.user && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            ログイン中: {session.user.email || session.user.id}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
                あいことば *
              </label>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ルームのあいことばを入力してください"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                参加者がアクセスする際に使用するあいことばです
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isCreating || !roomId.trim() || status !== 'authenticated'}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? '作成中...' : 'ルーム作成'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/home')}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
