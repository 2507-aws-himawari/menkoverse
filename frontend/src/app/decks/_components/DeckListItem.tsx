import { useRouter } from 'next/navigation';
import type { DeckWithCards } from '@/types/deck';
import { useAsyncOperation } from '@/app/decks/_hooks/useDecks';

interface Props {
  deck: DeckWithCards;
  onDeckDeleted: () => void;
}

export function DeckListItem({ deck, onDeckDeleted }: Props) {
  const router = useRouter();
  const { loading, error, execute } = useAsyncOperation();

  const handleDelete = async () => {
    if (!confirm('このデッキを削除しますか？')) {
      return;
    }

    const result = await execute(async () => {
      const response = await fetch(`/api/decks/${deck.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('デッキの削除に失敗しました');
      }

      return true;
    });

    if (result) {
      onDeckDeleted();
    }
  };

  return (
    <div style={{ padding: '10px', border: '1px solid #ddd', margin: '10px 0' }}>
      <h3>{deck.name}</h3>
      <p>カード数: {deck.DeckCards?.length || 0}</p>
      {error && (
        <div style={{ color: 'red', fontSize: '14px' }}>
          {error}
        </div>
      )}
      <div>
        <button onClick={() => router.push(`/decks/${deck.id}`)}>
          編集
        </button>
        <button 
          onClick={handleDelete}
          disabled={loading}
          style={{ marginLeft: '10px', color: 'red' }}
        >
          {loading ? '削除中...' : '削除'}
        </button>
      </div>
    </div>
  );
}
