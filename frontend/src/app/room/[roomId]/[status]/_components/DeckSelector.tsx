'use client';

import { useState, useEffect } from 'react';
import { mockApi } from '@/lib/mockApi';
import type { MockUser, MockRoom, MockRoomPlayer, MockDeck } from '@/lib/types';

interface DeckSelectorProps {
    room: MockRoom;
    currentUser: MockUser;
    currentPlayer: MockRoomPlayer;
    onDeckSelected: () => void;
}

export function DeckSelector({ room, currentUser, currentPlayer, onDeckSelected }: DeckSelectorProps) {
    const [decks, setDecks] = useState<MockDeck[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectedDeckId, setSelectedDeckId] = useState<string>(currentPlayer.selectedDeckId || '');

    // デッキ一覧を取得
    useEffect(() => {
        const loadDecks = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const userDecks = await mockApi.getDecks({ currentUser });
                setDecks(userDecks);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'デッキの取得に失敗しました');
            } finally {
                setIsLoading(false);
            }
        };

        loadDecks();
    }, [currentUser]);

    const handleSelectDeck = async (deckId: string) => {
        setIsSelecting(true);
        try {
            await mockApi.selectDeck({
                roomId: room.id,
                currentUser,
                deckId
            });
            setSelectedDeckId(deckId);
            onDeckSelected();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'デッキ選択に失敗しました');
        } finally {
            setIsSelecting(false);
        }
    };

    if (isLoading) {
        return <div>デッキを読み込み中...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>デッキの取得に失敗しました: {error}</div>;
    }

    if (!decks || decks.length === 0) {
        return (
            <div >
                <h3>デッキ選択</h3>
                <p>デッキがありません。先にデッキを作成してください。</p>
            </div>
        );
    }

    const selectedDeck = decks.find(deck => deck.id === selectedDeckId);

    return (
        <div >
            <h3>デッキ選択</h3>
            {selectedDeck && (
                <div >
                    <strong>選択中: {selectedDeck.name}</strong>
                </div>
            )}

            <div>
                {decks.map((deck: MockDeck) => (
                    <div key={deck.id} >
                        <div >
                            <div>
                                <strong>{deck.name}</strong>
                            </div>
                            <button
                                onClick={() => handleSelectDeck(deck.id)}
                                disabled={isSelecting || deck.id === selectedDeckId}>
                                {deck.id === selectedDeckId ? '選択中' : '選択'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
