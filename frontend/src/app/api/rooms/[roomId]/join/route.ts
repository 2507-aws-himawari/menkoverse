import { NextRequest, NextResponse } from 'next/server';
import { joinRoom } from '@/lib/dynamodb-client';
import type { JoinRoomRequest } from '@/types/game';

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;
    const body: JoinRoomRequest = await request.json();
    
    if (!body.playerId || !body.userId) {
      return NextResponse.json(
        { error: 'playerId and userId are required' },
        { status: 400 }
      );
    }

    const result = await joinRoom(decodeURIComponent(roomId), body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error joining room:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to join room' },
      { status: 500 }
    );
  }
}
