import { GAME_CONSTANTS } from './constants';
import type { MockUser, MockRoom, MockRoomPlayer, MockDeck, MockDeckCard, MockHand, MockFollower, MockBoardCard } from './types';

// ユーザー
export const mockUsers: MockUser[] = [
    { id: 'user1', name: 'ふがふが', isAdmin: true },
    { id: 'user2', name: 'ぴよぴよ', isAdmin: false },
    { id: 'user3', name: 'わんわん', isAdmin: false },
];

// 部屋
export let mockRooms: MockRoom[] = [
    {
        id: 'あいおうえお',
        ownerId: 'user1',
        status: 'waiting',
    },
    {
        id: 'かきくけこ',
        ownerId: 'user2',
        status: 'playing',
    },
];

// プレイヤー
export let mockRoomPlayers: MockRoomPlayer[] = [
    {
        id: 'player1',
        roomId: 'あいおうえお',
        userId: 'user1',
        hp: GAME_CONSTANTS.INITIAL_HP,
        pp: 1,
        turn: 1,
        turnStatus: 'active',
        selectedDeckId: 'deck3'
    },
    {
        id: 'player2',
        roomId: 'かきくけこ',
        userId: 'user2',
        hp: 18,
        pp: 1,
        turn: 1,
        turnStatus: 'active',
        selectedDeckId: 'deck3',
    },
    {
        id: 'player3',
        roomId: 'かきくけこ',
        userId: 'user1',
        hp: 18,
        pp: 0,
        turn: 1,
        turnStatus: 'ended',
        selectedDeckId: 'deck1',
    },
];

// デッキ
export let mockDecks: MockDeck[] = [
    {
        id: 'deck1',
        userId: 'user1',
        name: '攻撃型デッキ',
    },
    {
        id: 'deck2',
        userId: 'user1',
        name: '防御型デッキ',
    },
    {
        id: 'deck3',
        userId: 'user2',
        name: 'バランス型デッキ',
    },
    {
        id: 'deck4',
        userId: 'user2',
        name: '実験デッキ',
    },
    {
        id: 'deck5',
        userId: 'user3',
        name: 'コントロールデッキ',
    },
];

// デッキカード（デッキに含まれるカードの構成）
export let mockDeckCards: MockDeckCard[] = [
    // deck1 (攻撃型デッキ) のカード構成
    { id: 'deckcard1', followerId: 'card1', deckId: 'deck1' },
    { id: 'deckcard2', followerId: 'card1', deckId: 'deck1' },
    { id: 'deckcard3', followerId: 'card2', deckId: 'deck1' },
    { id: 'deckcard4', followerId: 'card2', deckId: 'deck1' },
    { id: 'deckcard5', followerId: 'card3', deckId: 'deck1' },
    { id: 'deckcard6', followerId: 'card3', deckId: 'deck1' },
    { id: 'deckcard7', followerId: 'card4', deckId: 'deck1' },
    { id: 'deckcard8', followerId: 'card5', deckId: 'deck1' },

    // deck2 (防御型デッキ) のカード構成
    { id: 'deckcard9', followerId: 'card6', deckId: 'deck2' },
    { id: 'deckcard10', followerId: 'card6', deckId: 'deck2' },
    { id: 'deckcard11', followerId: 'card7', deckId: 'deck2' },
    { id: 'deckcard12', followerId: 'card7', deckId: 'deck2' },
    { id: 'deckcard13', followerId: 'card8', deckId: 'deck2' },
    { id: 'deckcard14', followerId: 'card8', deckId: 'deck2' },
    { id: 'deckcard15', followerId: 'card9', deckId: 'deck2' },
    { id: 'deckcard16', followerId: 'card10', deckId: 'deck2' },

    // deck3 (バランス型デッキ) のカード構成
    { id: 'deckcard17', followerId: 'card1', deckId: 'deck3' },
    { id: 'deckcard18', followerId: 'card2', deckId: 'deck3' },
    { id: 'deckcard19', followerId: 'card3', deckId: 'deck3' },
    { id: 'deckcard20', followerId: 'card6', deckId: 'deck3' },
    { id: 'deckcard21', followerId: 'card7', deckId: 'deck3' },
    { id: 'deckcard22', followerId: 'card8', deckId: 'deck3' },
    { id: 'deckcard23', followerId: 'card4', deckId: 'deck3' },
    { id: 'deckcard24', followerId: 'card5', deckId: 'deck3' },

    // deck4 (実験デッキ) のカード構成
    { id: 'deckcard25', followerId: 'card1', deckId: 'deck4' },
    { id: 'deckcard26', followerId: 'card3', deckId: 'deck4' },
    { id: 'deckcard27', followerId: 'card5', deckId: 'deck4' },
    { id: 'deckcard28', followerId: 'card7', deckId: 'deck4' },
    { id: 'deckcard29', followerId: 'card9', deckId: 'deck4' },
    { id: 'deckcard30', followerId: 'card2', deckId: 'deck4' },
    { id: 'deckcard31', followerId: 'card4', deckId: 'deck4' },
    { id: 'deckcard32', followerId: 'card6', deckId: 'deck4' },

    // deck5 (コントロールデッキ) のカード構成
    { id: 'deckcard33', followerId: 'card8', deckId: 'deck5' },
    { id: 'deckcard34', followerId: 'card8', deckId: 'deck5' },
    { id: 'deckcard35', followerId: 'card9', deckId: 'deck5' },
    { id: 'deckcard36', followerId: 'card9', deckId: 'deck5' },
    { id: 'deckcard37', followerId: 'card10', deckId: 'deck5' },
    { id: 'deckcard38', followerId: 'card10', deckId: 'deck5' },
    { id: 'deckcard39', followerId: 'card6', deckId: 'deck5' },
    { id: 'deckcard40', followerId: 'card7', deckId: 'deck5' },
];

