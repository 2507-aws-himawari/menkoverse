import { NextRequest, NextResponse } from 'next/server';
import { getRoomById, deleteRoom } from '@/lib/dynamodb-client';

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

    console.log('Room fetched successfully:', room);
    return NextResponse.json(room);
  } catch (error) {
    console.error('Room fetch error:', error);
    return NextResponse.json(
      { error: 'ルーム情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// DELETE /api/rooms/[id] - ルーム削除
export async function DELETE(
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

    console.log('Deleting room:', roomId);
    
    // ルームの存在確認
    const room = await getRoomById(roomId);
    if (!room) {
      return NextResponse.json(
        { error: 'ルームが見つかりません' },
        { status: 404 }
      );
    }

    // ルームを削除
    await deleteRoom(roomId);
    
    console.log('Room deleted successfully:', roomId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Room deletion error:', error);
    return NextResponse.json(
      { error: 'ルームの削除に失敗しました' },
      { status: 500 }
    );
  }
}
