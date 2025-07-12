'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title = '管理者画面' }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <nav className="flex space-x-4">
              <Link href="/admin/home" className="text-blue-600 hover:text-blue-800 transition-colors">
                ホーム
              </Link>
              <Link href="/admin/rooms" className="text-blue-600 hover:text-blue-800 transition-colors">
                ルーム一覧
              </Link>
              <Link href="/admin/rooms/new" className="text-blue-600 hover:text-blue-800 transition-colors">
                ルーム作成
              </Link>
              <Link href="/debug/websockets" className="text-gray-600 hover:text-gray-800 transition-colors">
                デバッグ
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
