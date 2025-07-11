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
}

export function GameControls({
    room,
    currentUser,
    loading,
    onConsumePP,
    onEndTurn,
    onForceEndOpponentTurn,
    onStartTurn
}: GameControlsProps) {
    const activePlayer = getActivePlayer(room);
    const activeUser = activePlayer ? getUserById(activePlayer.userId, mockUsers) : null;
    const isActiveUser = activePlayer?.userId === currentUser.id;

    // プレイヤー情報を取得
    const roomPlayers = getPlayersByRoomId(room.id);

    return (
        <div>
            <h2>ゲーム進行中</h2>
            <div>
                <p>参加者: {roomPlayers.length}/2</p>

                {/* 現在のターン情報 */}
                {activeUser && (
                    <p style={{ fontWeight: 'bold', color: 'blue' }}>
                        現在のターン: {activeUser.name}
                    </p>
                )}

                {/* アクティブプレイヤーのみに表示される操作 */}
                {isActiveUser ? (
                    <ActivePlayerControls
                        room={room}
                        currentUser={currentUser}
                        loading={loading}
                        onConsumePP={onConsumePP}
                        onEndTurn={onEndTurn}
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
}

function ActivePlayerControls({
    room,
    currentUser,
    loading,
    onConsumePP,
    onEndTurn
}: ActivePlayerControlsProps) {
    const currentPlayer = getPlayerByUserIdAndRoomId(currentUser.id, room.id);
    const currentPP = currentPlayer?.pp || 0;
    const currentTurn = currentPlayer?.turn || 1;
    const ppMax = calculatePPMax(currentTurn);

    return (
        <div style={{ marginTop: '16px' }}>
            <h3>あなたのターンです</h3>

            {/* PP消費デモボタン */}
            <div style={{ marginBottom: '12px' }}>
                <h4>アクション（PP消費）</h4>
                <button
                    onClick={() => onConsumePP(1)}
                    disabled={loading || currentPP < 1}
                    style={{
                        marginRight: '8px',
                        opacity: currentPP < 1 ? 0.5 : 1
                    }}
                >
                    PP-1消費 {currentPP < 1 && '(不足)'}
                </button>
                <button
                    onClick={() => onConsumePP(2)}
                    disabled={loading || currentPP < 2}
                    style={{
                        marginRight: '8px',
                        opacity: currentPP < 2 ? 0.5 : 1
                    }}
                >
                    PP-2消費 {currentPP < 2 && '(不足)'}
                </button>
                <button
                    onClick={() => onConsumePP(3)}
                    disabled={loading || currentPP < 3}
                    style={{
                        opacity: currentPP < 3 ? 0.5 : 1
                    }}
                >
                    PP-3消費 {currentPP < 3 && '(不足)'}
                </button>
            </div>

            {/* ターン終了ボタン */}
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
