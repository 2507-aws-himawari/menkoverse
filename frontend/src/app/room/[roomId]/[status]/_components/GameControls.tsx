import { getUserById, getActivePlayer, calculatePPMax } from '@/lib/gameLogic';
import { mockUsers, getPlayerByUserIdAndRoomId } from '@/lib/mockData';
import { useAtom } from 'jotai';
import { roomPlayersAtom } from '@/lib/atoms';
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

    // Atomからプレイヤー情報を取得
    const [roomPlayers] = useAtom(roomPlayersAtom);
    console.log("Room Players from Atom:", roomPlayers);

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

    // Atomから相手プレイヤーを取得
    const [roomPlayers] = useAtom(roomPlayersAtom);
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
    // Atomから相手プレイヤーを取得
    const [roomPlayers] = useAtom(roomPlayersAtom);
    const opponentPlayer = roomPlayers.find(p => p.userId !== currentUser.id);

    const handleSummonOpponentFollower = async (followerId: string) => {
        if (!onSummonFollowerToOpponent || !opponentPlayer) return;
        await onSummonFollowerToOpponent(opponentPlayer.userId, followerId);
    };

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
                        fontSize: '12px',
                        marginRight: '8px'
                    }}
                >
                    {loading ? '相手ターン終了中...' : '相手ターンを終了ボタンデモ用）'}
                </button>

                {/* 相手フィールドにフォロワー召喚デモボタン */}
                {onSummonFollowerToOpponent && opponentPlayer && (
                    <>
                        <button
                            onClick={() => handleSummonOpponentFollower('card1')}
                            disabled={loading}
                            style={{
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                marginRight: '8px'
                            }}
                        >
                            {loading ? '召喚中...' : '相手にゴブリン召喚'}
                        </button>
                        <button
                            onClick={() => handleSummonOpponentFollower('card5')}
                            disabled={loading}
                            style={{
                                backgroundColor: '#9C27B0',
                                color: 'white',
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px'
                            }}
                        >
                            {loading ? '召喚中...' : '相手にドラゴン召喚'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
