import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { addCardToDeckSchema } from "@/lib/schema/deck";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log("Fetching available cards for deck:", id);

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    // デッキの存在確認と所有者チェック
    const deck = await db.deck.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!deck) {
      return NextResponse.json(
        { error: "デッキが見つかりません" },
        { status: 404 }
      );
    }

    // 利用可能な全カード一覧を取得
    const availableCards = await db.follower.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(availableCards);
  } catch (error) {
    console.error("利用可能カード取得エラー:", error);
    return NextResponse.json(
      { error: "利用可能カードの取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = addCardToDeckSchema.parse(body);

    // デッキの存在確認と所有者チェック
    const deck = await db.deck.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        DeckCards: true,
      },
    });

    if (!deck) {
      return NextResponse.json(
        { error: "デッキが見つかりません" },
        { status: 404 }
      );
    }

    // デッキのカード枚数制限をチェック（40枚固定）
    if (deck.DeckCards.length == 40) {
      return NextResponse.json(
        { error: "デッキに追加できるカードは40枚までです" },
        { status: 400 }
      );
    }

    // フォロワーカードの存在確認
    const follower = await db.follower.findUnique({
      where: {
        id: validatedData.followerId,
      },
    });

    if (!follower) {
      return NextResponse.json(
        { error: "指定されたカードが見つかりません" },
        { status: 404 }
      );
    }

    // デッキにカードを追加
    const deckCard = await db.deckCard.create({
      data: {
        id: crypto.randomUUID(),
        deckId: id,
        followerId: validatedData.followerId,
      },
      include: {
        follower: true,
      },
    });

    return NextResponse.json(deckCard, { status: 201 });
  } catch (error) {
    console.error("カード追加エラー:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "入力データが無効です" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "カードの追加に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const deckCardId = url.searchParams.get("deckCardId");

    if (!deckCardId) {
      return NextResponse.json(
        { error: "デッキカードIDが必要です" },
        { status: 400 }
      );
    }

    // デッキの存在確認と所有者チェック
    const deck = await db.deck.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!deck) {
      return NextResponse.json(
        { error: "デッキが見つかりません" },
        { status: 404 }
      );
    }

    // デッキカードの存在確認
    const deckCard = await db.deckCard.findFirst({
      where: {
        id: deckCardId,
        deckId: id,
      },
    });

    if (!deckCard) {
      return NextResponse.json(
        { error: "指定されたカードがデッキに存在しません" },
        { status: 404 }
      );
    }

    // デッキからカードを削除
    await db.deckCard.delete({
      where: {
        id: deckCardId,
      },
    });

    return NextResponse.json(
      { message: "カードを削除しました" },
      { status: 200 }
    );
  } catch (error) {
    console.error("カード削除エラー:", error);
    return NextResponse.json(
      { error: "カードの削除に失敗しました" },
      { status: 500 }
    );
  }
}
