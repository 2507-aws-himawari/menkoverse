import { GAME_CONSTANTS } from './constants';
import { calculatePPMax, calculatePlayerTurn, getActivePlayer, recoverPlayerPP, switchTurns, resetFollowerAttackStatus } from './gameLogic';
import {
    mockUsers,
    mockRooms,
    mockRoomPlayers,
    mockDecks,
    mockDeckCards,
    mockHands,
    getRoomById,
    getPlayersByRoomId,
    getPlayerByUserIdAndRoomId,
    getDecksByUserId,
    getDeckById,
    getDeckCardsByDeckId,
    getHandsByRoomPlayerId,
    getFollowerById,
    getBoardByRoomPlayerId,
    mockBoard
} from './mockData';
import type {
    MockUser,
    MockRoom,
    MockRoomPlayer,
    MockDeck,
    MockDeckCard,
    MockHand,
    MockFollower,
    MockBoardCard,
    CreateRoomInput,
    JoinRoomInput,
    GetRoomInput,
    StartGameInput,
    SelectDeckInput,
    GetDecksInput,
    UpdatePlayerStatusInput,
    StartTurnInput,
    EndTurnInput,
    ConsumePPInput,
    ForceEndOpponentTurnInput,
    DamagePlayerInput,
    DrawCardsInput,
    GetHandInput,
    SummonFollowerInput,
    SummonFollowerResult,
    AttackInput,
    AttackResult
} from './types';

