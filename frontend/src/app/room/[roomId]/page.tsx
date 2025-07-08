'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAtom } from 'jotai';
import { mockApi } from '../../../lib/mockData';
import { currentRoomAtom, loadingAtom, errorAtom } from '../../../lib/atoms';

export default function RoomPage() {
    const params = useParams();
    const rawRoomId = params?.roomId as string;
    const roomId = rawRoomId ? decodeURIComponent(rawRoomId) : '';
    const [room, setRoom] = useAtom(currentRoomAtom);
    const [loading, setLoading] = useAtom(loadingAtom);
    const [error, setError] = useAtom(errorAtom);

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                setLoading(true);
                const roomData = await mockApi.getRoom({ roomId });
                setRoom(roomData);
            } catch (err) {
                setError(err instanceof Error ? err.message : '部屋の取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };

        if (roomId) {
            fetchRoom();
            const interval = setInterval(fetchRoom, 2000);
            return () => clearInterval(interval);
        }
    }, [roomId]);

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

    return (
        <div>
            <div>
                <div>
                    <div>
                        <h1>ゲームルーム</h1>
                        <p>あいことば: {room.id}</p>
                        <p>ステータス: {room.status === 'waiting' ? '待機中' :
                            room.status === 'playing' ? 'プレイ中' : '終了'}
                        </p>
                    </div>

                    <div>
                        {room.players.map((player, index) => (
                            <div key={player.id}>
                                <div>
                                    <div>
                                        <span>
                                            {player.user.name.charAt(0)}
                                        </span>
                                    </div>
                                    <h3>
                                        {player.user.name}
                                    </h3>
                                    {player.userId === room.ownerId && (
                                        <span>
                                            ホスト
                                        </span>
                                    )}
                                    <p>
                                        待機中...
                                    </p>
                                </div>
                            </div>
                        ))}

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
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
