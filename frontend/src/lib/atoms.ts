import { atom } from 'jotai';
import type { MockUser, MockRoom } from './types';
import { mockUsers } from './mockData';

// ユーザー
export const currentUserAtom = atom<MockUser>(mockUsers[0]!);

// 部屋
export const currentRoomAtom = atom<MockRoom | null>(null);

// ローディング
export const loadingAtom = atom<boolean>(false);

// エラー
export const errorAtom = atom<string | null>(null);

// 部屋一覧
export const availableRoomsAtom = atom<MockRoom[]>([]);
