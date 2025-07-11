import { NextRequest, NextResponse } from 'next/server';
import { joinRoom } from '@/lib/dynamodb-client';

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;
    const { playerId, userId } = await request.json();

    if (!roomId || !playerId || !userId) {
      return NextResponse.json(
        { error: 'Room ID, player ID, and user ID are required' },
        { status: 400 }
      );
    }

    const result = await joinRoom({ roomId, playerId, userId });
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to join room' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Room join error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
