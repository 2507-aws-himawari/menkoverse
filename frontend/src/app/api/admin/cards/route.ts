import { db } from "@/server/db";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const { id, name, cost, attack, hp } = await request.json();
		const follower = await db.follower.create({
			data: { id, name, cost, attack, hp },
		});
		return NextResponse.json(follower, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to create follower" },
			{ status: 500 },
		);
	}
}
