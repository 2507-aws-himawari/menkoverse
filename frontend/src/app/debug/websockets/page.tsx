'use client';

import { useState, useEffect } from 'react';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';
import type { Room } from '@/types/game';

export default function WebSocketTestPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isJoined, setIsJoined] = useState<boolean>(false);
  
  const { 
    isConnected, 
    gameState,
    error,
    sendMessage: sendWebSocketMessage,
    getConnectionState,
    playerJoinEvents
  } = useGameWebSocket(selectedRoom?.id || '', playerId);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  useEffect(() => {
    if (playerJoinEvents.length > 0) {
      const latestEvent = playerJoinEvents[playerJoinEvents.length - 1];
      addLog(`Player joined: ${latestEvent.playerId} (User: ${latestEvent.userId})`);
    }
  }, [playerJoinEvents]);

  useEffect(() => {
    if (gameState) {
      addLog(`Game state updated: ${JSON.stringify(gameState)}`);
    }
  }, [gameState]);

  useEffect(() => {
    if (error) {
      addLog(`WebSocket error: ${error}`);
    }
  }, [error]);

  useEffect(() => {
    // Auto-generate player ID and user ID on mount
    const generateRandomId = () => `player_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const generatedId = generateRandomId();
    setPlayerId(generatedId);
    setUserId(generatedId);
    addLog(`Generated player ID: ${generatedId}`);

    // Auto-load rooms on mount
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      addLog('Loading rooms...');
      const response = await fetch('/api/rooms');
      const data = await response.json();
      
      if (response.ok) {
        setRooms(data.rooms);
        addLog(`✓ Loaded ${data.rooms.length} rooms`);
      } else {
        addLog(`✗ Error loading rooms: ${data.error}`);
      }
    } catch (error) {
      addLog(`✗ Error loading rooms: ${error}`);
    }
  };

  const createRoom = async () => {
    if (!roomName.trim()) {
      addLog('Room name is required');
      return;
    }

    if (!userId) {
      addLog('User ID is required');
      return;
    }

    try {
      addLog(`Creating room: ${roomName}`);
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: roomName.trim(),
          ownerId: userId,
          maxPlayers: 4
        })
      });

      const data = await response.json();
      if (response.ok) {
        addLog(`✓ Room created successfully: ${data.roomId}`);
        setRoomName('');
        await loadRooms();
      } else {
        addLog(`✗ Error creating room: ${data.error}`);
      }
    } catch (error) {
      addLog(`✗ Error creating room: ${error}`);
    }
  };

  const joinRoom = async (room: Room) => {
    if (!playerId || !userId) {
      addLog('✗ Player ID and user ID are required');
      return;
    }

    try {
      addLog(`Joining room: ${room.name} (${room.id})`);
      const response = await fetch(`/api/rooms/${room.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          userId
        })
      });

      const data = await response.json();
      if (response.ok) {
        addLog(`✓ Successfully joined room: ${room.name}`);
        setSelectedRoom(room);
        setIsJoined(true);
        // WebSocket will automatically connect when room is selected
      } else {
        addLog(`✗ Error joining room: ${data.error}`);
      }
    } catch (error) {
      addLog(`✗ Error joining room: ${error}`);
    }
  };

  const sendTestMessage = () => {
    if (!selectedRoom || !message.trim() || !isConnected) {
      addLog('✗ Select a room, enter a message, and ensure WebSocket is connected');
      return;
    }

    const messageData = {
      action: 'sendMessage',
      roomId: selectedRoom.id,
      playerId,
      message: message.trim()
    };

    sendWebSocketMessage(messageData);
    addLog(`→ Sent: ${JSON.stringify(messageData)}`);
    setMessage('');
  };

  const sendJoinRoomMessage = () => {
    if (!selectedRoom || !isConnected) {
      addLog('✗ Select a room and ensure WebSocket is connected');
      return;
    }

    const joinData = {
      action: 'joinRoom',
      roomId: selectedRoom.id,
      playerId,
      userId
    };

    sendWebSocketMessage(joinData);
    addLog(`→ Sent join room message: ${JSON.stringify(joinData)}`);
  };

  const leaveRoom = () => {
    if (selectedRoom) {
      addLog(`Left room: ${selectedRoom.name}`);
    }
    setSelectedRoom(null);
    setIsJoined(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">WebSocket Test Page</h1>
      
      {/* Connection Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
        <p className={`mb-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </p>
        <p className="text-sm text-gray-600 mb-2">
          Connection State: {JSON.stringify(getConnectionState())}
        </p>
        {selectedRoom && (
          <div className="mt-2 p-2 bg-white rounded">
            <p className="text-sm text-gray-600">Active Room:</p>
            <p className="font-medium">{selectedRoom.name}</p>
            <button
              onClick={leaveRoom}
              className="mt-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Leave Room
            </button>
          </div>
        )}
      </div>

      {/* Player Info */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Player Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Player ID</label>
            <input
              type="text"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter player ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter user ID"
            />
          </div>
        </div>
      </div>

      {/* Room Creation */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Create Room</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && createRoom()}
            className="flex-1 p-2 border rounded"
            placeholder="Enter room name"
          />
          <button
            onClick={createRoom}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Create Room
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room List */}
        <div className="p-4 bg-gray-100 rounded">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Rooms</h2>
            <button
              onClick={loadRooms}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>
          <div className="space-y-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                  selectedRoom?.id === room.id ? 'bg-blue-100 border-blue-500' : ''
                }`}
                onClick={() => setSelectedRoom(room)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{room.name}</span>
                  <span className="text-sm text-gray-600">
                    {room.playerCount}/{room.maxPlayers}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Status: {room.status}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    joinRoom(room);
                  }}
                  className="mt-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Message Testing */}
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="text-lg font-semibold mb-4">Send Message</h2>
          {selectedRoom && (
            <div className="mb-4 p-2 bg-white rounded">
              <p className="text-sm text-gray-600">Selected Room:</p>
              <p className="font-medium">{selectedRoom.name}</p>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 p-2 border rounded"
              placeholder="Enter message"
              onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
            />
            <button
              onClick={sendTestMessage}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={!selectedRoom || !isConnected}
            >
              Send
            </button>
          </div>
          
          {/* Test Player Join Button */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={sendJoinRoomMessage}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={!selectedRoom || !isConnected}
            >
              Test Player Join
            </button>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Logs</h2>
          <button
            onClick={() => setLogs([])}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
        <div className="bg-black text-green-400 p-4 rounded h-64 overflow-y-auto font-mono text-sm">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
