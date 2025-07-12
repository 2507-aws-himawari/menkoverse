import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateDeckSchema } from '@/lib/schema/deck';
import type { UpdateDeckInput } from '@/types/deck';
import { useAsyncOperation } from '@/app/decks/_hooks/useDecks';
import { isRentalDeck } from '@/lib/utils/deckUtils';
import { DeckBadge } from './DeckBadge';

interface Props {
  deckId: string;
  currentName: string;
  onDeckUpdated: () => void;
}

export function DeckNameEditor({ deckId, currentName, onDeckUpdated }: Props) {
  const [showForm, setShowForm] = useState(false);
  const { loading, error, execute, clearError } = useAsyncOperation();
  const isRental = isRentalDeck(deckId);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateDeckInput>({
    resolver: zodResolver(updateDeckSchema),
  });

  const onSubmit = async (data: UpdateDeckInput) => {
    const result = await execute(async () => {
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

      return await response.json();
    });

    if (result) {
      reset();
      setShowForm(false);
      onDeckUpdated();
    }
  };

  // レンタルデッキの場合は編集不可
  if (isRental) {
    return (
      <div>
        <h2>
          {currentName}
          <DeckBadge isRental={true} />
        </h2>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'キャンセル' : 'デッキ名変更'}
      </button>

      {showForm && (
        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc' }}>
          <h2>デッキ名を変更</h2>
          {error && (
            <div style={{ color: 'red', marginBottom: '10px' }}>
              {error}
              <button onClick={clearError} style={{ marginLeft: '10px' }}>
                ×
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="name">デッキ名</label>
              <input
                id="name"
                type="text"
                placeholder="新しいデッキ名"
                defaultValue={currentName}
                {...register('name')}
              />
              {errors.name && (
                <div style={{ color: 'red' }}>{errors.name.message}</div>
              )}
            </div>
            <div style={{ marginTop: '10px' }}>
              <button type="submit" disabled={loading}>
                {loading ? '更新中...' : '更新'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
