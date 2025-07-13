import { useEffect, useState, useCallback } from 'react';
import { GameWebSocketClient } from '@/lib/websocket-client';

export function useGameWebSocket(roomId: string, playerId: string) {
  const [client, setClient] = useState<GameWebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [playerJoinEvents, setPlayerJoinEvents] = useState<any[]>([]);
  
  const handleMessage = useCallback((data: any) => {
    console.log('Game WebSocket message received:', data);
    
    // Handle player join events
    if (data.type === 'PLAYER_JOINED') {
      console.log('Player joined event:', data);
      setPlayerJoinEvents(prev => [...prev, data]);
      return;
    }
    
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
      console.warn('NEXT_PUBLIC_WS_ENDPOINT not configured - WebSocket disabled');
      setError('WebSocket endpoint not configured');
      return;
    }
    
    console.log('Initializing WebSocket client:', { roomId, playerId, wsEndpoint });
    
    let isActive = true; // クリーンアップ時の競合状態を防ぐ
    let wsClient: GameWebSocketClient | null = null;
    
    // 少し遅延させてから接続を開始（開発環境での重複実行を回避）
    const timeoutId = setTimeout(() => {
      if (!isActive) return;
      
      wsClient = new GameWebSocketClient(
        wsEndpoint,
        roomId,
        playerId,
        handleMessage,
        handleConnectionChange
      );
      
      // 接続エラーを適切にハンドリング
      wsClient.connect().catch(err => {
        if (isActive) {
          console.warn('WebSocket connection failed (disabled for development):', err);
          setError('WebSocket connection failed - using polling mode');
        }
      });
      
      if (isActive) {
        setClient(wsClient);
      }
    }, 100); // 100ms遅延
    
    return () => {
      isActive = false;
      clearTimeout(timeoutId);
      console.log('Cleaning up WebSocket client');
      if (wsClient) {
        wsClient.disconnect();
      }
      setClient(null);
    };
  }, [roomId, playerId]); // handleMessage, handleConnectionChangeを依存関係から除去
  
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
    getConnectionState,
    playerJoinEvents
  };
}
