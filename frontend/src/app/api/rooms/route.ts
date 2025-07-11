import { NextRequest, NextResponse } from 'next/server';
import { createRoom, listRooms } from '@/lib/dynamodb-client';

// POST /api/rooms - 部屋作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomName, ownerId, maxPlayers } = body;

    console.log('Room creation request:', { roomName, ownerId, maxPlayers });

    if (!roomName || !ownerId) {
      return NextResponse.json(
        { error: 'roomName and ownerId are required' },
        { status: 400 }
      );
    }

    const result = await createRoom({
      roomName,
      ownerId,
      maxPlayers: maxPlayers || 4,
    });

    console.log('Room created successfully:', result);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Room creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
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
    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Room list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}
