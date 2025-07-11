import type { Card } from "@/types/card";

export const ShowCard = ({ cardAttributes }: { cardAttributes: Card }) => {
  return (
    <div style={{ marginTop: "20px" }}>
      <p>id: {cardAttributes.id}</p>
      <p>名前: {cardAttributes.name}</p>
      <p>コスト: {cardAttributes.cost}</p>
      <p>攻撃力: {cardAttributes.attack}</p>
      <p>HP: {cardAttributes.hp}</p>
    </div>
  );
}