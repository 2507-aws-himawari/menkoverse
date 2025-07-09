"use client";

import { useState } from "react";

type Card = {
  id: string;
  name: string;
  cost: number;
  attack: number;
  hp: number;
};

export default function AdminCardsPage() {
  const [card, setCard] = useState<Card>({
    id: "",
    name: "",
    cost: 1,
    attack: 1,
    hp: 1,
  });
  const [showCard, setShowCard] = useState(false);

  const handleCardNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCard({ ...card, name: e.target.value });
  };

  const handleCardCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCard({ ...card, cost: Number(e.target.value) });
  };

  const handleCardAttackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCard({ ...card, attack: Number(e.target.value) });
  };

  const handleCardHpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCard({ ...card, hp: Number(e.target.value) });
  };

  const publishCardId = () => {
    const cardId = `F-${crypto.randomUUID()}`;
    setCard({ ...card, id: cardId });
  };

  return (
    <div>
      <h1>カード管理画面</h1>
      <div>
        <p>名前</p>
        <input type="text" placeholder="名前を入力" value={card.name} onChange={handleCardNameChange} />
      </div>
      <div>
        <p>コスト</p>
        <input type="number" min={1} max={10} value={card.cost} onChange={handleCardCostChange} />
      </div>
      <div>
        <p>攻撃力</p>
        <input type="number" min={1} max={100} value={card.attack} onChange={handleCardAttackChange} />
      </div>
      <div>
        <p>HP</p>
        <input type="number" min={1} max={100} value={card.hp} onChange={handleCardHpChange} />
      </div>
      <div>
        <button
          onClick={() => {
            setShowCard(true);
            publishCardId();
          }}
        >
          作成
        </button>
      </div>
      {showCard && (
        <div style={{ marginTop: '16px', padding: '8px', border: '1px solid #ccc' }}>
          <p>カード情報</p>
          <p>カードID: {card.id}</p>
          <p>名前: {card.name}</p>
          <p>コスト: {card.cost}</p>
          <p>攻撃力: {card.attack}</p>
          <p>HP: {card.hp}</p>
        </div>
      )}
    </div>
  );
}
