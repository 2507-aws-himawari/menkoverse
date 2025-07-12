import useSWR from 'swr';
import { useState } from 'react';
import type { DeckWithCards, CreateDeckInput, UpdateDeckInput } from '@/types/deck';
import type { Follower } from '@/types/follower';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useDecks() {
  const { data, error, mutate } = useSWR<DeckWithCards[]>('/api/decks', fetcher);

  const createDeck = async (input: CreateDeckInput): Promise<DeckWithCards> => {
    const response = await fetch('/api/decks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error('デッキの作成に失敗しました');
    }

    const newDeck = await response.json();
    mutate();
    return newDeck;
  };

  const deleteDeck = async (deckId: string): Promise<void> => {
    const response = await fetch(`/api/decks/${deckId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('デッキの削除に失敗しました');
    }

    mutate();
  };

  return {
    decks: data,
    error,
    loading: !data && !error,
    createDeck,
    deleteDeck,
    mutate,
  };
}

export function useDeck(deckId: string | null) {
  const { data, error, mutate } = useSWR<DeckWithCards>(
    deckId ? `/api/decks/${deckId}` : null,
    fetcher
  );

  const updateDeck = async (input: UpdateDeckInput): Promise<DeckWithCards> => {
    if (!deckId) throw new Error('デッキIDが必要です');

    const response = await fetch(`/api/decks/${deckId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error('デッキの更新に失敗しました');
    }

    const updatedDeck = await response.json();
    mutate();
    return updatedDeck;
  };

  const addCard = async (followerId: string): Promise<void> => {
    if (!deckId) throw new Error('デッキIDが必要です');

    const response = await fetch(`/api/decks/${deckId}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ followerId }),
    });

    if (!response.ok) {
      throw new Error('カードの追加に失敗しました');
    }

    mutate();
  };

  const removeCard = async (deckCardId: string): Promise<void> => {
    if (!deckId) throw new Error('デッキIDが必要です');

    const response = await fetch(`/api/decks/${deckId}/cards?deckCardId=${deckCardId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('カードの削除に失敗しました');
    }

    mutate();
  };

  return {
    deck: data,
    error,
    loading: !data && !error,
    updateDeck,
    addCard,
    removeCard,
    mutate,
  };
}

export function useAvailableCards(deckId: string | null) {
  const { data, error } = useSWR<Follower[]>(
    deckId ? `/api/decks/${deckId}/cards` : null,
    fetcher
  );

  return {
    availableCards: data,
    error,
    loading: !data && !error,
  };
}

export function useAsyncOperation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async <T>(operation: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await operation();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '操作に失敗しました';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    execute,
    clearError: () => setError(null),
  };
}
