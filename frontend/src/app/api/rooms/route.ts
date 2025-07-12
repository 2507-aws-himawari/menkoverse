import { NextRequest, NextResponse } from 'next/server';
import { createRoom, listRooms } from '@/lib/dynamodb-client';

// POST /api/rooms - 部屋作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomName, ownerId } = body;

    console.log('Room creation request:', { roomName, ownerId });

    if (!roomName || !ownerId) {
      return NextResponse.json(
        { error: 'roomName と ownerId は必須です' },
        { status: 400 }
      );
    }

    const result = await createRoom({
      roomName,
      ownerId,
    });

    console.log('Room created successfully:', result);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Room creation error:', error);
    
    if (error.message?.includes('already exists')) {
      return NextResponse.json(
        { error: 'このあいことばは既に使用されています' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'ルームの作成に失敗しました' },
      { status: 500 }
    );
  }
}

// GET /api/rooms - 部屋一覧取得
export async function GET() {
  try {
    console.log('Fetching rooms list...');
    const rooms = await listRooms();
    console.log('Rooms fetched:', rooms.length);
    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Room list error:', error);
    return NextResponse.json(
      { error: 'ルーム一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}
