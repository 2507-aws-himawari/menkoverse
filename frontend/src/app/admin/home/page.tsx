'use client';

import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminHomePage() {
  return (
    <AdminLayout title="管理者ホーム">
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">ルーム管理</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/admin/rooms/new"
              className="block p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <h3 className="font-semibold">新しいルーム作成</h3>
              <p className="text-sm mt-1">新しいゲームルームを作成します</p>
            </Link>
            <Link
              href="/admin/rooms"
              className="block p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <h3 className="font-semibold">既存ルーム管理</h3>
              <p className="text-sm mt-1">作成済みのルームを管理します</p>
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">開発ツール</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/debug/websockets"
              className="block p-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <h3 className="font-semibold">WebSocket テスト</h3>
              <p className="text-sm mt-1">リアルタイム通信をテストします</p>
            </Link>
            <Link
              href="/admin/rooms"
              className="block p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <h3 className="font-semibold">ルーム一覧</h3>
              <p className="text-sm mt-1">全てのルームを確認します</p>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">システム情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-gray-600">環境</p>
              <p className="font-medium">開発環境</p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-gray-600">データベース</p>
              <p className="font-medium">DynamoDB</p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-gray-600">WebSocket</p>
              <p className="font-medium">AWS API Gateway</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
