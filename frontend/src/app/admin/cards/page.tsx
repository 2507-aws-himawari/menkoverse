"use client";

import { useState } from "react";
import * as z from "zod/v4";

const card = z.object({
  id: z.string(),
  name: z.string().min(1, "名前は必須です"),
  cost: z.number().min(1, "コストは1以上でなければなりません").max(10, "コストは10以下でなければなりません"),
  attack: z.number().min(1, "攻撃力は1以上でなければなりません").max(100, "攻撃力は100以下でなければなりません"),
  hp: z.number().min(1, "HPは1以上でなければなりません").max(100, "HPは100以下でなければなりません"),
});

type Card = z.infer<typeof card>;

export default function AdminCardsPage() {
  const [cardAttributes, setCardAttributes] = useState<Card>({
    id: "",
    name: "",
    cost: 1,
    attack: 1,
    hp: 1,
  });
  const [showCard, setShowCard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCardNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardAttributes({ ...cardAttributes, name: e.target.value });
  };

  const handleCardCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardAttributes({ ...cardAttributes, cost: Number(e.target.value) });
  };

  const handleCardAttackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardAttributes({ ...cardAttributes, attack: Number(e.target.value) });
  };

  const handleCardHpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardAttributes({ ...cardAttributes, hp: Number(e.target.value) });
  };

  const publishCardId = () => {
    const cardId = `F-${crypto.randomUUID()}`;
    setCardAttributes({ ...cardAttributes, id: cardId });
  };

  const handleCreate = () => {
    const result = card.safeParse(cardAttributes);
    if (!result.success) {
      setError(result.error.issues[0]?.message || '不正な入力です');
      setShowCard(false);
      return;
    }
    setError(null);
    setShowCard(true);
    publishCardId();
  };

  return (
    <div>
      <h1>カード管理画面</h1>
      <div>
        <p>名前</p>
        <input type="text" placeholder="名前を入力" value={cardAttributes.name} onChange={handleCardNameChange} />
      </div>
      <div>
        <p>コスト</p>
        <input type="number" min={1} max={10} value={cardAttributes.cost} onChange={handleCardCostChange} />
      </div>
      <div>
        <p>攻撃力</p>
        <input type="number" min={1} max={100} value={cardAttributes.attack} onChange={handleCardAttackChange} />
      </div>
      <div>
        <p>HP</p>
        <input type="number" min={1} max={100} value={cardAttributes.hp} onChange={handleCardHpChange} />
      </div>
      <div>
        <button onClick={handleCreate}>
          作成
        </button>
      </div>
      {error && (
        <div style={{ color: 'red', marginTop: '8px' }}>{error}</div>
      )}
      {showCard && (
        <div style={{ marginTop: '16px', padding: '8px', border: '1px solid #ccc' }}>
          <p>カード情報</p>
          <p>カードID: {cardAttributes.id}</p>
          <p>名前: {cardAttributes.name}</p>
          <p>コスト: {cardAttributes.cost}</p>
          <p>攻撃力: {cardAttributes.attack}</p>
          <p>HP: {cardAttributes.hp}</p>
        </div>
      )}
    </div>
  );
}
