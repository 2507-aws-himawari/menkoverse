import type { Follower } from "@/types/follower";
import type { CreateDeckData, UpdateDeckData, AddCardToDeckData } from "@/lib/schema/deck";

export interface Deck {
  id: string;
  name: string;
  userId: string;
  user?: {
    id: string;
    name: string | null;
  };
  DeckCards?: DeckCard[];
}

export interface DeckCard {
  id: string;
  deckId: string;
  followerId: string;
  follower: Follower
}

export interface DeckWithCards extends Deck {
  DeckCards: DeckCard[];
}

// zodスキーマから型をエクスポート
export type CreateDeckInput = CreateDeckData;
export type UpdateDeckInput = UpdateDeckData;
export type AddCardToDeckInput = AddCardToDeckData;

// 後方互換性のためのエイリアス
export type CreateDeckRequest = CreateDeckData;
export type AddCardToDeckRequest = AddCardToDeckData;
