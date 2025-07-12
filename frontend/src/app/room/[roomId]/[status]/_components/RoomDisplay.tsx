import { getUserById, getActivePlayer, calculatePPMax } from '@/lib/gameLogic';
import { GAME_CONSTANTS } from '@/lib/constants';
import { mockUsers, getPlayersByRoomId, getDeckById } from '@/lib/mockData';
import { mockApi } from '@/lib/mockApi';
import type { MockRoom, MockRoomPlayer } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { currentUserAtom } from '@/lib/atoms';
import { useState } from 'react';
import { DeckSelector } from './DeckSelector';
import { HandDisplay } from './HandDisplay';
import { BoardDisplay } from './BoardDisplay';
import { useGameActions } from '../_hooks/useGameActions';

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

    const { handleSummonFollower: originalHandleSummonFollower } = useGameActions();

    // フォロワー召喚後にボードを更新
    const handleSummonFollower = async (handCardId: string) => {
        await originalHandleSummonFollower(handCardId);
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
        <div>
            <h1>ゲームルーム</h1>
            <div style={{ fontSize: '20px' }}>ターン: {Turn}</div>
            <div>
                {roomPlayers.map((player: MockRoomPlayer, index: number) => {
                    const user = getUserById(player.userId, mockUsers);
                    if (!user) return null;

                    const activePlayer = getActivePlayer(room);
                    const isActivePlayer = activePlayer?.userId === player.userId;
                    const playerPosition = index === 0 ? '先攻' : '後攻';

                    // デッキ情報を取得
                    const selectedDeck = player.selectedDeckId ? getDeckById(player.selectedDeckId) : null;

                    return (
                        <div key={player.id}>
                            <div>
                                <h3>
                                    {user.name}
                                    {room.status === 'playing' && (
                                        <span style={{ marginLeft: '8px', fontSize: '14px' }}>
                                            ({playerPosition})
                                            {isActivePlayer && <span style={{ color: 'green' }}> 【行動】</span>}
                                        </span>
                                    )}
                                </h3>
                                {player.userId === room.ownerId && (
                                    <span>
                                        ホスト
                                    </span>
                                )}
                                <div>
                                    <span>HP: {player.hp}/{GAME_CONSTANTS.MAX_HP}</span>
                                    <p>PP: {player.pp}/{calculatePPMax(player.turn)}</p>

                                    {/* デッキ情報表示 */}
                                    {room.status === 'waiting' && (
                                        <p>
                                            デッキ: {player.selectedDeckId ? (
                                                <span style={{ color: 'green' }}>選択済み</span>
                                            ) : (
                                                <span style={{ color: 'orange' }}>未選択</span>
                                            )}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {roomPlayers.length < 2 && (
                    <div>
                        <div>
                            <div></div>
                            <p>プレイヤーを待機中...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ゲーム状態 */}
            <div>
                {room.status === 'waiting' && (
                    <div>
                        <h2>プレイヤー待機中</h2>
                        <div>
                            <p>参加者: {roomPlayers.length}/2</p>
                            {roomPlayers.length < 2 && (
                                <p>もう1人のプレイヤーを待っています...</p>
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
                                <div>
                                    <p>プレイヤーが揃いました！</p>
                                    <button
                                        onClick={handleStartGame}
                                        disabled={isStartingGame}
                                        style={{
                                            padding: '10px 20px',
                                            fontSize: '16px',
                                            backgroundColor: '#4CAF50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: isStartingGame ? 'not-allowed' : 'pointer',
                                            opacity: isStartingGame ? 0.6 : 1
                                        }}
                                    >
                                        {isStartingGame ? 'ゲーム開始中...' : 'ゲーム開始'}
                                    </button>
                                </div>
                            )}
                            {roomPlayers.length === 2 && room.ownerId !== currentUser.id && (
                                <div>
                                    <p>ホストがゲームを開始するまでお待ちください...</p>
                                    <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                                        <p style={{ fontSize: '12px', color: '#666', margin: '0 0 10px 0' }}>
                                            デモ用: ホストが開始したことにして進める
                                        </p>
                                        <button
                                            onClick={handleDemoStartGame}
                                            disabled={isStartingGame}
                                            style={{
                                                padding: '8px 16px',
                                                fontSize: '14px',
                                                backgroundColor: '#FF9800',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                cursor: isStartingGame ? 'not-allowed' : 'pointer',
                                                opacity: isStartingGame ? 0.6 : 1
                                            }}
                                        >
                                            {isStartingGame ? 'ゲーム開始中...' : 'ホストが開始したことにする'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {room.status === 'playing' && (
                    <div>
                        {/* バトルフィールド（ボード）を表示 */}
                        <div style={{ marginTop: '20px' }}>
                            <BoardDisplay
                                room={room}
                                currentUser={currentUser}
                                refreshTrigger={boardRefreshTrigger}
                            />
                        </div>
                        {/* 現在のユーザーの手札を表示 */}
                        <div style={{ marginTop: '20px' }}>
                            <HandDisplay
                                room={room}
                                currentUser={currentUser}
                                onSummonFollower={handleSummonFollower}
                            />
                        </div>
                    </div>
                )}

                {room.status === 'finish' && (
                    <div>
                        <div>
                            {(() => {
                                const winnerPlayer = roomPlayers.find(p => p.hp > 0);
                                const loserPlayer = roomPlayers.find(p => p.hp <= 0);
                                const winnerUser = winnerPlayer ? getUserById(winnerPlayer.userId, mockUsers) : null;
                                const loserUser = loserPlayer ? getUserById(loserPlayer.userId, mockUsers) : null;

                                if (winnerUser && loserUser) {
                                    return (
                                        <div>
                                            <div>
                                                {winnerUser.name} の勝利！
                                            </div>
                                            <button onClick={() => handleBackHome()}>
                                                ホームに戻る
                                            </button>
                                        </div>

                                    );
                                } else {
                                    return (
                                        <div>
                                            ゲームが終了しました
                                        </div>
                                    );
                                }
                            })()}
                        </div>
                    </div>
                )}
            </div >
        </div >
    );
}
