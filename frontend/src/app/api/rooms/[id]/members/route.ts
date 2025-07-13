import { NextRequest, NextResponse } from 'next/server';
import { getRoomMembers } from '@/lib/dynamodb-client';

// GET /api/rooms/[id]/members - 部屋の参加者一覧取得
export async function GET(
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

    console.log('Getting room members for room:', roomId);

    const members = await getRoomMembers(roomId);

    console.log('Room members retrieved:', members);
    return NextResponse.json({ members });
  } catch (error: any) {
    console.error('Room members get error:', error);
    
    return NextResponse.json(
      { error: '参加者一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}
