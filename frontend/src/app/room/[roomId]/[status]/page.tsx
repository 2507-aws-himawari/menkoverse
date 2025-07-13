'use client';

import { useRouter } from 'next/navigation';
import { useRoomData, useGameActions } from './_hooks';
import { RoomDisplay, GameControls } from './_components';

export default function RoomStatusPage() {
    const router = useRouter();
    const { room, loading, error, currentUser, clearError } = useRoomData();
    const gameActions = useGameActions();

    if (error && !room) {
        return (
            <div className="h-full bg-gradient-to-br from-red-900 via-red-800 to-red-700 flex items-center justify-center">
                <div className="bg-black/70 backdrop-blur-lg rounded-xl p-6 border border-red-500/50 shadow-2xl max-w-md mx-4">
                    <h1 className="text-xl font-bold text-red-400 mb-4 text-center">エラーが発生しました</h1>
                    <p className="text-red-200 text-sm mb-4 text-center">{error}</p>
                    <button 
                        onClick={() => {
                            clearError();
                            router.refresh();
                        }}
                        className="w-full py-2 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-sm rounded-lg transform hover:scale-105 transition-all duration-300 shadow-lg"
                    >
                        再読み込み
                    </button>
                </div>
            </div>
        );
    }

    // ローディング状態
    if (loading && !room) {
        return (
            <div className="h-full bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
                <div className="bg-black/70 backdrop-blur-lg rounded-xl p-8 border border-blue-500/50 shadow-2xl">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent"></div>
                        <div className="text-blue-300 text-lg font-semibold">ロード中...</div>
                        <div className="text-blue-400 text-sm">バトルフィールドを準備しています</div>
                    </div>
                </div>
            </div>
        );
    }

    // 部屋が見つからない場合
    if (!room) {
        return (
            <div className="h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center">
                <div className="bg-black/70 backdrop-blur-lg rounded-xl p-6 border border-gray-500/50 shadow-2xl max-w-md mx-4">
                    <div className="text-center">
                        <div className="text-4xl mb-4">🏠</div>
                        <div className="text-gray-300 text-lg font-semibold">部屋が見つかりません</div>
                        <div className="text-gray-400 text-sm mt-2">部屋が削除されたか、存在しない可能性があります</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 relative overflow-hidden">
            {/* バトルフィールド背景エフェクト */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/20 to-purple-900/30"></div>
            
            {/* 星空エフェクト */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-4 left-8 w-1 h-1 bg-white rounded-full animate-pulse opacity-70"></div>
                <div className="absolute top-16 right-12 w-1 h-1 bg-yellow-300 rounded-full animate-ping"></div>
                <div className="absolute top-32 left-1/4 w-1 h-1 bg-blue-300 rounded-full animate-pulse delay-300"></div>
                <div className="absolute bottom-16 right-1/3 w-1 h-1 bg-purple-300 rounded-full animate-ping delay-500"></div>
                <div className="absolute top-1/3 left-6 w-1 h-1 bg-white rounded-full animate-pulse delay-700"></div>
                <div className="absolute bottom-8 left-1/2 w-1 h-1 bg-pink-300 rounded-full animate-ping delay-1000"></div>
            </div>
            
            <div className="relative z-10 h-full flex flex-col">
                <div className="flex-1 p-2 space-y-2">
                    {/* ルーム全体の表示 */}
                    <div className="h-full">
                        <RoomDisplay room={room} />
                    </div>

                    {/* ゲーム進行中の操作 */}
                    {room.status === 'playing' && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/20">
                            <GameControls
                                room={room}
                                currentUser={currentUser}
                                loading={loading}
                                onConsumePP={gameActions.handleConsumePP}
                                onEndTurn={gameActions.handleEndTurn}
                                onForceEndOpponentTurn={gameActions.handleForceEndOpponentTurn}
                                onStartTurn={gameActions.handleStartTurn}
                                onDamagePlayer={gameActions.handleDamagePlayer}
                                onDamageToSelf={gameActions.handleDamageToSelf}
                                onDamageToOpponent={gameActions.handleDamageToOpponent}
                                onSummonFollowerToOpponent={gameActions.handleSummonFollowerToOpponent}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
