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
    onDamageToOpponent
}: GameControlsProps) {
    const activePlayer = getActivePlayer(room);
    const activeUser = activePlayer ? getUserById(activePlayer.userId, mockUsers) : null;
    const isActiveUser = activePlayer?.userId === currentUser.id;

    // プレイヤー情報を取得
    const roomPlayers = getPlayersByRoomId(room.id);

    return (
        <div>
            <div>
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
                        activePlayer={activePlayer}
                        loading={loading}
                        onForceEndOpponentTurn={onForceEndOpponentTurn}
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
        <div >
            <button
                onClick={onEndTurn}
                disabled={loading}
            >
                {loading ? 'ターン終了中...' : (currentPP === 0 ? 'ターン終了' : 'ターン終了')}
            </button>
        </div>
    );
}

interface InactivePlayerControlsProps {
    activePlayer: MockRoomPlayer | null;
    loading: boolean;
    onForceEndOpponentTurn: () => Promise<void>;
}

function InactivePlayerControls({
    activePlayer,
    loading,
    onForceEndOpponentTurn
}: InactivePlayerControlsProps) {
    return (
        <div >
            <p>相手のターンです。待機してください。</p>
            {/* デモ用：相手ターン終了ボタン */}
            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>デモ用操作</h4>
                <button
                    onClick={onForceEndOpponentTurn}
                    disabled={loading}
                    style={{
                        backgroundColor: '#orange',
                        color: 'red',
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px'
                    }}
                >
                    {loading ? '相手ターン終了中...' : '相手ターンを終了ボタンデモ用）'}
                </button>
            </div>
        </div>
    );
}
