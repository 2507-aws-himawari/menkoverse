import type { DeckCard } from '@/types/deck';
import { useCardOperation } from '@/app/decks/_hooks/useDecks';

interface Props {
  deckId: string;
  cards: DeckCard[];
  onCardRemoved: () => void;
}

export function DeckCardList({ deckId, cards, onCardRemoved }: Props) {
  const { isLoading, error, execute } = useCardOperation();

  const handleRemoveCard = async (deckCardId: string) => {
    if (!confirm('このカードをデッキから削除しますか？')) {
      return;
    }

    const result = await execute(deckCardId, async () => {
      const response = await fetch(`/api/decks/${deckId}/cards?deckCardId=${deckCardId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('カードの削除に失敗しました');
      }

      return true;
    });

    if (result) {
      onCardRemoved();
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h2>現在のカード ({cards.length}枚)</h2>
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      {cards.length > 0 ? (
        <div>
          {cards.map((deckCard) => (
            <div key={deckCard.id} style={{ padding: '10px', border: '1px solid #ddd', margin: '10px 0' }}>
              <h3>{deckCard.follower.name}</h3>
              <p>コスト: {deckCard.follower.cost} | 攻撃力: {deckCard.follower.attack} | HP: {deckCard.follower.hp}</p>
              <button 
                onClick={() => handleRemoveCard(deckCard.id)}
                disabled={isLoading(deckCard.id)}
                style={{ color: 'red' }}
              >
                {isLoading(deckCard.id) ? '削除中...' : '削除'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p>カードがありません</p>
      )}
    </div>
  );
}
