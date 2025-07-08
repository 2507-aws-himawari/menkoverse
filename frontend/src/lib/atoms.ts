import { atom } from 'jotai';
import type { MockUser, MockRoom } from './mockData';
import { mockUsers } from './mockData';

// 現在のユーザー
export const currentUserAtom = atom<MockUser>(mockUsers[0]!);

// 現在の部屋
export const currentRoomAtom = atom<MockRoom | null>(null);

// ローディング状態
export const loadingAtom = atom<boolean>(false);

// エラー状態
export const errorAtom = atom<string | null>(null);

// 利用可能な部屋一覧
export const availableRoomsAtom = atom<MockRoom[]>([]);
