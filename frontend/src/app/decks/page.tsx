'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useSWR from 'swr';
import { createDeckSchema, type CreateDeckData } from '@/lib/schema/deck';
import type { DeckWithCards } from '@/types/deck';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DecksPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const { data: decks, error, mutate } = useSWR<DeckWithCards[]>('/api/decks', fetcher);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateDeckData>({
    resolver: zodResolver(createDeckSchema),
  });

  const onSubmit = async (data: CreateDeckData) => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('デッキの作成に失敗しました');
      }

      const newDeck = await response.json();
      reset();
      setShowCreateForm(false);
      router.push(`/decks/${newDeck.id}`);
    } catch (error) {
      console.error('デッキ作成エラー:', error);
      alert('デッキの作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!confirm('このデッキを削除しますか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('デッキの削除に失敗しました');
      }

      mutate();
    } catch (error) {
      console.error('デッキ削除エラー:', error);
      alert('デッキの削除に失敗しました');
    }
  };

  if (error) {
    return (
      <div>
        <h1>デッキ管理</h1>
        <p>デッキの読み込みに失敗しました</p>
        <button onClick={() => router.push('/home')}>ホームに戻る</button>
      </div>
    );
  }

  return (
    <div>
      <h1>デッキ管理</h1>
      <div>
        <button onClick={() => router.push('/home')}>ホームに戻る</button>
        <button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'キャンセル' : '新規作成'}
        </button>
      </div>

      {showCreateForm && (
        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc' }}>
          <h2>新しいデッキを作成</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="name">デッキ名</label>
              <input
                id="name"
                type="text"
                placeholder="デッキ名を入力"
                {...register('name')}
              />
              {errors.name && (
                <div style={{ color: 'red' }}>{errors.name.message}</div>
              )}
            </div>
            <div style={{ marginTop: '10px' }}>
              <button type="submit" disabled={isCreating}>
                {isCreating ? '作成中...' : '作成'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <h2>デッキ一覧</h2>
        {!decks ? (
          <p>読み込み中...</p>
        ) : decks.length === 0 ? (
          <p>デッキがありません。新規作成してください。</p>
        ) : (
          <div>
            {decks.map((deck) => (
              <div key={deck.id} style={{ padding: '10px', border: '1px solid #ddd', margin: '10px 0' }}>
                <h3>{deck.name}</h3>
                <p>カード数: {deck.DeckCards?.length || 0}</p>
                <div>
                  <button onClick={() => router.push(`/decks/${deck.id}`)}>
                    編集
                  </button>
                  <button 
                    onClick={() => handleDeleteDeck(deck.id)}
                    style={{ marginLeft: '10px', color: 'red' }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}