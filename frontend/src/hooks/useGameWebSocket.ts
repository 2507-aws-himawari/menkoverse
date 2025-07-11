import { useEffect, useState, useCallback } from 'react';
import { GameWebSocketClient } from '@/lib/websocket-client';

export function useGameWebSocket(roomId: string, playerId: string) {
  const [client, setClient] = useState<GameWebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleMessage = useCallback((data: any) => {
    console.log('Game WebSocket message received:', data);
    setGameState(data);
    setError(null);
  }, []);
  
  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
    if (connected) {
      setError(null);
    }
  }, []);
  
  useEffect(() => {
    if (!roomId || !playerId) {
      console.warn('roomId or playerId not provided');
      return;
    }
    
    const wsEndpoint = process.env.NEXT_PUBLIC_WS_ENDPOINT;
    if (!wsEndpoint) {
      console.error('NEXT_PUBLIC_WS_ENDPOINT not configured');
      setError('WebSocket endpoint not configured');
      return;
    }
    
    console.log('Initializing WebSocket client:', { roomId, playerId, wsEndpoint });
    
    const wsClient = new GameWebSocketClient(
      wsEndpoint,
      roomId,
      playerId,
      handleMessage,
      handleConnectionChange
    );
    
    wsClient.connect().catch(err => {
      console.error('WebSocket connection failed:', err);
      setError('Failed to connect to WebSocket');
    });
    
    setClient(wsClient);
    
    return () => {
      console.log('Cleaning up WebSocket client');
      wsClient.disconnect();
    };
  }, [roomId, playerId, handleMessage, handleConnectionChange]);
  
  const sendMessage = useCallback((data: any) => {
    if (client) {
      client.send(data);
    } else {
      console.warn('WebSocket client not initialized');
    }
  }, [client]);
  
  const getConnectionState = useCallback(() => {
    return client?.getConnectionState() || {
      isConnected: false,
      readyState: undefined,
      reconnectAttempts: 0
    };
  }, [client]);
  
  return { 
    isConnected, 
    gameState, 
    error,
    sendMessage,
    getConnectionState
  };
}
