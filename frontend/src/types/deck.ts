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
  follower: {
    id: string;
    name: string;
    cost: number;
    attack: number;
    hp: number;
  };
}

export interface DeckWithCards extends Deck {
  DeckCards: DeckCard[];
}

export interface CreateDeckRequest {
  name: string;
}

export interface AddCardToDeckRequest {
  followerId: string;
}
