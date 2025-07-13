import { useRouter } from 'next/navigation';
import type { DeckWithCards } from '@/types/deck';
import { useAsyncOperation } from '@/app/decks/_hooks/useDecks';
import { isRentalDeck } from '@/lib/utils/deckUtils';
import { DeckBadge } from './DeckBadge';

interface Props {
  deck: DeckWithCards;
  onDeckDeleted: () => void;
}

export function DeckListItem({ deck, onDeckDeleted }: Props) {
  const router = useRouter();
  const { loading, error, execute } = useAsyncOperation();

  // カードの種類数を計算
  const totalCards = deck.DeckCards?.length ?? deck.RentalDeckCards?.length ?? 0;
  const isRental = isRentalDeck(deck.id);

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
      <h3>
        {deck.name}
        <DeckBadge isRental={isRental} />
      </h3>
      <p>
        カード数: {totalCards}/40枚
        {totalCards === 40 ? (
          <span style={{ color: 'green', marginLeft: '10px' }}>✓ 完成</span>
        ) : totalCards > 40 ? (
          <span style={{ color: 'red', marginLeft: '10px' }}>⚠ 40枚を超えています</span>
        ) : (
          <span style={{ color: 'orange', marginLeft: '10px' }}>未完成</span>
        )}
      </p>
      {error && (
        <div style={{ color: 'red', fontSize: '14px' }}>
          {error}
        </div>
      )}
      <div>
        <button onClick={() => router.push(`/decks/${deck.id}`)}>
          {isRental ? '閲覧' : '編集'}
        </button>
        {!isRental && (
          <button 
            onClick={handleDelete}
            disabled={loading}
            style={{ marginLeft: '10px', color: 'red' }}
          >
            {loading ? '削除中...' : '削除'}
          </button>
        )}
      </div>
    </div>
  );
}
