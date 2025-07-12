'use client';

import { useRouter, useParams } from 'next/navigation';
import { useDeck, useAvailableCards } from '@/app/decks/_hooks/useDecks';
import { DeckNameEditor } from '../_components/DeckNameEditor';
import { DeckCardList } from '../_components/DeckCardList';
import { AvailableCardList } from '../_components/AvailableCardList';
import { Footer } from '@/app/components/footer';

export default function DeckEditPage() {
  const router = useRouter();
  const params = useParams();
  const deckId = params?.id as string;
  
  const { deck, error: deckError, loading: deckLoading, mutate: mutateDeck } = useDeck(deckId);
  const { availableCards, error: cardsError, loading: cardsLoading } = useAvailableCards(deckId);

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
        <DeckNameEditor
          deckId={deckId}
          currentName={deck.name}
          onDeckUpdated={handleDeckUpdated}
        />
      </div>

      <h1>{deck.name}</h1>

      <DeckCardList
        deckId={deckId}
        cards={deck.DeckCards || []}
        onCardRemoved={handleCardRemoved}
      />

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
            currentCardCount={deck.DeckCards?.length || 0}
            currentDeckCards={deck.DeckCards || []}
          />
        ) : (
          <p>利用可能なカードがありません</p>
        )}
      </div>
      <Footer />
    </div>
  );
}
