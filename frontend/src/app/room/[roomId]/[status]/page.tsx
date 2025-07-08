'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { mockApi, getUserById, GAME_CONSTANTS, getActivePlayer, isFirstPlayer } from '../../../../lib/mockData';
import { currentRoomAtom, loadingAtom, errorAtom, currentUserAtom } from '../../../../lib/atoms';

export default function RoomStatusPage() {
    const params = useParams();
    const router = useRouter();
    const rawRoomId = params?.roomId as string;
    const status = params?.status as string;
    const roomId = rawRoomId ? decodeURIComponent(rawRoomId) : '';
    const [room, setRoom] = useAtom(currentRoomAtom);
    const [loading, setLoading] = useAtom(loadingAtom);
    const [error, setError] = useAtom(errorAtom);
    const [currentUser] = useAtom(currentUserAtom);

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                setLoading(true);
                setError(null);
                const roomData = await mockApi.getRoom({ roomId });
                setRoom(roomData);
                if (roomData && roomData.status !== status) {
                    router.replace(`/room/${encodeURIComponent(roomId)}/${roomData.status}`);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : '部屋の取得に失敗しました');
                setRoom(null);
            } finally {
                setLoading(false);
            }
        };

        if (roomId && status) {
            fetchRoom();
            const interval = setInterval(fetchRoom, 2000);
            return () => clearInterval(interval);
        }
    }, [roomId, status, router, setRoom, setLoading, setError]);

    const handleStartTurn = async () => {
        if (!room) return;

        try {
            setLoading(true);
            await mockApi.startTurn({
                roomId: room.id,
                currentUser
            });

            // 部屋情報を再取得して更新
            const updatedRoom = await mockApi.getRoom({ roomId: room.id });
            setRoom(updatedRoom);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'ターン開始に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleEndTurn = async () => {
        if (!room) return;

        try {
            setLoading(true);
            await mockApi.endTurn({
                roomId: room.id,
                currentUser
            });

            // 部屋情報を再取得して更新
            const updatedRoom = await mockApi.getRoom({ roomId: room.id });
            setRoom(updatedRoom);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'ターン終了に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleForceEndOpponentTurn = async () => {
        if (!room) return;

        try {
            setLoading(true);
            await mockApi.forceEndOpponentTurn({
                roomId: room.id,
                currentUser
            });

            // 部屋情報を再取得して更新
            const updatedRoom = await mockApi.getRoom({ roomId: room.id });
            setRoom(updatedRoom);
        } catch (err) {
            setError(err instanceof Error ? err.message : '相手ターン終了に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleConsumePP = async (ppCost: number) => {
        if (!room) return;

        try {
            setLoading(true);
            await mockApi.consumePP({
                roomId: room.id,
                currentUser,
                ppCost
            });

            // 部屋情報を再取得して更新
            const updatedRoom = await mockApi.getRoom({ roomId: room.id });
            setRoom(updatedRoom);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'PP消費に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div>
                <div>ロード中...</div>
            </div>
        );
    }

    if (error || !room) {
        return (
            <div>
                <div>部屋が見つかりません</div>
            </div>
        );
    }
    if (room.status !== status) {
        return (
            <div>
                <div>リダイレクト中...</div>
            </div>
        );
    }
    return (
        <div>
            <div>
                <div>
                    {/* エラー表示 */}
                    {error && (
                        <div style={{
                            backgroundColor: '#ffebee',
                            color: '#c62828',
                            padding: '12px',
                            borderRadius: '4px',
                            marginBottom: '16px',
                            border: '1px solid #e57373'
                        }}>
                            エラー: {error}
                        </div>
                    )}

                    <div>
                        <h1>ゲームルーム</h1>
                        <p>あいことば: {room.id}</p>
                        <p>ステータス: {
                            room.status === 'waiting' ? '待機中' :
                                room.status === 'playing' ? 'プレイ中' :
                                    room.status === 'finish' ? '終了' : room.status
                        }</p>
                    </div>

                    <div>
                        {room.players.map((player, index) => {
                            const user = getUserById(player.userId);
                            if (!user) return null;

                            const activePlayer = getActivePlayer(room);
                            const isActivePlayer = activePlayer?.userId === player.userId;
                            const playerPosition = index === 0 ? '先攻' : '後攻';

                            return (
                                <div key={player.id}>
                                    <div>
                                        <div>
                                            <span>
                                                {user.name.charAt(0)}
                                            </span>
                                        </div>
                                        <h3>
                                            {user.name}
                                            {room.status === 'playing' && (
                                                <span style={{ marginLeft: '8px', fontSize: '14px' }}>
                                                    ({playerPosition})
                                                    {isActivePlayer && <span style={{ color: 'green' }}> 【アクティブ】</span>}
                                                </span>
                                            )}
                                        </h3>
                                        {player.userId === room.ownerId && (
                                            <span>
                                                ホスト
                                            </span>
                                        )}
                                        <div>
                                            <p>HP: {player.hp}/{GAME_CONSTANTS.MAX_HP}</p>
                                            <p>PP: {player.pp}/{GAME_CONSTANTS.MAX_PP}</p>
                                            <p>ターン: {player.turn}</p>
                                        </div>
                                        <p>
                                            {room.status === 'waiting' ? '待機中...' :
                                                room.status === 'playing' ? 'プレイ中' :
                                                    room.status === 'finish' ? 'ゲーム終了' : '状態不明'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                        {room.players.length < 2 && (
                            <div>
                                <div>
                                    <div></div>
                                    <p>プレイヤーを待機中...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {room.status === 'waiting' && (
                        <div>
                            <h2>
                                プレイヤー待機中
                            </h2>
                            <div>
                                <p>
                                    参加者: {room.players.length}/2
                                </p>
                                {room.players.length < 2 && (
                                    <p>もう1人のプレイヤーを待っています...</p>
                                )}
                            </div>
                        </div>
                    )}

                    {room.status === 'playing' && (
                        <div>
                            <h2>
                                ゲーム進行中
                            </h2>
                            <div>
                                <p>
                                    参加者: {room.players.length}/2
                                </p>

                                {/* 現在のターン情報 */}
                                {(() => {
                                    const activePlayer = getActivePlayer(room);
                                    const activeUser = activePlayer ? getUserById(activePlayer.userId) : null;
                                    return activeUser && (
                                        <p style={{ fontWeight: 'bold', color: 'blue' }}>
                                            現在のターン: {activeUser.name}
                                        </p>
                                    );
                                })()}

                                {/* アクティブプレイヤーのみに表示されるボタン */}
                                {(() => {
                                    const activePlayer = getActivePlayer(room);
                                    return activePlayer?.userId === currentUser.id && (
                                        <div style={{ marginTop: '16px' }}>
                                            <h3>あなたのターンです</h3>

                                            {/* PP消費デモボタン */}
                                            <div style={{ marginBottom: '12px' }}>
                                                <h4>PP消費デモ</h4>
                                                <button
                                                    onClick={() => handleConsumePP(1)}
                                                    disabled={loading}
                                                    style={{ marginRight: '8px' }}
                                                >
                                                    PP-1消費
                                                </button>
                                                <button
                                                    onClick={() => handleConsumePP(2)}
                                                    disabled={loading}
                                                    style={{ marginRight: '8px' }}
                                                >
                                                    PP-2消費
                                                </button>
                                                <button
                                                    onClick={() => handleConsumePP(3)}
                                                    disabled={loading}
                                                >
                                                    PP-3消費
                                                </button>
                                            </div>

                                            {/* ターン終了ボタン */}
                                            <button
                                                onClick={handleEndTurn}
                                                disabled={loading}
                                                style={{
                                                    backgroundColor: 'red',
                                                    color: 'white',
                                                    padding: '8px 16px',
                                                    border: 'none',
                                                    borderRadius: '4px'
                                                }}
                                            >
                                                {loading ? 'ターン終了中...' : 'ターン終了'}
                                            </button>
                                        </div>
                                    );
                                })()}

                                {/* 非アクティブプレイヤーへのメッセージと操作 */}
                                {(() => {
                                    const activePlayer = getActivePlayer(room);
                                    return activePlayer?.userId !== currentUser.id && (
                                        <div style={{ marginTop: '16px' }}>
                                            <p>相手のターンです。待機してください。</p>

                                            {/* デモ用：相手ターン終了ボタン */}
                                            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>デモ用操作</h4>
                                                <button
                                                    onClick={handleForceEndOpponentTurn}
                                                    disabled={loading}
                                                    style={{
                                                        backgroundColor: '#orange',
                                                        color: 'white',
                                                        padding: '6px 12px',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    {loading ? '相手ターン終了中...' : '相手ターンを終了（デモ用）'}
                                                </button>
                                                <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#666' }}>
                                                    ※ 実際のゲームでは相手が操作します
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* デバッグ用のターン開始ボタン（残しておく） */}
                                <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '16px' }}>
                                    <button
                                        onClick={handleStartTurn}
                                        disabled={loading}
                                    >
                                        {loading ? 'ターン開始中...' : 'ターン開始（PP+1）'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {room.status === 'finish' && (
                        <div>
                            <h2>
                                ゲーム終了
                            </h2>
                            <div>
                                <p>
                                    参加者: {room.players.length}/2
                                </p>
                                <p>ゲームが終了しました</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