// 手札（プレイヤーが現在持っているカード）
export let mockHands: MockHand[] = [

];

// ボード（場に出ているフォロワー）
export let mockBoard: MockBoardCard[] = [

];

// 攻撃済みフォロワーのリスト（ターンごとにリセット）
export let attackedFollowersThisTurn: Set<string> = new Set();

// フォロワー（カードの基本情報）
export const mockFollowers: MockFollower[] = [
    { id: 'card1', name: 'ゴブリン', cost: 1, attack: 2, hp: 1 },
    { id: 'card2', name: 'ナイト', cost: 2, attack: 2, hp: 2 },
    { id: 'card3', name: 'アーチャー', cost: 3, attack: 3, hp: 2 },
    { id: 'card4', name: 'ウォーリア', cost: 4, attack: 4, hp: 3 },
    { id: 'card5', name: 'ドラゴン', cost: 5, attack: 5, hp: 4 },
    { id: 'card6', name: 'ガーディアン', cost: 2, attack: 1, hp: 4 },
    { id: 'card7', name: 'プリースト', cost: 3, attack: 2, hp: 4 },
    { id: 'card8', name: 'パラディン', cost: 4, attack: 2, hp: 6 },
    { id: 'card9', name: 'ワイバーン', cost: 5, attack: 3, hp: 6 },
    { id: 'card10', name: 'エンシェントドラゴン', cost: 6, attack: 4, hp: 7 },
];

// モックデータから部屋を検索する関数
export const getRoomById = (roomId: string): MockRoom | undefined => {
    return mockRooms.find(r => r.id === roomId);
};

// 部屋のプレイヤーを取得する関数
export const getPlayersByRoomId = (roomId: string): MockRoomPlayer[] => {
    return mockRoomPlayers.filter(p => p.roomId === roomId);
};

// 特定のプレイヤーを取得する関数
export const getPlayerByUserIdAndRoomId = (userId: string, roomId: string): MockRoomPlayer | undefined => {
    return mockRoomPlayers.find(p => p.userId === userId && p.roomId === roomId);
};

// ユーザーのデッキを取得する関数
export const getDecksByUserId = (userId: string): MockDeck[] => {
    return mockDecks.filter(deck => deck.userId === userId);
};

// デッキIDでデッキを取得する関数
export const getDeckById = (deckId: string): MockDeck | undefined => {
    return mockDecks.find(deck => deck.id === deckId);
};

// デッキのカード構成を取得する関数
export const getDeckCardsByDeckId = (deckId: string): MockDeckCard[] => {
    return mockDeckCards.filter(deckCard => deckCard.deckId === deckId);
};

// プレイヤーの手札を取得する関数
export const getHandsByRoomPlayerId = (roomPlayerId: string): MockHand[] => {
    return mockHands.filter(hand => hand.roomPlayerId === roomPlayerId);
};

// プレイヤーのボードを取得する関数
export const getBoardByRoomPlayerId = (roomPlayerId: string): MockBoardCard[] => {
    return mockBoard.filter(board => board.roomPlayerId === roomPlayerId);
};

// フォロワーIDでフォロワー情報を取得する関数
export const getFollowerById = (followerId: string): MockFollower | undefined => {
    return mockFollowers.find(follower => follower.id === followerId);
};
