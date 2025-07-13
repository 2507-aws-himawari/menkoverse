import { getUserById, getActivePlayer, calculatePPMax } from '@/lib/gameLogic';
import { GAME_CONSTANTS } from '@/lib/constants';
import { mockUsers, getPlayersByRoomId, getDeckById } from '@/lib/mockData';
import { mockApi } from '@/lib/mockApi';
import type { MockRoom, MockRoomPlayer } from '@/lib/types';
import type { RoomMember } from '@/types/game';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { currentUserAtom } from '@/lib/atoms';
import { useState, useEffect } from 'react';
import { DeckSelector } from './DeckSelector';
import { HandDisplay } from './HandDisplay';
import { BoardDisplay } from './BoardDisplay';
import { useGameActions } from '../_hooks/useGameActions';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';

interface RoomDisplayProps {
    room: MockRoom;
}

export function RoomDisplay({ room }: RoomDisplayProps) {
    const roomPlayers = getPlayersByRoomId(room.id);
    const router = useRouter();
    const [currentUser] = useAtom(currentUserAtom);
    const [isStartingGame, setIsStartingGame] = useState(false);
    const [, forceUpdate] = useState({});
    const [boardRefreshTrigger, setBoardRefreshTrigger] = useState(0);
    
    // 固定のplayerIdを使用（再レンダリング時に変わらないように）
    const [stablePlayerId] = useState(() => `player_${currentUser.id}_${Date.now()}`);

    // 参加者管理のためのstate
    const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);

    // 参加者一覧を取得する関数
    const fetchRoomMembers = async () => {
        if (room.status !== 'waiting') return; // waiting状態でのみ参加者同期
        
        setMembersLoading(true);
        try {
            const response = await fetch(`/api/rooms/${encodeURIComponent(room.id)}/members`);
            if (response.ok) {
                const data = await response.json();
                setRoomMembers(data.members || []);
                console.log('Room members updated:', data.members);
            } else {
                console.error('Failed to fetch room members');
            }
        } catch (error) {
            console.error('Error fetching room members:', error);
        } finally {
            setMembersLoading(false);
        }
    };

    // WebSocket接続でプレイヤー参加イベントを監視（接続失敗時は無効化）
    const { playerJoinEvents, isConnected, error } = useGameWebSocket(
        room.id, 
        stablePlayerId
    );

    // 初回ロード時と部屋状態変更時に参加者を取得
    useEffect(() => {
        fetchRoomMembers();
    }, [room.id, room.status]);

    // プレイヤー参加イベントを監視してUIを更新
    useEffect(() => {
        if (playerJoinEvents.length > 0) {
            const latestEvent = playerJoinEvents[playerJoinEvents.length - 1];
            console.log('New player joined:', latestEvent);
            // 参加者リストを再取得
            fetchRoomMembers();
            // 画面を再描画してプレイヤーリストを更新
            forceUpdate({});
        }
    }, [playerJoinEvents]);

    const {
        handleSummonFollower: originalHandleSummonFollower,
        handleAttackWithFollower: originalHandleAttackWithFollower,
        handleSummonFollowerToOpponent: originalHandleSummonFollowerToOpponent
    } = useGameActions();

    // フォロワー召喚後にボードを更新
    const handleSummonFollower = async (handCardId: string) => {
        await originalHandleSummonFollower(handCardId);
        setBoardRefreshTrigger(prev => prev + 1);
        refreshData();
    };

    // 相手フィールドにフォロワー召喚後にボードを更新
    const handleSummonFollowerToOpponent = async (targetUserId: string, followerId: string) => {
        await originalHandleSummonFollowerToOpponent(targetUserId, followerId);
        setBoardRefreshTrigger(prev => prev + 1);
        refreshData();
    };

    // フォロワー攻撃後にボードを更新
    const handleAttackWithFollower = async (
        attackerBoardCardId: string,
        targetType: 'follower' | 'player',
        targetId: string
    ) => {
        await originalHandleAttackWithFollower(attackerBoardCardId, targetType, targetId);
        setBoardRefreshTrigger(prev => prev + 1);
        refreshData();
    };

    const refreshData = () => {
        forceUpdate({});
    };

    const handleBackHome = () => {
        router.push('/home');
    };

    const handleStartGame = async () => {
        setIsStartingGame(true);
        try {
            const updatedRoom = await mockApi.startGame({
                roomId: room.id,
                currentUser
            });

            if (updatedRoom) {
                const newUrl = `/room/${encodeURIComponent(room.id)}/${updatedRoom.status}`;
                router.push(newUrl);
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : 'ゲーム開始に失敗しました');
        } finally {
            setIsStartingGame(false);
        }
    };

    const handleDemoStartGame = async () => {
        setIsStartingGame(true);
        try {
            const updatedRoom = await mockApi.startGame({
                roomId: room.id,
                currentUser,
                isDemo: true
            });

            if (updatedRoom) {
                const newUrl = `/room/${encodeURIComponent(room.id)}/${updatedRoom.status}`;
                router.push(newUrl);
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : 'ゲーム開始に失敗しました');
        } finally {
            setIsStartingGame(false);
        }
    };

    const Turn = roomPlayers.length > 0 ? Math.max(...roomPlayers.map(p => p.turn)) : 1;

    return (
        <div className="h-full bg-gradient-to-br from-slate-900/50 via-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-lg overflow-hidden">
            <div className="h-full flex flex-col">
                {/* ヘッダー部分 */}
                <div className="flex-shrink-0 bg-black/40 backdrop-blur-sm border-b border-white/20 p-2">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg font-bold text-white">ゲームルーム</h1>
                        <div className="text-sm text-blue-300 font-semibold">
                            ターン: {Turn}
                        </div>
                    </div>
                    
                    {/* WebSocket接続状態表示 */}
                    {error && (
                        <div className="mt-1 bg-yellow-900/30 border border-yellow-500/50 px-2 py-1 rounded text-xs text-yellow-300">
                            ⚠️ リアルタイム通知: {error}
                        </div>
                    )}
                    
                    {isConnected && (
                        <div className="mt-1 bg-green-900/30 border border-green-500/50 px-2 py-1 rounded text-xs text-green-300">
                            ✅ リアルタイム通知: 接続中
                        </div>
                    )}
                    
                    {/* プレイヤー参加通知 */}
                    {playerJoinEvents.length > 0 && (
                        <div className="mt-1 bg-green-900/30 border border-green-500/50 px-2 py-1 rounded text-xs text-green-300">
                            {playerJoinEvents.map((event, index) => (
                                <div key={index}>
                                    ✓ プレイヤーが参加しました: {event.userId}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {/* プレイヤー情報 */}
                <div className="flex-shrink-0 bg-black/30 backdrop-blur-sm border-b border-white/20 p-2">
                    <div className="grid grid-cols-2 gap-4">
                        {roomPlayers.map((player: MockRoomPlayer, index: number) => {
                            const user = getUserById(player.userId, mockUsers);
                            if (!user) return null;

                            const activePlayer = getActivePlayer(room);
                            const isActivePlayer = activePlayer?.userId === player.userId;
                            const playerPosition = index === 0 ? '先攻' : '後攻';
                            const isCurrentPlayer = player.userId === currentUser.id;

                            return (
                                <div 
                                    key={player.id}
                                    className={`
                                        p-2 rounded-lg border backdrop-blur-sm
                                        ${isCurrentPlayer 
                                            ? 'border-green-400 bg-green-900/20' 
                                            : 'border-blue-400 bg-blue-900/20'
                                        }
                                        ${isActivePlayer ? 'ring-2 ring-yellow-400' : ''}
                                    `}
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className={`text-sm font-bold ${isCurrentPlayer ? 'text-green-300' : 'text-blue-300'}`}>
                                            {user.name}
                                            {room.status === 'playing' && (
                                                <span className="ml-1 text-xs">
                                                    ({playerPosition})
                                                    {isActivePlayer && <span className="text-yellow-300"> 【行動】</span>}
                                                </span>
                                            )}
                                        </h3>
                                        {player.userId === room.ownerId && (
                                            <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                                                ホスト
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-300">
                                        <div className="flex justify-between">
                                            <span>HP: {player.hp}/{GAME_CONSTANTS.MAX_HP}</span>
                                            <span>PP: {player.pp}/{calculatePPMax(player.turn)}</span>
                                        </div>
                                        {room.status === 'waiting' && (
                                            <div className="mt-1">
                                                デッキ: {player.selectedDeckId ? (
                                                    <span className="text-green-400">選択済み</span>
                                                ) : (
                                                    <span className="text-orange-400">未選択</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {roomPlayers.length < 2 && (
                            <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-500 rounded-lg bg-gray-800/30">
                                <div className="text-center">
                                    <div className="text-2xl mb-1">👤</div>
                                    <p className="text-gray-400 text-xs">プレイヤーを待機中...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ゲーム状態 */}
                <div className="flex-1 overflow-y-auto">
                    {room.status === 'waiting' && (
                        <div className="p-4 space-y-4">
                            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                                <h2 className="text-lg font-bold text-white mb-2">プレイヤー待機中</h2>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-300">参加者: {roomPlayers.length}/2</p>
                                    {roomPlayers.length < 2 && (
                                        <p className="text-sm text-yellow-300">もう1人のプレイヤーを待っています...</p>
                                    )}

                                                                {/* リアルタイム参加者同期情報 */}
                            {room.status === 'waiting' && (
                                <div style={{ 
                                    marginTop: '10px',
                                    padding: '10px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}>
                                    <h3>リアルタイム参加者情報</h3>
                                    {membersLoading ? (
                                        <p>参加者情報を読み込み中...</p>
                                    ) : (
                                        <div>
                                            <p>接続中の参加者: {roomMembers.length}人</p>
                                            {roomMembers.map((member, index) => {
                                                const user = mockUsers.find(u => u.id === member.userId);
                                                return (
                                                    <div key={member.playerId} style={{ margin: '5px 0' }}>
                                                        • {user?.name || member.userId} 
                                                        <span style={{ color: '#666', fontSize: '12px' }}>
                                                            （{new Date(member.joinedAt).toLocaleTimeString()}参加）
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                            {roomMembers.length === 0 && (
                                                <p style={{ color: '#666' }}>まだ参加者がいません</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                                    {/* 現在のユーザーのデッキ選択 */}
                                    {(() => {
                                        const currentPlayer = roomPlayers.find(p => p.userId === currentUser.id);
                                        if (currentPlayer) {
                                            return (
                                                <DeckSelector
                                                    room={room}
                                                    currentUser={currentUser}
                                                    currentPlayer={currentPlayer}
                                                    onDeckSelected={refreshData}
                                                />
                                            );
                                        }
                                        return null;
                                    })()}

                                    {roomPlayers.length === 2 && room.ownerId === currentUser.id && (
                                        <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3">
                                            <p className="text-green-300 text-sm mb-2">プレイヤーが揃いました！</p>
                                            <button
                                                onClick={handleStartGame}
                                                disabled={isStartingGame}
                                                className="w-full py-2 px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold text-sm rounded-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                            >
                                                {isStartingGame ? 'ゲーム開始中...' : 'ゲーム開始'}
                                            </button>
                                        </div>
                                    )}
                                    {roomPlayers.length === 2 && room.ownerId !== currentUser.id && (
                                        <div className="space-y-2">
                                            <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3">
                                                <p className="text-blue-300 text-sm">ホストがゲームを開始するまでお待ちください...</p>
                                            </div>
                                            <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-3">
                                                <p className="text-orange-300 text-xs mb-2">
                                                    デモ用: ホストが開始したことにして進める
                                                </p>
                                                <button
                                                    onClick={handleDemoStartGame}
                                                    disabled={isStartingGame}
                                                    className="w-full py-2 px-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold text-sm rounded-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                                >
                                                    {isStartingGame ? 'ゲーム開始中...' : 'ホストが開始したことにする'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {room.status === 'playing' && (
                        <div className="h-full flex flex-col">
                            {/* バトルフィールド（ボード）を表示 */}
                            <div className="flex-1 min-h-0 p-2">
                                <BoardDisplay
                                    room={room}
                                    currentUser={currentUser}
                                    refreshTrigger={boardRefreshTrigger}
                                    onAttackWithFollower={handleAttackWithFollower}
                                />
                            </div>
                            {/* 現在のユーザーの手札を表示 */}
                            <div className="flex-shrink-0 p-2 bg-black/30 backdrop-blur-sm border-t border-white/20">
                                <HandDisplay
                                    room={room}
                                    currentUser={currentUser}
                                    onSummonFollower={handleSummonFollower}
                                />
                            </div>
                        </div>
                    )}

                    {room.status === 'finish' && (
                        <div className="p-4">
                            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6 border border-white/20 text-center">
                                {(() => {
                                    const winnerPlayer = roomPlayers.find(p => p.hp > 0);
                                    const loserPlayer = roomPlayers.find(p => p.hp <= 0);
                                    const winnerUser = winnerPlayer ? getUserById(winnerPlayer.userId, mockUsers) : null;
                                    const loserUser = loserPlayer ? getUserById(loserPlayer.userId, mockUsers) : null;

                                    if (winnerUser && loserUser) {
                                        return (
                                            <div className="space-y-4">
                                                <div className="text-2xl font-bold text-yellow-400">
                                                    🏆 {winnerUser.name} の勝利！
                                                </div>
                                                <button 
                                                    onClick={() => handleBackHome()}
                                                    className="py-2 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm rounded-lg transform hover:scale-105 transition-all duration-300"
                                                >
                                                    ホームに戻る
                                                </button>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div className="text-lg text-gray-300">
                                                ゲームが終了しました
                                            </div>
                                        );
                                    }
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
