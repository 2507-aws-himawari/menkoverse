import { getUserById, getActivePlayer, calculatePPMax } from '@/lib/gameLogic';
import { mockUsers, getPlayersByRoomId, getPlayerByUserIdAndRoomId } from '@/lib/mockData';
import type { MockRoom, MockRoomPlayer, MockUser } from '@/lib/types';

interface GameControlsProps {
    room: MockRoom;
    currentUser: MockUser;
    loading: boolean;
    onConsumePP: (ppCost: number) => Promise<void>;
    onEndTurn: () => Promise<void>;
    onForceEndOpponentTurn: () => Promise<void>;
    onStartTurn: () => Promise<void>;
    onDamagePlayer: (targetUserId: string, damage: number) => Promise<void>;
    onDamageToSelf?: (damage: number) => Promise<void>;
    onDamageToOpponent?: (opponentUserId: string, damage: number) => Promise<void>;
    onSummonFollowerToOpponent?: (targetUserId: string, followerId: string) => Promise<void>;
}

export function GameControls({
    room,
    currentUser,
    loading,
    onConsumePP,
    onEndTurn,
    onForceEndOpponentTurn,
    onStartTurn,
    onDamagePlayer,
    onDamageToSelf,
    onDamageToOpponent,
    onSummonFollowerToOpponent
}: GameControlsProps) {
    const activePlayer = getActivePlayer(room);
    const activeUser = activePlayer ? getUserById(activePlayer.userId, mockUsers) : null;
    const isActiveUser = activePlayer?.userId === currentUser.id;

    // プレイヤー情報を取得
    const roomPlayers = getPlayersByRoomId(room.id);

    return (
        <div className="bg-black/40 backdrop-blur-lg border-t border-white/20">
            <div className="max-w-4xl mx-auto">
                {/* アクティブプレイヤーのみに表示される操作 */}
                {isActiveUser ? (
                    <ActivePlayerControls
                        room={room}
                        currentUser={currentUser}
                        loading={loading}
                        onConsumePP={onConsumePP}
                        onEndTurn={onEndTurn}
                        onDamagePlayer={onDamagePlayer}
                        onDamageToSelf={onDamageToSelf}
                        onDamageToOpponent={onDamageToOpponent}
                    />
                ) : (
                    <InactivePlayerControls
                        room={room}
                        currentUser={currentUser}
                        activePlayer={activePlayer}
                        loading={loading}
                        onForceEndOpponentTurn={onForceEndOpponentTurn}
                        onSummonFollowerToOpponent={onSummonFollowerToOpponent}
                    />
                )}
            </div>
        </div>
    );
}

interface ActivePlayerControlsProps {
    room: MockRoom;
    currentUser: MockUser;
    loading: boolean;
    onConsumePP: (ppCost: number) => Promise<void>;
    onEndTurn: () => Promise<void>;
    onDamagePlayer: (targetUserId: string, damage: number) => Promise<void>;
    onDamageToSelf?: (damage: number) => Promise<void>;
    onDamageToOpponent?: (opponentUserId: string, damage: number) => Promise<void>;
}

function ActivePlayerControls({
    room,
    currentUser,
    loading,
    onConsumePP,
    onEndTurn,
    onDamagePlayer,
    onDamageToSelf,
    onDamageToOpponent
}: ActivePlayerControlsProps) {
    const currentPlayer = getPlayerByUserIdAndRoomId(currentUser.id, room.id);
    const currentPP = currentPlayer?.pp || 0;
    const currentTurn = currentPlayer?.turn || 1;
    const ppMax = calculatePPMax(currentTurn);

    // 相手プレイヤーを取得
    const roomPlayers = getPlayersByRoomId(room.id);
    const opponentPlayer = roomPlayers.find(p => p.userId !== currentUser.id);

    return (
        <div className="flex justify-center p-4">
            <button
                onClick={onEndTurn}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold text-lg rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group min-w-[200px]"
            >
                <span className="relative z-10 flex items-center justify-center">
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                            ターン終了中...
                        </>
                    ) : (
                        <>
                            <span className="mr-2">⚔️</span>
                            ターン終了
                        </>
                    )}
                </span>
                {!loading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                )}
            </button>
        </div>
    );
}

interface InactivePlayerControlsProps {
    room: MockRoom;
    currentUser: MockUser;
    activePlayer: MockRoomPlayer | null;
    loading: boolean;
    onForceEndOpponentTurn: () => Promise<void>;
    onSummonFollowerToOpponent?: (targetUserId: string, followerId: string) => Promise<void>;
}

function InactivePlayerControls({
    room,
    currentUser,
    activePlayer,
    loading,
    onForceEndOpponentTurn,
    onSummonFollowerToOpponent
}: InactivePlayerControlsProps) {
    // 相手プレイヤーを取得
    const roomPlayers = getPlayersByRoomId(room.id);
    const opponentPlayer = roomPlayers.find(p => p.userId !== currentUser.id);

    const handleSummonOpponentFollower = async (followerId: string) => {
        if (!onSummonFollowerToOpponent || !opponentPlayer) return;
        await onSummonFollowerToOpponent(opponentPlayer.userId, followerId);
    };

    return (
        <div className="p-4 space-y-4">
            <div className="text-center">
                <p className="text-blue-300 text-lg font-semibold mb-2">相手のターンです</p>
                <div className="flex items-center justify-center space-x-2">
                    <div className="animate-pulse w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div className="animate-pulse w-2 h-2 bg-blue-400 rounded-full delay-75"></div>
                    <div className="animate-pulse w-2 h-2 bg-blue-400 rounded-full delay-150"></div>
                    <span className="text-blue-400 text-sm ml-2">待機してください</span>
                </div>
            </div>
            
            {/* デモ用：相手ターン終了ボタン */}
            <div className="bg-orange-900/30 backdrop-blur-sm border border-orange-500/50 rounded-lg p-3">
                <h4 className="text-orange-300 text-sm font-semibold mb-3 flex items-center">
                    <span className="mr-2">🧪</span>
                    デモ用操作
                </h4>
                <div className="space-y-2">
                    <button
                        onClick={onForceEndOpponentTurn}
                        disabled={loading}
                        className="w-full py-2 px-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold text-sm rounded-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                相手ターン終了中...
                            </span>
                        ) : (
                            '相手ターンを終了（デモ用）'
                        )}
                    </button>

                    {/* 相手フィールドにフォロワー召喚デモボタン */}
                    {onSummonFollowerToOpponent && opponentPlayer && (
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleSummonOpponentFollower('card1')}
                                disabled={loading}
                                className="py-2 px-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold text-xs rounded-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? '召喚中...' : '相手にゴブリン召喚'}
                            </button>
                            <button
                                onClick={() => handleSummonOpponentFollower('card5')}
                                disabled={loading}
                                className="py-2 px-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold text-xs rounded-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? '召喚中...' : '相手にドラゴン召喚'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
