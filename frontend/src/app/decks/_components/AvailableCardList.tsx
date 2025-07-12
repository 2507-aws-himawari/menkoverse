import type { Follower } from '@/types/follower';
import { useCardOperation } from '@/app/decks/_hooks/useDecks';

interface Props {
  deckId: string;
  availableCards: Follower[];
  onCardAdded: () => void;
}

export function AvailableCardList({ deckId, availableCards, onCardAdded }: Props) {
  const { isLoading, error, execute } = useCardOperation();

  const handleAddCard = async (followerId: string) => {
    const result = await execute(followerId, async () => {
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

      return true;
    });

    if (result) {
      onCardAdded();
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      {availableCards.length > 0 ? (
        <div>
          {availableCards.map((card) => (
            <div key={card.id} style={{ padding: '10px', border: '1px solid #ddd', margin: '10px 0' }}>
              <h3>{card.name}</h3>
              <p>コスト: {card.cost} | 攻撃力: {card.attack} | HP: {card.hp}</p>
              <button 
                onClick={() => handleAddCard(card.id)}
                disabled={isLoading(card.id)}
              >
                {isLoading(card.id) ? '追加中...' : 'デッキに追加'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p>利用可能なカードがありません</p>
      )}
    </div>
  );
}
