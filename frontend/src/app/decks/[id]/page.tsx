'use client';

import { useRouter, useParams } from 'next/navigation';
import { useDeck, useAvailableCards } from '@/app/decks/_hooks/useDecks';
import { DeckNameEditor } from '../_components/DeckNameEditor';
import { DeckCardList } from '../_components/DeckCardList';
import { AvailableCardList } from '../_components/AvailableCardList';
import { Footer } from '@/app/components/footer';
import { isRentalDeck, getRentalDeckDescription } from '@/lib/utils/deckUtils';
import { DeckBadge } from '../_components/DeckBadge';

export default function DeckEditPage() {
  const router = useRouter();
  const params = useParams();
  const deckId = params?.id as string;
  
  const { deck, error: deckError, loading: deckLoading, mutate: mutateDeck } = useDeck(deckId);
  const { availableCards, error: cardsError, loading: cardsLoading } = useAvailableCards(deckId);
  
  const isRental = isRentalDeck(deckId);

  // レンタルデッキの場合はRentalDeckCardsを、通常のデッキの場合はDeckCardsを使用
  const deckCards = isRental ? (deck?.RentalDeckCards || []) : (deck?.DeckCards || []);

  const handleDeckUpdated = () => {
    mutateDeck();
  };

  const handleCardAdded = () => {
    mutateDeck();
  };

  const handleCardRemoved = () => {
    mutateDeck();
  };

  if (deckError) {
    return (
      <div>
        <h1>エラー</h1>
        <p>デッキの読み込みに失敗しました</p>
        <button onClick={() => router.push('/decks')}>デッキ一覧に戻る</button>
      </div>
    );
  }

  if (deckLoading || !deck) {
    return (
      <div>
        <h1>読み込み中...</h1>
      </div>
    );
  }

  return (
    <div>
      <div>
        <button onClick={() => router.push('/decks')}>デッキ一覧に戻る</button>
        {!isRental && (
          <DeckNameEditor
            deckId={deckId}
            currentName={deck.name}
            onDeckUpdated={handleDeckUpdated}
          />
        )}
      </div>

      <h1>
        {deck.name}
        <DeckBadge isRental={isRental} />
      </h1>

      {isRental && (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '4px', 
          padding: '10px', 
          marginBottom: '20px' 
        }}>
          <p style={{ margin: 0, color: '#856404' }}>
            {getRentalDeckDescription()}
          </p>
        </div>
      )}

      <DeckCardList
        deckId={deckId}
        cards={deckCards}
        onCardRemoved={handleCardRemoved}
        isRental={isRental}
      />

      {!isRental && (
        <div style={{ marginTop: '20px' }}>
          <h2>利用可能なカード</h2>
          {cardsError ? (
            <p>カードの読み込みに失敗しました</p>
          ) : cardsLoading ? (
            <p>読み込み中...</p>
          ) : availableCards ? (
            <AvailableCardList
              deckId={deckId}
              availableCards={availableCards}
              onCardAdded={handleCardAdded}
              currentCardCount={deckCards.length}
              currentDeckCards={deckCards}
            />
          ) : (
            <p>利用可能なカードがありません</p>
          )}
        </div>
      )}
      <Footer />
    </div>
  );
}
