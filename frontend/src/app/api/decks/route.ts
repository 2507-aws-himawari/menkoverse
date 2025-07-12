import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { createDeckSchema } from "@/lib/schema/deck";
import { type NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const decks = await db.deck.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        DeckCards: {
          include: {
            follower: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const rentalDecks = await db.rentalDeck.findMany({
      include: {
        RentalDeckCards: {
          include: {
            follower: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const allDecks = [...decks, ...rentalDecks];

    console.log("GET /api/decks - デッキ一覧:", allDecks);

    return NextResponse.json(allDecks);
  } catch (error) {
    console.error("デッキ一覧取得エラー:", error);
    return NextResponse.json(
      { error: "デッキ一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createDeckSchema.parse(body);

    const deck = await db.deck.create({
      data: {
        id: `D-${crypto.randomUUID()}`,
        name: validatedData.name,
        userId: session.user.id,
      },
      include: {
        DeckCards: {
          include: {
            follower: true,
          },
        },
      },
    });

    return NextResponse.json(deck, { status: 201 });
  } catch (error) {
    console.error("デッキ作成エラー:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "入力データが無効です" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "デッキの作成に失敗しました" },
      { status: 500 }
    );
  }
}
