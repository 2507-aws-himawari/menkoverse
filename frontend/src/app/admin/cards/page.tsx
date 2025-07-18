"use client";

import { ShowCard } from "@/app/admin/cards/_components/ShowCard";
import { cardSchema } from "@/lib/schema/card";
import type { Card } from "@/types/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

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
					<label htmlFor="name">名前</label>
					<input
						id="name"
						type="text"
						placeholder="名前を入力"
						{...register("name")}
					/>
					{errors.name && (
						<div style={{ color: "red" }}>{errors.name.message}</div>
					)}
				</div>
				<div>
					<label htmlFor="cost">コスト</label>
					<input
						id="cost"
						type="number"
						min={1}
						max={10}
						{...register("cost", { valueAsNumber: true })}
					/>
					{errors.cost && (
						<div style={{ color: "red" }}>{errors.cost.message}</div>
					)}
				</div>
				<div>
					<label htmlFor="attack">攻撃力</label>
					<input
						id="attack"
						type="number"
						min={0}
						max={100}
						{...register("attack", { valueAsNumber: true })}
					/>
					{errors.attack && (
						<div style={{ color: "red" }}>{errors.attack.message}</div>
					)}
				</div>
				<div>
					<label htmlFor="hp">HP</label>
					<input
						id="hp"
						type="number"
						min={1}
						max={100}
						{...register("hp", { valueAsNumber: true })}
					/>
					{errors.hp && <div style={{ color: "red" }}>{errors.hp.message}</div>}
				</div>
				<button type="submit">作成</button>
			</form>
			{isSuccess && <ShowCard cardAttributes={cardAttributes} />}
		</div>
	);
}
