import { NextRequest, NextResponse } from 'next/server';
import { updateRoomStatus } from '@/lib/dynamodb-client';

// POST /api/rooms/[id]/start - ゲーム開始
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    
    if (!roomId) {
      return NextResponse.json(
        { error: 'ルームIDが必要です' },
        { status: 400 }
      );
    }

    console.log('Starting game for room:', roomId);
    
    const updatedRoom = await updateRoomStatus(roomId, 'playing');
    
    if (!updatedRoom) {
      return NextResponse.json(
        { error: 'ルームが見つかりません' },
        { status: 404 }
      );
    }

    console.log('Game started successfully:', updatedRoom);
    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error('Game start error:', error);
    return NextResponse.json(
      { error: 'ゲーム開始に失敗しました' },
      { status: 500 }
    );
  }
}
