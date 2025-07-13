import { atom } from 'jotai';
import type { MockUser, MockRoom, MockRoomPlayer } from './types';
import { mockUsers } from './mockData';

// ユーザー
export const currentUserAtom = atom<MockUser>(mockUsers[0]!);

// 部屋
export const currentRoomAtom = atom<MockRoom | null>(null);

// 部屋のプレイヤー一覧
export const roomPlayersAtom = atom<MockRoomPlayer[]>([]);

// ローディング
export const loadingAtom = atom<boolean>(false);

// エラー
export const errorAtom = atom<string | null>(null);

// 部屋一覧
export const availableRoomsAtom = atom<MockRoom[]>([]);

export const setRoomAtom = atom(
    null,
    (get, set, room: MockRoom | null) => {
        set(currentRoomAtom, room);
    }
);

export const setLoadingAtom = atom(
    null,
    (get, set, loading: boolean) => {
        set(loadingAtom, loading);
    }
);

export const setErrorAtom = atom(
    null,
    (get, set, error: string | null) => {
        set(errorAtom, error);
    }
);

export const startLoadingAtom = atom(
    null,
    (get, set) => {
        set(loadingAtom, true);
        set(errorAtom, null);
    }
);

export const endLoadingAtom = atom(
    null,
    (get, set) => {
        set(loadingAtom, false);
    }
);

export const setErrorAndEndLoadingAtom = atom(
    null,
    (get, set, error: string) => {
        set(errorAtom, error);
        set(loadingAtom, false);
    }
);

// Room Players管理用のAtom
export const setRoomPlayersAtom = atom(
    null,
    (get, set, players: MockRoomPlayer[]) => {
        set(roomPlayersAtom, players);
    }
);

export const clearRoomPlayersAtom = atom(
    null,
    (get, set) => {
        set(roomPlayersAtom, []);
    }
);
