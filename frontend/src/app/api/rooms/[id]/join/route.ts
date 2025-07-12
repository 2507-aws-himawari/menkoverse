import { NextRequest, NextResponse } from 'next/server';
import { joinRoom } from '@/lib/dynamodb-client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id;
    const { playerId, userId } = await request.json();

    if (!roomId || !playerId || !userId) {
      return NextResponse.json(
        { error: 'ルームID、プレイヤーID、ユーザーIDは必須です' },
        { status: 400 }
      );
    }

    const result = await joinRoom({ roomId, playerId, userId });
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'ルームへの参加に失敗しました' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Room join error:', error);
    return NextResponse.json(
      { error: 'ルームへの参加に失敗しました' },
      { status: 500 }
    );
  }
}
