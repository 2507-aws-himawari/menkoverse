import { getUserById, getActivePlayer, calculatePPMax } from '@/lib/gameLogic';
import { GAME_CONSTANTS } from '@/lib/constants';
import { mockUsers, getPlayersByRoomId } from '@/lib/mockData';
import type { MockRoom, MockRoomPlayer } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface RoomDisplayProps {
    room: MockRoom;
}

export function RoomDisplay({ room }: RoomDisplayProps) {
    // プレイヤー情報を取得
    const roomPlayers = getPlayersByRoomId(room.id);
    const router = useRouter();

    const handleBackHome = () => {
        router.push('/home');
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
