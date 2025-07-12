import { GAME_CONSTANTS } from './constants';
import { calculatePPMax, calculatePlayerTurn, getActivePlayer, recoverPlayerPP, switchTurns } from './gameLogic';
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
    updateMockRoomPlayers,
    updateMockHands,
    getFollowerById
} from './mockData';
import type {
    MockUser,
    MockRoom,
    MockRoomPlayer,
    MockDeck,
    MockDeckCard,
    MockHand,
    MockFollower,
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
    GetHandInput
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
                console.log(`★ StartGame: Auto-starting first turn for player ${firstUser.name}`);

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
                                console.log(`★ FIRST TURN START: Player ${firstUser.name} drew 1 card (${follower.name}) at first turn start`);
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
        console.log(`★ startTurn called for player ${input.currentUser.name} in room ${input.roomId}`);

        const room = getRoomById(input.roomId);
        if (!room) return null;

        const player = getPlayerByUserIdAndRoomId(input.currentUser.id, input.roomId);
        if (!player) return null;

        console.log(`★ Found player:`, { id: player.id, userId: player.userId, selectedDeckId: player.selectedDeckId });

        const roomPlayers = getPlayersByRoomId(input.roomId);
        const playerIndex = roomPlayers.findIndex((p: MockRoomPlayer) => p.userId === input.currentUser.id);

        const playerTurn = calculatePlayerTurn(room, playerIndex);
        player.turn = playerTurn;
        recoverPlayerPP(player);

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

                            console.log(`★ TURN START: Player ${input.currentUser.name} drew 1 card (${follower.name})`);
                            console.log(`★ New hand card:`, newHandCard);
                            console.log(`★ Total mockHands now:`, mockHands.length);
                            console.log(`★ Player hands now:`, mockHands.filter(h => h.roomPlayerId === player.id).length);
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Failed to draw card at turn start for player ${input.currentUser.name}:`, error);
            // ドローに失敗してもターン開始は継続
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

        console.log(`★ EndTurn: Player ${input.currentUser.name} is ending their turn`);

        switchTurns(room, activePlayer);

        // 次のターンのプレイヤーのターン開始処理を自動実行
        const newActivePlayer = getActivePlayer(room);
        if (newActivePlayer) {
            const nextUser = mockUsers.find(u => u.id === newActivePlayer.userId);
            if (nextUser) {
                console.log(`★ EndTurn: Auto-starting turn for next player ${nextUser.name}`);

                // ターン開始時の処理を直接実行（循環参照回避のため）
                const nextPlayer = getPlayerByUserIdAndRoomId(nextUser.id, input.roomId);
                if (nextPlayer) {
                    const roomPlayersForNext = getPlayersByRoomId(input.roomId);
                    const nextPlayerIndex = roomPlayersForNext.findIndex((p: MockRoomPlayer) => p.userId === nextUser.id);
                    const nextPlayerTurn = calculatePlayerTurn(room, nextPlayerIndex);
                    nextPlayer.turn = nextPlayerTurn;
                    recoverPlayerPP(nextPlayer);

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
                                    console.log(`★ TURN START AUTO: Player ${nextUser.name} drew 1 card (${follower.name}) at turn start`);
                                }
                            }
                        }
                    }
                }
            }
        }

        return room;
    },

    // PP消費（デモ用）
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

        console.log(`★ ForceEndOpponentTurn: Forcing end turn for player ${activePlayer ? mockUsers.find(u => u.id === activePlayer.userId)?.name : 'Unknown'}`);

        switchTurns(room, activePlayer);

        // 次のターンのプレイヤーのターン開始処理を自動実行（endTurnと同様）
        const newActivePlayer = getActivePlayer(room);
        if (newActivePlayer) {
            const nextUser = mockUsers.find(u => u.id === newActivePlayer.userId);
            if (nextUser) {
                console.log(`★ ForceEndOpponentTurn: Auto-starting turn for next player ${nextUser.name}`);

                // ターン開始時の処理を直接実行
                const nextPlayer = getPlayerByUserIdAndRoomId(nextUser.id, input.roomId);
                if (nextPlayer) {
                    const roomPlayersForNext = getPlayersByRoomId(input.roomId);
                    const nextPlayerIndex = roomPlayersForNext.findIndex((p: MockRoomPlayer) => p.userId === nextUser.id);
                    const nextPlayerTurn = calculatePlayerTurn(room, nextPlayerIndex);
                    nextPlayer.turn = nextPlayerTurn;
                    recoverPlayerPP(nextPlayer);

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
                                    console.log(`★ FORCE TURN START: Player ${nextUser.name} drew 1 card (${follower.name}) at forced turn start`);
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

        console.log(`Getting deck cards for deckId: ${player.selectedDeckId}`);
        const deckCards = getDeckCardsByDeckId(player.selectedDeckId);
        console.log(`Found ${deckCards.length} cards in deck ${player.selectedDeckId}:`, deckCards);

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

        console.log(`★ MANUAL DRAW: Player ${input.currentUser.name} drew ${count} cards from deck ${player.selectedDeckId}`);
        console.log(`★ New hand cards:`, newHandCards);
        console.log(`★ Total mockHands now:`, mockHands.length);
        console.log(`★ Player hands now:`, mockHands.filter(h => h.roomPlayerId === player.id).length);
        return newHandCards;
    },

    // プレイヤーの手札を取得
    getHand: async (input: GetHandInput): Promise<MockHand[]> => {
        const player = getPlayerByUserIdAndRoomId(input.currentUser.id, input.roomId);
        if (!player) throw new Error('プレイヤーが見つかりません');

        const hands = getHandsByRoomPlayerId(player.id);

        // 現在のアクティブプレイヤーも表示
        const room = getRoomById(input.roomId);
        const activePlayer = room ? getActivePlayer(room) : null;
        const activeUser = activePlayer ? mockUsers.find(u => u.id === activePlayer.userId) : null;

        console.log(`★ Getting hand for player ${input.currentUser.name} (playerId: ${player.id}):`, hands.length, 'cards');
        console.log(`★ Current active player: ${activeUser ? activeUser.name : 'None'}`);
        console.log(`★ Hand details:`, hands.map(h => ({ id: h.id, cardId: h.cardId })));
        return hands;
    },
};
