import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDeckSchema } from '@/lib/schema/deck';
import type { CreateDeckInput } from '@/types/deck';
import { useAsyncOperation } from '@/app/decks/_hooks/useDecks';

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
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>新しいデッキを作成</h2>
            {error && (
              <div style={{ color: 'red', marginBottom: '10px' }}>
                {error}
                <button onClick={clearError} style={{ marginLeft: '10px' }}>
                  ×
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>デッキ名</label>
                <input
                  id="name"
                  type="text"
                  placeholder="デッキ名を入力"
                  {...register('name')}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                {errors.name && (
                  <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{errors.name.message}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  キャンセル
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: loading ? '#ccc' : '#007bff',
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? '作成中...' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
