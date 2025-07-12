'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useSWR from 'swr';
import { updateDeckSchema, type UpdateDeckData } from '@/lib/schema/deck';
import type { DeckWithCards } from '@/types/deck';
import type { Follower } from '@/types/follower';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DeckEditPage() {
  const router = useRouter();
  const params = useParams();
  const deckId = params?.id as string;
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const { data: deck, error: deckError, mutate: mutateDeck } = useSWR<DeckWithCards>(
    deckId ? `/api/decks/${deckId}` : null,
    fetcher
  );

  const { data: availableCards, error: cardsError } = useSWR<Follower[]>(
    deckId ? `/api/decks/${deckId}/cards` : null,
    fetcher
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateDeckData>({
    resolver: zodResolver(updateDeckSchema),
  });

  const onSubmit = async (data: UpdateDeckData) => {
    if (!deckId) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('デッキの更新に失敗しました');
      }

      mutateDeck();
      setShowEditForm(false);
      reset();
    } catch (error) {
      console.error('デッキ更新エラー:', error);
      alert('デッキの更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddCard = async (followerId: string) => {
    if (!deckId) return;

    try {
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

      mutateDeck();
    } catch (error) {
      console.error('カード追加エラー:', error);
      alert('カードの追加に失敗しました');
    }
  };

  const handleRemoveCard = async (deckCardId: string) => {
    if (!deckId || !confirm('このカードをデッキから削除しますか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/decks/${deckId}/cards?deckCardId=${deckCardId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('カードの削除に失敗しました');
      }

      mutateDeck();
    } catch (error) {
      console.error('カード削除エラー:', error);
      alert('カードの削除に失敗しました');
    }
  };

  if (deckError) {
    return (
      <div>
        <h1>エラー</h1>
        <p>デッキの読み込みに失敗しました</p>
        <button onClick={() => router.push('/decks')}>デッキ一覧に戻る</button>
      </div>
    );
  }

  if (!deck) {
    return (
      <div>
        <h1>読み込み中...</h1>
      </div>
    );
  }

  return (
    <div>
      <div>
        <button onClick={() => router.push('/decks')}>デッキ一覧に戻る</button>
        <button onClick={() => setShowEditForm(!showEditForm)}>
          {showEditForm ? 'キャンセル' : 'デッキ名変更'}
        </button>
      </div>

      <h1>{deck.name}</h1>

      {showEditForm && (
        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc' }}>
          <h2>デッキ名を変更</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="name">デッキ名</label>
              <input
                id="name"
                type="text"
                placeholder="新しいデッキ名"
                {...register('name')}
              />
              {errors.name && (
                <div style={{ color: 'red' }}>{errors.name.message}</div>
              )}
            </div>
            <div style={{ marginTop: '10px' }}>
              <button type="submit" disabled={isUpdating}>
                {isUpdating ? '更新中...' : '更新'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <h2>現在のカード ({deck.DeckCards?.length || 0}枚)</h2>
        {deck.DeckCards && deck.DeckCards.length > 0 ? (
          <div>
            {deck.DeckCards.map((deckCard) => (
              <div key={deckCard.id} style={{ padding: '10px', border: '1px solid #ddd', margin: '10px 0' }}>
                <h3>{deckCard.follower.name}</h3>
                <p>コスト: {deckCard.follower.cost} | 攻撃力: {deckCard.follower.attack} | HP: {deckCard.follower.hp}</p>
                <button 
                  onClick={() => handleRemoveCard(deckCard.id)}
                  style={{ color: 'red' }}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>カードがありません</p>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>利用可能なカード</h2>
        {cardsError ? (
          <p>カードの読み込みに失敗しました</p>
        ) : !availableCards ? (
          <p>読み込み中...</p>
        ) : (
          <div>
            {availableCards.map((card) => (
              <div key={card.id} style={{ padding: '10px', border: '1px solid #ddd', margin: '10px 0' }}>
                <h3>{card.name}</h3>
                <p>コスト: {card.cost} | 攻撃力: {card.attack} | HP: {card.hp}</p>
                <button onClick={() => handleAddCard(card.id)}>
                  デッキに追加
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}