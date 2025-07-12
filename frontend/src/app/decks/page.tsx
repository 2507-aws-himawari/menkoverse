'use client';

import { useRouter } from 'next/navigation';
import { useDecks } from '@/app/decks/_hooks/useDecks';
import { CreateDeckForm } from './_components/CreateDeckForm';
import { DeckListItem } from './_components/DeckListItem';
import type { DeckWithCards } from '@/types/deck';
import { Footer } from '../components/footer';

export default function DecksPage() {
  const router = useRouter();
  const { decks, error, loading, mutate } = useDecks();

  const handleDeckCreated = (newDeck: DeckWithCards) => {
    router.push(`/decks/${newDeck.id}`);
  };

  const handleDeckDeleted = () => {
    mutate();
  };

  if (error) {
    return (
      <div>
        <h1>デッキ管理</h1>
        <p>デッキの読み込みに失敗しました</p>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <h1>デッキ管理</h1>

      <div>
        <CreateDeckForm onDeckCreated={handleDeckCreated} />
        <Footer />
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>デッキ一覧</h2>
        {loading ? (
          <p>読み込み中...</p>
        ) : !decks || decks.length === 0 ? (
          <p>デッキがありません。新規作成してください。</p>
        ) : (
          <div>
            {decks.map((deck) => (
              <DeckListItem
                key={deck.id}
                deck={deck}
                onDeckDeleted={handleDeckDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
