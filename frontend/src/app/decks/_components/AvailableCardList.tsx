import type { Follower } from '@/types/follower';
import type { DeckCard, RentalDeckCard } from '@/types/deck';
import { useCardOperation } from '@/app/decks/_hooks/useDecks';

interface Props {
  deckId: string;
  availableCards: Follower[];
  onCardAdded: () => void;
  currentCardCount: number;
  currentDeckCards: (DeckCard | RentalDeckCard)[];
}

export function AvailableCardList({ deckId, availableCards, onCardAdded, currentCardCount, currentDeckCards }: Props) {
  const { isLoading, error, execute } = useCardOperation();

  // 特定のカードがデッキに何枚入っているかを計算
  const getCardCountInDeck = (followerId: string): number => {
    return currentDeckCards.filter(card => card.followerId === followerId).length;
  };

  // カードを追加できるかどうかを判定
  const canAddCard = (followerId: string): boolean => {
    const cardCountInDeck = getCardCountInDeck(followerId);
    return currentCardCount < 40 && cardCountInDeck < 3;
  };

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
      {currentCardCount >= 40 && (
        <div style={{ color: 'red', marginBottom: '10px', padding: '10px', border: '1px solid red', backgroundColor: '#ffe6e6' }}>
          デッキは40枚です。これ以上カードを追加できません。
        </div>
      )}
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      {availableCards.length > 0 ? (
        <div>
          {availableCards.map((card) => {
            const cardCountInDeck = getCardCountInDeck(card.id);
            const canAddThisCard = canAddCard(card.id);
            
            return (
              <div key={card.id} style={{ padding: '10px', border: '1px solid #ddd', margin: '10px 0' }}>
                <h3>
                  {card.name}
                  {cardCountInDeck > 0 && (
                    <span style={{ color: '#666', marginLeft: '10px' }}>
                      (デッキ内: {cardCountInDeck}枚)
                    </span>
                  )}
                </h3>
                <p>コスト: {card.cost} | 攻撃力: {card.attack} | HP: {card.hp}</p>
                <button 
                  onClick={() => handleAddCard(card.id)}
                  disabled={isLoading(card.id) || !canAddThisCard}
                  style={{ 
                    color: !canAddThisCard ? '#ccc' : 'inherit',
                    cursor: !canAddThisCard ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLoading(card.id) ? '追加中...' : 
                   currentCardCount >= 40 ? 'デッキ上限' :
                   cardCountInDeck >= 3 ? '上限に達しました' : 'デッキに追加'}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p>利用可能なカードがありません</p>
      )}
    </div>
  );
}
