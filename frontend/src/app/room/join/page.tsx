'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { mockApi } from '@/lib/mockApi';
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
                        {roomsLoading && <div>部屋一覧を読み込み中...</div>}
                        {roomsError && <div>部屋一覧の取得に失敗しました: {roomsError.message}</div>}
                        <div>
                            {availableRooms.map((room) => {
                                return (
                                    <div key={room.id}>
                                        <span>{room.id}</span>
                                        <span>{room.status === 'waiting' ? '待機中' :
                                            room.status === 'playing' ? 'プレイ中' : '終了'}</span>
                                        {room.status === 'waiting' && (
                                            <button
                                                onClick={async () => {
                                                    setRoomId(room.id);
                                                    setIsJoining(true);
                                                    setErrorMessage('');

                                                    try {
                                                        // 新しいAPIエンドポイントを使用
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

                                                        // 参加成功後、部屋情報をAPIから取得
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
                    <Footer />
                </div>
            </div>
        </div>
    );
}
