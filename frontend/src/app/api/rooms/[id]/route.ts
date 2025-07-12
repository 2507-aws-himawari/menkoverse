import { NextRequest, NextResponse } from 'next/server';
import { getRoomById, getRoomPlayers } from '@/lib/dynamodb-client';

// GET /api/rooms/[id] - 個別ルーム取得
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

    console.log('Fetching room:', roomId);
    
    const room = await getRoomById(roomId);
    
    if (!room) {
      return NextResponse.json(
        { error: 'ルームが見つかりません' },
        { status: 404 }
      );
    }

    // Get players for this room
    const players = await getRoomPlayers(roomId);
    
    const response = {
      ...room,
      players,
    };

    console.log('Room fetched successfully:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Room fetch error:', error);
    return NextResponse.json(
      { error: 'ルーム情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
