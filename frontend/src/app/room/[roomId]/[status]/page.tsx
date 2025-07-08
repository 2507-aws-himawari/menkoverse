'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { mockApi, getUserById } from '../../../../lib/mockData';
import { currentRoomAtom, loadingAtom, errorAtom } from '../../../../lib/atoms';

export default function RoomStatusPage() {
    const params = useParams();
    const router = useRouter();
    const rawRoomId = params?.roomId as string;
    const status = params?.status as string;
    const roomId = rawRoomId ? decodeURIComponent(rawRoomId) : '';
    const [room, setRoom] = useAtom(currentRoomAtom);
    const [loading, setLoading] = useAtom(loadingAtom);
    const [error, setError] = useAtom(errorAtom);

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
                                        </h3>
                                        {player.userId === room.ownerId && (
                                            <span>
                                                ホスト
                                            </span>
                                        )}
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
                                <p>ゲームが進行中です</p>
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
