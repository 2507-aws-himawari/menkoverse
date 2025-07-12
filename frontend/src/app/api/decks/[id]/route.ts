import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { updateDeckSchema } from "@/lib/schema/deck";
import { type NextRequest, NextResponse } from "next/server";
import { isRentalDeck } from "@/lib/utils/deckUtils";

export async function GET(
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

    const deck = await db.deck.findFirst({
      where: {
        id: id,
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

    const rentalDeck = await db.rentalDeck.findFirst({
      where: {
        id: id,
      },
      include: {
        RentalDeckCards: {
          include: {
            follower: true,
          },
        },
      },
    });

    if (!deck && !rentalDeck) {
      return NextResponse.json(
        { error: "デッキが見つかりません" },
        { status: 404 }
      );
    }

    // レンタルデッキの場合はレンタルデッキを返し、通常のデッキの場合は通常のデッキを返す
    const resultDeck = deck || rentalDeck;
    return NextResponse.json(resultDeck);
  } catch (error) {
    console.error("デッキ取得エラー:", error);
    return NextResponse.json(
      { error: "デッキの取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // レンタルデッキの場合は操作を禁止
    if (isRentalDeck(id)) {
      return NextResponse.json(
        { error: "レンタルデッキは変更・削除できません" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateDeckSchema.parse(body);

    // デッキの存在確認と所有者チェック
    const existingDeck = await db.deck.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existingDeck) {
      return NextResponse.json(
        { error: "デッキが見つかりません" },
        { status: 404 }
      );
    }

    const updatedDeck = await db.deck.update({
      where: {
        id: id,
      },
      data: {
        name: validatedData.name,
      },
      include: {
        DeckCards: {
          include: {
            follower: true,
          },
        },
      },
    });

    return NextResponse.json(updatedDeck);
  } catch (error) {
    console.error("デッキ更新エラー:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "入力データが無効です" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "デッキの更新に失敗しました" },
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

    // レンタルデッキの場合は操作を禁止
    if (isRentalDeck(id)) {
      return NextResponse.json(
        { error: "レンタルデッキは変更・削除できません" },
        { status: 403 }
      );
    }

    // デッキの存在確認と所有者チェック
    const existingDeck = await db.deck.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existingDeck) {
      return NextResponse.json(
        { error: "デッキが見つかりません" },
        { status: 404 }
      );
    }

    // デッキカードも一緒に削除
    await db.deckCard.deleteMany({
      where: {
        deckId: id,
      },
    });

    await db.deck.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json(
      { message: "デッキを削除しました" },
      { status: 200 }
    );
  } catch (error) {
    console.error("デッキ削除エラー:", error);
    return NextResponse.json(
      { error: "デッキの削除に失敗しました" },
      { status: 500 }
    );
  }
}
