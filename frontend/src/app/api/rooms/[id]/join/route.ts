import { NextRequest, NextResponse } from 'next/server';
import { joinRoom } from '@/lib/dynamodb-client';
import type { JoinRoomRequest } from '@/types/game';

// POST /api/rooms/[id]/join - 部屋参加
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id;
    
    if (!roomId) {
      return NextResponse.json(
        { error: 'ルームIDが必要です' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { playerId, userId } = body as JoinRoomRequest;

    console.log('Room join request:', { roomId, playerId, userId });

    if (!playerId || !userId) {
      return NextResponse.json(
        { error: 'playerId と userId は必須です' },
        { status: 400 }
      );
    }

    const result = await joinRoom(roomId, {
      playerId,
      userId
    });

    console.log('Room join successful:', result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Room join error:', error);
    
    if (error.message?.includes('部屋が見つかりません')) {
      return NextResponse.json(
        { error: 'あいことばに合致する部屋が見つかりません' },
        { status: 404 }
      );
    }

    if (error.message?.includes('参加できません')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '部屋への参加に失敗しました' },
      { status: 500 }
    );
  }
}
