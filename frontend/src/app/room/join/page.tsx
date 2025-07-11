'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { mockApi } from '@/lib/mockApi';
import { mockUsers, getPlayersByRoomId } from '@/lib/mockData';
import { currentUserAtom, availableRoomsAtom } from '@/lib/atoms';

export default function JoinRoomPage() {
    const [roomId, setRoomId] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
    const [availableRooms, setAvailableRooms] = useAtom(availableRoomsAtom);
    const router = useRouter();

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const rooms = await mockApi.getRooms();
                setAvailableRooms(rooms);
            } catch (error) {
                setAvailableRooms([]);
            }
        };
        fetchRooms();
    }, [setAvailableRooms]);

    const handleUserChange = (userId: string) => {
        const user = mockUsers.find(u => u.id === userId);
        if (user) {
            setCurrentUser(user);
        }
    };

    const handleJoinRoom = async () => {
        if (!roomId.trim()) {
            setErrorMessage('部屋IDを入力してください');
            return;
        }

        setIsJoining(true);
        setErrorMessage('');

        try {
            const roomData = await mockApi.getRoom({ roomId: roomId.trim() });

            if (!roomData) {
                setErrorMessage('部屋の情報を取得できませんでした');
                return;
            }

            const targetUrl = `/room/${encodeURIComponent(roomId.trim())}/${roomData.status}`;
            router.push(targetUrl);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : '参加に失敗しました');
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div>
            <div>
                <h1>ゲーム参加</h1>
                <div>
                    <div>
                        <label>ユーザー選択(demo用)</label>
                        <select
                            value={currentUser.id}
                            onChange={(e) => handleUserChange(e.target.value)}
                        >
                            {mockUsers.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <h3>部屋に参加</h3>
                        <div>
                            <label>あいことば</label>
                            <input
                                type="text"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                placeholder="ほけほけ"
                            />
                        </div>
                        <button
                            onClick={handleJoinRoom}
                            disabled={isJoining}
                        >
                            {isJoining ? '参加中...' : '参加'}
                        </button>
                    </div>

                    {errorMessage && (
                        <div>
                            <p>{errorMessage}</p>
                        </div>
                    )}

                    <div>
                        <h3>参加可能な部屋：</h3>
                        <div>
                            {availableRooms.map((room) => {
                                const roomPlayers = getPlayersByRoomId(room.id);
                                return (
                                    <div key={room.id}>
                                        <span>{room.id}</span>
                                        <span>{room.status === 'waiting' ? '待機中' :
                                            room.status === 'playing' ? 'プレイ中' : '終了'}</span>
                                        <span>({roomPlayers.length}/2)</span>
                                        {room.status === 'waiting' && roomPlayers.length < 2 && (
                                            <button
                                                onClick={async () => {
                                                    setRoomId(room.id);
                                                    setIsJoining(true);
                                                    setErrorMessage('');

                                                    try {
                                                        await mockApi.joinRoom({
                                                            roomId: room.id,
                                                            currentUser
                                                        });

                                                        const roomData = await mockApi.getRoom({ roomId: room.id });

                                                        if (!roomData) {
                                                            setErrorMessage('部屋の情報を取得できませんでした');
                                                            return;
                                                        }

                                                        const targetUrl = `/room/${encodeURIComponent(room.id)}/${roomData.status}`;
                                                        router.push(targetUrl);
                                                    } catch (error) {
                                                        setErrorMessage(error instanceof Error ? error.message : '参加に失敗しました');
                                                    } finally {
                                                        setIsJoining(false);
                                                    }
                                                }}
                                                disabled={isJoining}
                                            >
                                                参加
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                            {availableRooms.length === 0 && (
                                <div>利用可能な部屋がありません</div>
                            )}
                        </div>
                    </div>

                    <div>
                        <button onClick={() => router.push('/home')}>
                            ホームに戻る
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
