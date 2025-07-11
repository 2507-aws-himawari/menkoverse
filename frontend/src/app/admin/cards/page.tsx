"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ShowCard } from "@/app/admin/cards/_components/ShowCard";
import type { Card } from "@/types/card";
import { cardSchema } from "@/lib/schema/card";

export default function AdminCardsPage() {
	const [isSuccess, setIsSuccess] = useState(false);
  const [cardAttributes, setCardAttributes] = useState<Card>({
    id: "",
    name: "",
    cost: 1,
    attack: 1,
    hp: 1,
  });

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<Card>({
		resolver: zodResolver(cardSchema),
    defaultValues: {
      id: "",
      name: "",
      cost: 1,
      attack: 1,
      hp: 1,
		},
	});

	const onSubmit = async (card: Card) => {
		const cardId = `F-${crypto.randomUUID()}`;
		card.id = cardId;

		try {
			const response = await fetch("/api/admin/cards", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(card),
			});

			if (!response.ok) {
				throw new Error("カードの作成に失敗しました");
			}

    } catch (error) {
			throw new Error("カードの作成に失敗しました");
		}

		setIsSuccess(true);
    setCardAttributes(card);
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
			</form>
      {isSuccess && <ShowCard cardAttributes={cardAttributes} />}
		</div>
	);
}