export const mockApi = {
    createRoom: async (input: CreateRoomInput): Promise<MockRoom> => {
        const roomId = input.roomId || `room${Date.now()}`;
        const newRoom: MockRoom = {
            id: roomId,
            ownerId: input.currentUser.id,
            status: 'waiting',
        };

        mockRooms.push(newRoom);

        const newPlayer: MockRoomPlayer = {
            id: `player${Date.now()}`,
            roomId: roomId,
            userId: input.currentUser.id,
            hp: GAME_CONSTANTS.INITIAL_HP,
            pp: 1,
            turn: 1,
            turnStatus: 'ended',
            selectedDeckId: undefined,
        };
        mockRoomPlayers.push(newPlayer);

        return newRoom;
    },

    joinRoom: async (input: JoinRoomInput): Promise<MockRoomPlayer> => {
        const room = getRoomById(input.roomId);

        if (!room) {
            throw new Error(`部屋が見つかりません: ${input.roomId}`);
        }

        if (room.status !== 'waiting') {
            throw new Error(`この部屋は参加できません (状態: ${room.status})`);
        }

        // 既存のプレイヤーを取得
        const roomPlayers = getPlayersByRoomId(input.roomId);

        if (roomPlayers.length >= 2) {
            throw new Error('部屋が満員です');
        }

        const existingPlayer = getPlayerByUserIdAndRoomId(input.currentUser.id, input.roomId);

        if (existingPlayer) {
            return existingPlayer;
        }

        const newPlayer: MockRoomPlayer = {
            id: `player${Date.now()}`,
            roomId: input.roomId,
            userId: input.currentUser.id,
            hp: GAME_CONSTANTS.INITIAL_HP,
            pp: 1,
            turn: 1,
            turnStatus: 'ended',
            selectedDeckId: undefined,
        };

        mockRoomPlayers.push(newPlayer);

        // 2人揃っても自動でゲーム開始しない（手動開始に変更）
        return newPlayer;
    },

    // 部屋の情報を取得
    getRoom: async (input: GetRoomInput): Promise<MockRoom | null> => {
        const room = getRoomById(input.roomId) || null;
        return room;
    },

    // 利用可能な部屋一覧を取得
    getRooms: async (): Promise<MockRoom[]> => {
        return mockRooms;
    },

    // ゲーム開始
    startGame: async (input: StartGameInput): Promise<MockRoom | null> => {
        const room = getRoomById(input.roomId);
        if (!room) {
            throw new Error('部屋が見つかりません');
        }

        // デモモードでない場合のみホスト権限をチェック
        if (!input.isDemo && room.ownerId !== input.currentUser.id) {
            throw new Error('ホストのみゲームを開始できます');
        }

        // 既にゲーム中の場合はエラー
        if (room.status !== 'waiting') {
            throw new Error('ゲームは既に開始されています');
        }

        const roomPlayers = getPlayersByRoomId(input.roomId);
        if (roomPlayers.length !== 2) {
            throw new Error('プレイヤーが2人揃っていません');
        }

        // 両プレイヤーがデッキを選択しているかチェック
        const playersWithoutDeck = roomPlayers.filter(player => !player.selectedDeckId);
        if (playersWithoutDeck.length > 0) {
            throw new Error('すべてのプレイヤーがデッキを選択してください');
        }

        // ゲーム開始
        console.log(`Starting game for room ${input.roomId}, changing status from ${room.status} to playing`);
        room.status = 'playing';

        // ランダムでプレイヤーの順番を決定
        const shouldShuffle = Math.random() < 0.5;
        const [player1, player2] = shouldShuffle ? [roomPlayers[1], roomPlayers[0]] : roomPlayers;

        // ターン状態を設定
        if (player1) {
            player1.turn = 1;
            player1.pp = 1;
            player1.turnStatus = 'active';
        }
        if (player2) {
            player2.turn = 1;
            player2.pp = 0;
            player2.turnStatus = 'ended';
        }

        console.log(`Game started successfully. Room status: ${room.status}`);

        // 両プレイヤーに初期手札をドロー
        for (const player of roomPlayers) {
            const user = mockUsers.find(u => u.id === player.userId);
            if (user && player.selectedDeckId) {
                try {
                    const deckCards = getDeckCardsByDeckId(player.selectedDeckId);
                    if (deckCards.length > 0) {
                        const shuffledCards = [...deckCards].sort(() => Math.random() - 0.5);
                        const selectedCards = shuffledCards.slice(0, 5);

                        const newHandCards: MockHand[] = selectedCards.map((deckCard, index) => {
                            const follower = getFollowerById(deckCard.followerId);
                            if (!follower) throw new Error(`フォロワー「${deckCard.followerId}」が見つかりません`);
                            return {
                                id: `hand_${player.id}_initial_${index}`,
                                roomPlayerId: player.id,
                                cardId: deckCard.followerId,
                                cost: follower.cost,
                                attack: follower.attack,
                                hp: follower.hp,
                            };
                        });

                        mockHands.push(...newHandCards);
                        console.log(`Initial hand drawn for player ${user.name}: ${newHandCards.length} cards`);
                    }
                } catch (error) {
                    console.error(`Failed to draw initial hand for player ${user.name}:`, error);
                }
            }
        }

        // 最初のプレイヤーのターン開始処理を自動実行
        const firstActivePlayer = getActivePlayer(room);
        if (firstActivePlayer) {
            const firstUser = mockUsers.find(u => u.id === firstActivePlayer.userId);
            if (firstUser) {

                // ターン開始時の処理を直接実行
                const firstPlayer = getPlayerByUserIdAndRoomId(firstUser.id, input.roomId);
                if (firstPlayer && firstPlayer.selectedDeckId) {
                    const deckCards = getDeckCardsByDeckId(firstPlayer.selectedDeckId);
                    if (deckCards.length > 0) {
                        const shuffledCards = [...deckCards].sort(() => Math.random() - 0.5);
                        const selectedCard = shuffledCards[0];

                        if (selectedCard) {
                            const follower = getFollowerById(selectedCard.followerId);
                            if (follower) {
                                const newHandCard: MockHand = {
                                    id: `hand_${firstPlayer.id}_${Date.now()}_first_turn_draw`,
                                    roomPlayerId: firstPlayer.id,
                                    cardId: selectedCard.followerId,
                                    cost: follower.cost,
                                    attack: follower.attack,
                                    hp: follower.hp,
                                };

                                mockHands.push(newHandCard);
                            }
                        }
                    }
                }
            }
        }

        return room;
    },

    // デッキ選択
    selectDeck: async (input: SelectDeckInput): Promise<MockRoomPlayer | null> => {
        const room = getRoomById(input.roomId);
        if (!room) {
            throw new Error('部屋が見つかりません');
        }

        const player = getPlayerByUserIdAndRoomId(input.currentUser.id, input.roomId);
        if (!player) {
            throw new Error('プレイヤーが見つかりません');
        }

        // ゲーム開始前のみデッキ選択可能
        if (room.status !== 'waiting') {
            throw new Error('ゲーム開始後はデッキを変更できません');
        }

        // デッキIDを設定
        player.selectedDeckId = input.deckId;
        console.log(`Player ${input.currentUser.name} selected deck ${input.deckId}`);

        return player;
    },

    // ユーザーのデッキ一覧を取得
    getDecks: async (input: GetDecksInput): Promise<MockDeck[]> => {
        const userDecks = getDecksByUserId(input.currentUser.id);
        console.log(`Getting decks for user ${input.currentUser.name}:`, userDecks);
        return userDecks;
    },

    // プレイヤーの状態を更新
    updatePlayerStatus: async (input: UpdatePlayerStatusInput): Promise<MockRoomPlayer | null> => {
        const room = getRoomById(input.roomId);
        if (!room) return null;

        const player = getPlayerByUserIdAndRoomId(input.currentUser.id, input.roomId);
        if (!player) return null;

        if (input.hp !== undefined) {
            player.hp = Math.max(0, Math.min(input.hp, GAME_CONSTANTS.MAX_HP));
        }
        if (input.pp !== undefined) {
            const ppMax = calculatePPMax(player.turn);
            player.pp = Math.max(0, Math.min(input.pp, ppMax));
        }
        if (input.turn !== undefined) player.turn = input.turn;

        return player;
    },

    // ターン開始時のPP回復
    startTurn: async (input: StartTurnInput): Promise<MockRoomPlayer | null> => {
        const room = getRoomById(input.roomId);
        if (!room) return null;

        const player = getPlayerByUserIdAndRoomId(input.currentUser.id, input.roomId);
        if (!player) return null;

        const roomPlayers = getPlayersByRoomId(input.roomId);
        const playerIndex = roomPlayers.findIndex((p: MockRoomPlayer) => p.userId === input.currentUser.id);

        const playerTurn = calculatePlayerTurn(room, playerIndex);
        player.turn = playerTurn;
        recoverPlayerPP(player);

        // ターン開始時にフォロワーの攻撃権をリセット
        resetFollowerAttackStatus(player.id);

        // ターン開始時に1枚ドロー
        try {
            if (!player.selectedDeckId) {
                console.log(`Player ${input.currentUser.name} has no selected deck, skipping draw`);
            } else {
                const deckCards = getDeckCardsByDeckId(player.selectedDeckId);
                if (deckCards.length === 0) {
                    console.log(`Player ${input.currentUser.name} has no cards in deck ${player.selectedDeckId}, skipping draw`);
                } else {
                    // ランダムに1枚選択
                    const shuffledCards = [...deckCards].sort(() => Math.random() - 0.5);
                    const selectedCard = shuffledCards[0];

                    if (selectedCard) {
                        const follower = getFollowerById(selectedCard.followerId);
                        if (follower) {
                            const newHandCard: MockHand = {
                                id: `hand_${player.id}_${Date.now()}_turn_draw`,
                                roomPlayerId: player.id,
                                cardId: selectedCard.followerId,
                                cost: follower.cost,
                                attack: follower.attack,
                                hp: follower.hp,
                            };

                            // 手札に直接追加
                            mockHands.push(newHandCard);
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Failed to draw card at turn start for player ${input.currentUser.name}:`, error);
        }

        return player;
    },

    // ターン終了
    endTurn: async (input: EndTurnInput): Promise<MockRoom | null> => {
        const room = getRoomById(input.roomId);
        if (!room) return null;

        const activePlayer = getActivePlayer(room);
        if (!activePlayer || activePlayer.userId !== input.currentUser.id) {
            throw new Error('あなたのターンではありません');
        }

        const roomPlayers = getPlayersByRoomId(input.roomId);
        const player1 = roomPlayers[0];
        const player2 = roomPlayers[1];

        if (!player1 || !player2) return room;

        switchTurns(room, activePlayer);

        const newActivePlayer = getActivePlayer(room);
        if (newActivePlayer) {
            const nextUser = mockUsers.find(u => u.id === newActivePlayer.userId);
            if (nextUser) {
                const nextPlayer = getPlayerByUserIdAndRoomId(nextUser.id, input.roomId);
                if (nextPlayer) {
                    const roomPlayersForNext = getPlayersByRoomId(input.roomId);
                    const nextPlayerIndex = roomPlayersForNext.findIndex((p: MockRoomPlayer) => p.userId === nextUser.id);
                    const nextPlayerTurn = calculatePlayerTurn(room, nextPlayerIndex);
                    nextPlayer.turn = nextPlayerTurn;
                    recoverPlayerPP(nextPlayer);

                    // ターン開始時にフォロワーの攻撃権をリセット
                    resetFollowerAttackStatus(nextPlayer.id);

                    // ターン開始時に1枚ドロー
                    if (nextPlayer.selectedDeckId) {
                        const deckCards = getDeckCardsByDeckId(nextPlayer.selectedDeckId);
                        if (deckCards.length > 0) {
                            const shuffledCards = [...deckCards].sort(() => Math.random() - 0.5);
                            const selectedCard = shuffledCards[0];

                            if (selectedCard) {
                                const follower = getFollowerById(selectedCard.followerId);
                                if (follower) {
                                    const newHandCard: MockHand = {
                                        id: `hand_${nextPlayer.id}_${Date.now()}_turn_draw`,
                                        roomPlayerId: nextPlayer.id,
                                        cardId: selectedCard.followerId,
                                        cost: follower.cost,
                                        attack: follower.attack,
                                        hp: follower.hp,
                                    };

                                    mockHands.push(newHandCard);
                                }
                            }
                        }
                    }
                }
            }
        }

        return room;
    },

    // PP消費
    consumePP: async (input: ConsumePPInput): Promise<MockRoomPlayer | null> => {
        const room = getRoomById(input.roomId);
        if (!room) return null;

        const player = getPlayerByUserIdAndRoomId(input.currentUser.id, input.roomId);
        if (!player) return null;

        // アクティブプレイヤーかチェック
        const activePlayer = getActivePlayer(room);
        if (!activePlayer || activePlayer.userId !== input.currentUser.id) {
            throw new Error('あなたのターンではありません');
        }

        // PP不足チェック
        if (player.pp < input.ppCost) {
            throw new Error(`PPが不足しています（必要: ${input.ppCost}, 現在: ${player.pp}）`);
        }

        // PP消費
        player.pp -= input.ppCost;

        return player;
    },

    // 相手ターンを強制終了（デモ用）
    forceEndOpponentTurn: async (input: ForceEndOpponentTurnInput): Promise<MockRoom | null> => {
        const room = getRoomById(input.roomId);
        if (!room) return null;

        // アクティブプレイヤーを取得
        const activePlayer = getActivePlayer(room);
        if (!activePlayer) {
            throw new Error('アクティブプレイヤーが見つかりません');
        }

        if (activePlayer.userId === input.currentUser.id) {
            throw new Error('あなたがアクティブプレイヤーです。自分のターンを終了してください。');
        }

        const roomPlayers = getPlayersByRoomId(input.roomId);
        const player1 = roomPlayers[0]; // 先攻
        const player2 = roomPlayers[1]; // 後攻

        if (!player1 || !player2) {
            throw new Error('プレイヤーが不足しています');
        }

        switchTurns(room, activePlayer);

        // 次のターンのプレイヤーのターン開始処理を自動実行（endTurnと同様）
        const newActivePlayer = getActivePlayer(room);
        if (newActivePlayer) {
            const nextUser = mockUsers.find(u => u.id === newActivePlayer.userId);
            if (nextUser) {
                // ターン開始時の処理を直接実行
                const nextPlayer = getPlayerByUserIdAndRoomId(nextUser.id, input.roomId);
                if (nextPlayer) {
                    const roomPlayersForNext = getPlayersByRoomId(input.roomId);
                    const nextPlayerIndex = roomPlayersForNext.findIndex((p: MockRoomPlayer) => p.userId === nextUser.id);
                    const nextPlayerTurn = calculatePlayerTurn(room, nextPlayerIndex);
                    nextPlayer.turn = nextPlayerTurn;
                    recoverPlayerPP(nextPlayer);

                    // ターン開始時にフォロワーの攻撃権をリセット
                    resetFollowerAttackStatus(nextPlayer.id);

                    // ターン開始時に1枚ドロー
                    if (nextPlayer.selectedDeckId) {
                        const deckCards = getDeckCardsByDeckId(nextPlayer.selectedDeckId);
                        if (deckCards.length > 0) {
                            const shuffledCards = [...deckCards].sort(() => Math.random() - 0.5);
                            const selectedCard = shuffledCards[0];

                            if (selectedCard) {
                                const follower = getFollowerById(selectedCard.followerId);
                                if (follower) {
                                    const newHandCard: MockHand = {
                                        id: `hand_${nextPlayer.id}_${Date.now()}_force_turn_draw`,
                                        roomPlayerId: nextPlayer.id,
                                        cardId: selectedCard.followerId,
                                        cost: follower.cost,
                                        attack: follower.attack,
                                        hp: follower.hp,
                                    };

                                    mockHands.push(newHandCard);
                                }
                            }
                        }
                    }
                }
            }
        }

        return room;
    },

    // HP減少処理
    damagePlayer: async (input: DamagePlayerInput): Promise<MockRoomPlayer | null> => {
        const room = getRoomById(input.roomId);
        if (!room) return null;

        const targetPlayer = getPlayerByUserIdAndRoomId(input.targetUserId, input.roomId);
        if (!targetPlayer) return null;

        const currentPlayer = getPlayerByUserIdAndRoomId(input.currentUser.id, input.roomId);
        if (!currentPlayer) return null;

        // アクティブプレイヤーかチェック
        const activePlayer = getActivePlayer(room);
        if (!activePlayer || activePlayer.userId !== input.currentUser.id) {
            throw new Error('あなたのターンではありません');
        }

        // ダメージ適用
        const newHp = Math.max(0, targetPlayer.hp - input.damage);
        targetPlayer.hp = newHp;

        // 勝敗判定
        if (newHp <= 0) {
            room.status = 'finish';
        }

        return targetPlayer;
    },

    drawCards: async (input: DrawCardsInput): Promise<MockHand[]> => {
        const room = getRoomById(input.roomId);
        if (!room) throw new Error('ルームが見つかりません');

        const player = getPlayerByUserIdAndRoomId(input.currentUser.id, input.roomId);
        if (!player) throw new Error('プレイヤーが見つかりません');

        if (!player.selectedDeckId) throw new Error('デッキが選択されていません');

        const count = input.count || 5;

        const deckCards = getDeckCardsByDeckId(player.selectedDeckId);

        if (deckCards.length === 0) {
            throw new Error(`デッキ「${player.selectedDeckId}」にカードがありません。デッキのカード構成を確認してください。`);
        }

        // ランダムに指定枚数のカードを選択
        const shuffledCards = [...deckCards].sort(() => Math.random() - 0.5);
        const selectedCards = shuffledCards.slice(0, count);

        // 手札に追加するカードを生成
        const newHandCards: MockHand[] = selectedCards.map((deckCard, index) => {
            const follower = getFollowerById(deckCard.followerId);
            if (!follower) {
                throw new Error(`フォロワー「${deckCard.followerId}」が見つかりません`);
            }
            return {
                id: `hand_${player.id}_${Date.now()}_${index}`,
                roomPlayerId: player.id,
                cardId: deckCard.followerId,
                cost: follower.cost,
                attack: follower.attack,
                hp: follower.hp,
            };
        });

        // 手札に直接追加
        mockHands.push(...newHandCards);

        return newHandCards;
    },

    // プレイヤーの手札を取得
    getHand: async (input: GetHandInput): Promise<MockHand[]> => {
        const player = getPlayerByUserIdAndRoomId(input.currentUser.id, input.roomId);
        if (!player) throw new Error('プレイヤーが見つかりません');

        const hands = getHandsByRoomPlayerId(player.id);
        return hands;
    },

    // プレイヤーのボードを取得
    getBoard: async (input: { roomPlayerId: string }): Promise<MockBoardCard[]> => {
        const boards = getBoardByRoomPlayerId(input.roomPlayerId);
        return boards;
    },

    // フォロワーを召喚
    summonFollower: async (input: SummonFollowerInput): Promise<SummonFollowerResult> => {
        const room = getRoomById(input.roomId);
        if (!room) {
            return {
                success: false,
                message: 'ルームが見つかりません',
                reason: 'unknown'
            };
        }

        const player = getPlayerByUserIdAndRoomId(input.currentUser.id, input.roomId);
        if (!player) {
            return {
                success: false,
                message: 'プレイヤーが見つかりません',
                reason: 'unknown'
            };
        }

        // アクティブプレイヤーかチェック
        const activePlayer = getActivePlayer(room);
        if (!activePlayer || activePlayer.userId !== input.currentUser.id) {
            return {
                success: false,
                message: 'あなたのターンではありません',
                reason: 'not_your_turn'
            };
        }

        // 手札から該当カードを取得
        const handCard = mockHands.find(hand => hand.id === input.handCardId && hand.roomPlayerId === player.id);
        if (!handCard) {
            return {
                success: false,
                message: '指定された手札カードが見つかりません',
                reason: 'invalid_card'
            };
        }

        // PP不足チェック
        if (player.pp < handCard.cost) {
            return {
                success: false,
                message: `PPが不足しています（必要: ${handCard.cost}, 現在: ${player.pp}）`,
                reason: 'insufficient_pp'
            };
        }

        // ボードの空きスペースをチェック
        const currentBoardCards = getBoardByRoomPlayerId(player.id);
        if (currentBoardCards.length >= 5) {
            return {
                success: false,
                message: 'ボードが満員です（最大5体まで）',
                reason: 'board_full'
            };
        }

        // PP消費
        player.pp -= handCard.cost;

        // ボードにカードを追加
        const boardCard: MockBoardCard = {
            id: `board_${player.id}_${Date.now()}`,
            roomPlayerId: player.id,
            cardId: handCard.cardId,
            cost: handCard.cost,
            attack: handCard.attack,
            hp: handCard.hp,
            position: currentBoardCards.length,
            canAttack: false
        };

        mockBoard.push(boardCard);

        // 手札からカードを削除
        const handIndex = mockHands.findIndex(hand => hand.id === input.handCardId);
        if (handIndex !== -1) {
            mockHands.splice(handIndex, 1);
        }

        return {
            success: true,
            boardCard: boardCard,
            message: 'フォロワーを召喚しました'
        };
    },

    // フォロワーで攻撃
    attackWithFollower: async (input: AttackInput): Promise<AttackResult> => {
        const room = getRoomById(input.roomId);
        if (!room) {
            return {
                success: false,
                message: 'ルームが見つかりません',
                reason: 'unknown'
            };
        }

        const player = getPlayerByUserIdAndRoomId(input.currentUser.id, input.roomId);
        if (!player) {
            return {
                success: false,
                message: 'プレイヤーが見つかりません',
                reason: 'unknown'
            };
        }

        // アクティブプレイヤーかチェック
        const activePlayer = getActivePlayer(room);
        if (!activePlayer || activePlayer.userId !== input.currentUser.id) {
            return {
                success: false,
                message: 'あなたのターンではありません',
                reason: 'not_your_turn'
            };
        }

        // 攻撃者のフォロワーを取得
        const attackerCard = mockBoard.find(card =>
            card.id === input.attackerBoardCardId && card.roomPlayerId === player.id
        );
        if (!attackerCard) {
            return {
                success: false,
                message: '攻撃者フォロワーが見つかりません',
                reason: 'attacker_not_found'
            };
        }

        // 攻撃可能かチェック
        if (!attackerCard.canAttack) {
            return {
                success: false,
                message: 'このフォロワーは攻撃できません',
                reason: 'cannot_attack'
            };
        }

        const destroyedFollowers: string[] = [];

        if (input.targetType === 'player') {
            // プレイヤーへの攻撃
            const targetPlayer = getPlayerByUserIdAndRoomId(input.targetId, input.roomId);
            if (!targetPlayer) {
                return {
                    success: false,
                    message: '攻撃対象プレイヤーが見つかりません',
                    reason: 'target_not_found'
                };
            }

            // ダメージを与える
            const newHp = Math.max(0, targetPlayer.hp - attackerCard.attack);
            targetPlayer.hp = newHp;

            // 攻撃者は攻撃済みにする
            attackerCard.canAttack = false;

            // 勝敗判定
            if (newHp <= 0) {
                room.status = 'finish';
            }

            return {
                success: true,
                message: `プレイヤーに${attackerCard.attack}ダメージを与えました`,
                destroyedFollowers
            };

        } else if (input.targetType === 'follower') {
            // フォロワーへの攻撃
            const targetCard = mockBoard.find(card => card.id === input.targetId);
            if (!targetCard) {
                return {
                    success: false,
                    message: '攻撃対象フォロワーが見つかりません',
                    reason: 'target_not_found'
                };
            }

            // 相手のフォロワーかチェック
            if (targetCard.roomPlayerId === player.id) {
                return {
                    success: false,
                    message: '自分のフォロワーは攻撃できません',
                    reason: 'invalid_target'
                };
            }

            // 戦闘ダメージ計算
            const attackerDamage = attackerCard.attack;
            const defenderDamage = targetCard.attack;

            // 相互ダメージ
            attackerCard.hp -= defenderDamage;
            targetCard.hp -= attackerDamage;

            // 攻撃者は攻撃済みにする
            attackerCard.canAttack = false;

            // 破壊チェック
            if (attackerCard.hp <= 0) {
                const attackerIndex = mockBoard.findIndex(card => card.id === attackerCard.id);
                if (attackerIndex !== -1) {
                    mockBoard.splice(attackerIndex, 1);
                    destroyedFollowers.push(attackerCard.id);
                }
            }

            if (targetCard.hp <= 0) {
                const targetIndex = mockBoard.findIndex(card => card.id === targetCard.id);
                if (targetIndex !== -1) {
                    mockBoard.splice(targetIndex, 1);
                    destroyedFollowers.push(targetCard.id);
                }
            }

            return {
                success: true,
                message: `フォロワー同士の戦闘が発生しました`,
                destroyedFollowers
            };
        }

        return {
            success: false,
            message: '無効な攻撃対象です',
            reason: 'invalid_target'
        };
    },
};
