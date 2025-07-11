"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/v4";

const card = z.object({
	id: z.string(),
	name: z.string().min(1, "名前は必須です"),
	cost: z
		.number()
		.min(1, "コストは1以上でなければなりません")
		.max(10, "コストは10以下でなければなりません"),
	attack: z
		.number()
		.min(1, "攻撃力は1以上でなければなりません")
		.max(100, "攻撃力は100以下でなければなりません"),
	hp: z
		.number()
		.min(1, "HPは1以上でなければなりません")
		.max(100, "HPは100以下でなければなりません"),
});

type Card = z.infer<typeof card>;

export default function AdminCardsPage() {
	const [showCard, setShowCard] = useState(false);
  const [cardAttributes, setCardAttributes] = useState<Card>({
    id: "",
    name: "",
    cost: 1,
    attack: 1,
    hp: 1,
  });
	const [error, setError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<Card>({
		resolver: zodResolver(card),
    defaultValues: {
      id: "",
      name: "",
      cost: 1,
      attack: 1,
      hp: 1,
		},
	});

	const onSubmit = async (data: Card) => {
		const cardId = `F-${crypto.randomUUID()}`;
		data.id = cardId;

		try {
			const response = await fetch("/api/admin/cards", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error("カードの作成に失敗しました");
			}

			const result = await response.json();
		} catch (error) {
			setError("カードの作成に失敗しました");
		}
		setShowCard(true);
    setCardAttributes(data);
    reset();
	};

	return (
		<div>
			<h1>カード管理画面</h1>
			<form onSubmit={handleSubmit(onSubmit)}>
				<div>
					<p>名前</p>
					<input type="text" placeholder="名前を入力" {...register("name")} />
					{errors.name && <div style={{ color: "red" }}>{errors.name.message}</div>}
				</div>
				<div>
					<p>コスト</p>
					<input type="number" min={1} max={10} {...register("cost", { valueAsNumber: true })} />
					{errors.cost && <div style={{ color: "red" }}>{errors.cost.message}</div>}
				</div>
				<div>
					<p>攻撃力</p>
					<input type="number" min={1} max={100} {...register("attack", { valueAsNumber: true })} />
					{errors.attack && <div style={{ color: "red" }}>{errors.attack.message}</div>}
				</div>
				<div>
					<p>HP</p>
					<input type="number" min={1} max={100} {...register("hp", { valueAsNumber: true })} />
					{errors.hp && <div style={{ color: "red" }}>{errors.hp.message}</div>}
				</div>
				<button type="submit">作成</button>
				{error && <div style={{ color: "red", marginTop: "8px" }}>{error}</div>}
			</form>
      {showCard && (
        <div style={{ marginTop: "20px" }}>
          <p>id: {cardAttributes.id}</p>
          <p>名前: {cardAttributes.name}</p>
          <p>コスト: {cardAttributes.cost}</p>
          <p>攻撃力: {cardAttributes.attack}</p>
          <p>HP: {cardAttributes.hp}</p>
        </div>
      )}
		</div>
	);
}