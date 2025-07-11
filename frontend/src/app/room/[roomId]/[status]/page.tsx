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
            <div>
                <div>
                    <h1>エラーが発生しました</h1>
                    <p>{error}</p>
                    <button onClick={() => {
                        clearError();
                        router.refresh();
                    }}>
                        再読み込み
                    </button>
                </div>
            </div>
        );
    }

    // ローディング状態
    if (loading && !room) {
        return (
            <div>
                <div>ロード中...</div>
            </div>
        );
    }

    // 部屋が見つからない場合
    if (!room) {
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
                    {/* ルーム全体の表示 */}
                    <RoomDisplay room={room} />

                    {/* ゲーム進行中の操作 */}
                    {room.status === 'playing' && (
                        <GameControls
                            room={room}
                            currentUser={currentUser}
                            loading={loading}
                            onConsumePP={gameActions.handleConsumePP}
                            onEndTurn={gameActions.handleEndTurn}
                            onForceEndOpponentTurn={gameActions.handleForceEndOpponentTurn}
                            onStartTurn={gameActions.handleStartTurn}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
