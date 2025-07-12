import type { DeckCard, GroupedDeckCard } from '@/types/deck';
import { useCardOperation } from '@/app/decks/_hooks/useDecks';

interface Props {
  deckId: string;
  cards: DeckCard[];
  onCardRemoved: () => void;
}

export function DeckCardList({ deckId, cards, onCardRemoved }: Props) {
  const { isLoading, error, execute } = useCardOperation();

  // カードをグループ化する関数
  const groupCardsByFollower = (cards: DeckCard[]): GroupedDeckCard[] => {
    const grouped = cards.reduce((acc, card) => {
      const key = card.followerId;
      if (!acc[key]) {
        acc[key] = {
          follower: card.follower,
          cards: [],
          count: 0
        };
      }
      acc[key].cards.push(card);
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, GroupedDeckCard>);

    return Object.values(grouped);
  };

  const handleRemoveCard = async (groupedCard: GroupedDeckCard) => {
    if (!confirm(`${groupedCard.follower.name}を1枚削除しますか？`)) {
      return;
    }

    // 最初のカードを削除対象とする
    const targetCard = groupedCard.cards[0];
    
    if (!targetCard) {
      return;
    }
    
    const result = await execute(targetCard.id, async () => {
      const response = await fetch(`/api/decks/${deckId}/cards?deckCardId=${targetCard.id}`, {
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

  const groupedCards = groupCardsByFollower(cards);

  return (
    <div style={{ marginTop: '20px' }}>
      <h2>
        現在のカード ({cards.length}/40枚)
        {cards.length === 40 ? (
          <span style={{ color: 'green', marginLeft: '10px' }}>✓ 完成</span>
        ) : cards.length > 40 ? (
          <span style={{ color: 'red', marginLeft: '10px' }}>⚠ 40枚を超えています</span>
        ) : (
          <span style={{ color: 'orange', marginLeft: '10px' }}>あと{40 - cards.length}枚</span>
        )}
      </h2>
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      {cards.length > 0 ? (
        <div>
          {groupedCards.map((groupedCard) => (
            <div key={groupedCard.follower.id} style={{ padding: '10px', border: '1px solid #ddd', margin: '10px 0' }}>
              <h3>
                {groupedCard.follower.name}
                {groupedCard.count > 1 && (
                  <span style={{ color: '#666', marginLeft: '10px' }}>×{groupedCard.count}</span>
                )}
              </h3>
              <p>コスト: {groupedCard.follower.cost} | 攻撃力: {groupedCard.follower.attack} | HP: {groupedCard.follower.hp}</p>
              <button
                onClick={() => handleRemoveCard(groupedCard)}
                disabled={groupedCard.cards[0] ? isLoading(groupedCard.cards[0].id) : false}
                style={{ 
                  color: 'red',
                }}
              >
                {(groupedCard.cards[0] && isLoading(groupedCard.cards[0].id)) ? '削除中...' : '削除'}
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
