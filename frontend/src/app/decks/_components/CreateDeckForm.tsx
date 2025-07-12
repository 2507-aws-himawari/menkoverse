import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDeckSchema } from '@/lib/schema/deck';
import type { CreateDeckInput } from '@/types/deck';
import { useAsyncOperation } from '@/hooks/useDecks';

interface Props {
  onDeckCreated: (deck: any) => void;
}

export function CreateDeckForm({ onDeckCreated }: Props) {
  const [showForm, setShowForm] = useState(false);
  const { loading, error, execute, clearError } = useAsyncOperation();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateDeckInput>({
    resolver: zodResolver(createDeckSchema),
  });

  const onSubmit = async (data: CreateDeckInput) => {
    const result = await execute(async () => {
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

      return await response.json();
    });

    if (result) {
      reset();
      setShowForm(false);
      onDeckCreated(result);
    }
  };

  return (
    <div>
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'キャンセル' : '新規作成'}
      </button>

      {showForm && (
        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc' }}>
          <h2>新しいデッキを作成</h2>
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
                placeholder="デッキ名を入力"
                {...register('name')}
              />
              {errors.name && (
                <div style={{ color: 'red' }}>{errors.name.message}</div>
              )}
            </div>
            <div style={{ marginTop: '10px' }}>
              <button type="submit" disabled={loading}>
                {loading ? '作成中...' : '作成'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
