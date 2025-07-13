'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { mockUsers } from '@/lib/mockData';
import { currentUserAtom } from '@/lib/atoms';
import { useRooms } from './_hooks/useRooms';
import { Footer } from '@/app/components/footer';

export default function JoinRoomPage() {
    const [roomId, setRoomId] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
    const { rooms: availableRooms, isLoading: roomsLoading, error: roomsError } = useRooms();
    const router = useRouter();

    const handleUserChange = (userId: string) => {
        const user = mockUsers.find(u => u.id === userId);
        if (user) {
            setCurrentUser(user);
        }
    };

    const handleJoinRoom = async () => {
        console.log("hogehoge")
        if (!roomId.trim()) {
            setErrorMessage('部屋IDを入力してください');
            return;
        }

        setIsJoining(true);
        setErrorMessage('');

        try {
            // 新しいAPIエンドポイントを使用
            const joinResponse = await fetch(`/api/rooms/${encodeURIComponent(roomId.trim())}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerId: `player_${currentUser.id}_${Date.now()}`,
                    userId: currentUser.id
                })
            });

            if (!joinResponse.ok) {
                const errorData = await joinResponse.json();
                throw new Error(errorData.error || '参加に失敗しました');
            }

            // 参加成功後、部屋情報をAPIから取得
            const roomResponse = await fetch(`/api/rooms/${encodeURIComponent(roomId.trim())}`);
            
            if (!roomResponse.ok) {
                setErrorMessage('部屋の情報を取得できませんでした');
                return;
            }

            const roomData = await roomResponse.json();
            const targetUrl = `/room/${encodeURIComponent(roomId.trim())}/${roomData.status}`;
            router.push(targetUrl);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : '参加に失敗しました');
        } finally {
            setIsJoining(false);
        }
    };

return (
    <div className="h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* キラキラアニメーション背景 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-4 left-8 w-1 h-1 bg-white rounded-full animate-pulse opacity-70"></div>
        <div className="absolute top-16 right-12 w-1 h-1 bg-yellow-300 rounded-full animate-ping"></div>
        <div className="absolute top-32 left-1/4 w-2 h-2 bg-pink-300 rounded-full animate-bounce opacity-60"></div>
        <div className="absolute bottom-16 right-1/3 w-1 h-1 bg-blue-300 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 left-6 w-1 h-1 bg-white rounded-full animate-ping delay-300"></div>
        <div className="absolute bottom-8 left-1/2 w-1 h-1 bg-purple-300 rounded-full animate-bounce delay-500"></div>
      </div>

      <div className="relative z-10 h-full overflow-hidden">
        <div className="h-full px-4 py-2">
          {/* タイトル */}
          <h1 className="text-xl font-bold text-center mb-3 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            ゲーム参加
          </h1>

          <div className="grid grid-cols-2 gap-4 h-[calc(100%-4rem)]">
            {/* 左カラム：ユーザー選択＋部屋参加 */}
            <div className="space-y-2 overflow-y-auto">
              {/* ユーザー選択セクション */}
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-3 border border-white/20 shadow-2xl">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-white">
                    ユーザー選択(demo用)
                  </label>
                  <select
                    value={currentUser.id}
                    onChange={(e) => handleUserChange(e.target.value)}
                    className="w-full px-2 py-1 text-xs rounded-md bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                  >
                    {mockUsers.map(user => (
                      <option key={user.id} value={user.id} className="bg-gray-800 text-white">
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 部屋参加セクション */}
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-3 border border-white/20 shadow-2xl">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center">
                  <span className="mr-1">🎮</span>
                  部屋に参加
                </h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-white mb-1">
                      あいことば
                    </label>
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      placeholder="ほけほけ"
                      className="w-full px-2 py-1 text-xs rounded-md bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <button
                    onClick={handleJoinRoom}
                    disabled={isJoining}
                    className="w-full py-2 px-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold text-xs rounded-md shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                  >
                    <span className="relative z-10">
                      {isJoining ? '参加中...' : '参加'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                </div>
              </div>

              {/* エラーメッセージ */}
              {errorMessage && (
                <div className="bg-red-500/20 backdrop-blur-lg border border-red-400/50 rounded-lg p-2">
                  <p className="text-red-200 text-xs font-medium flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errorMessage}
                  </p>
                </div>
              )}
            </div>

            {/* 右カラム：参加可能な部屋一覧 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-3 border border-white/20 shadow-2xl overflow-y-auto">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center">
                <span className="mr-1">🏠</span>
                参加可能な部屋
              </h3>
              
              {roomsLoading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                  <p className="text-white/80 text-xs mt-1">読み込み中...</p>
                </div>
              )}
              
              {roomsError && (
                <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-2 mb-2">
                  <p className="text-red-200 text-xs">部屋一覧の取得に失敗: {roomsError.message}</p>
                </div>
              )}
              
              <div className="space-y-2 max-h-full overflow-y-auto">
                {availableRooms.map((room) => {
                  const statusInfo = {
                    waiting: { text: '待機中', color: 'bg-green-500', emoji: '⏳' },
                    playing: { text: 'プレイ中', color: 'bg-orange-500', emoji: '🎮' },
                    finish: { text: '終了', color: 'bg-gray-500', emoji: '🏁' }
                  };
                  const status = statusInfo[room.status] || statusInfo.finish;

                  return (
                    <div key={room.id} className="bg-white/20 backdrop-blur-sm rounded-md p-2 border border-white/30 hover:bg-white/30 transition-all duration-300">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-white font-bold text-xs">{room.id}</span>
                        <div className={`px-2 py-0.5 rounded-full ${status.color} text-white text-xs font-medium flex items-center`}>
                          <span className="mr-0.5">{status.emoji}</span>
                          {status.text}
                        </div>
                      </div>
                      
                      {room.status === 'waiting' && (
                        <button
                          onClick={async () => {
                            setRoomId(room.id);
                            setIsJoining(true);
                            setErrorMessage('');

                            try {
                              const joinResponse = await fetch(`/api/rooms/${encodeURIComponent(room.id)}/join`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  playerId: `player_${currentUser.id}_${Date.now()}`,
                                  userId: currentUser.id
                                })
                              });

                              if (!joinResponse.ok) {
                                const errorData = await joinResponse.json();
                                throw new Error(errorData.error || '参加に失敗しました');
                              }

                              const roomResponse = await fetch(`/api/rooms/${encodeURIComponent(room.id)}`);
                              
                              if (!roomResponse.ok) {
                                setErrorMessage('部屋の情報を取得できませんでした');
                                return;
                              }

                              const roomData = await roomResponse.json();
                              const targetUrl = `/room/${encodeURIComponent(room.id)}/${roomData.status}`;
                              router.push(targetUrl);
                            } catch (error) {
                              setErrorMessage(error instanceof Error ? error.message : '参加に失敗しました');
                            } finally {
                              setIsJoining(false);
                            }
                          }}
                          disabled={isJoining}
                          className="w-full py-1 px-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold text-xs rounded-md transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                        >
                          <span className="relative z-10">参加</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                        </button>
                      )}
                    </div>
                  );
                })}
                
                {availableRooms.length === 0 && !roomsLoading && (
                  <div className="text-center py-4">
                    <div className="text-2xl mb-1">🏠</div>
                    <p className="text-white/80 text-xs">利用可能な部屋がありません</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-2">
            <Footer />
          </div>
          </div>
        </div>
      </div>
  );
}
