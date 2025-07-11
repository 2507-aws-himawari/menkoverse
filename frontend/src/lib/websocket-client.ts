export class GameWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000;
  private isConnected = false;
  
  constructor(
    private wsEndpoint: string,
    private roomId: string,
    private playerId: string,
    private onMessage: (data: any) => void,
    private onConnectionChange?: (isConnected: boolean) => void
  ) {}
  
  async connect() {
    const url = `${this.wsEndpoint}?roomId=${this.roomId}&playerId=${this.playerId}`;
    
    console.log('Connecting to WebSocket:', url);
    
    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.onConnectionChange?.(true);
      };
      
      this.ws.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          this.onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event);
        this.isConnected = false;
        this.onConnectionChange?.(false);
        this.scheduleReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
        this.onConnectionChange?.(false);
      };
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.isConnected = false;
      this.onConnectionChange?.(false);
      this.scheduleReconnect();
    }
  }
  
  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnect attempts reached');
    }
  }
  
  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify(data);
      console.log('Sending WebSocket message:', message);
      this.ws.send(message);
    } else {
      console.warn('WebSocket not connected, cannot send message:', data);
    }
  }
  
  disconnect() {
    console.log('Disconnecting WebSocket');
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.onConnectionChange?.(false);
  }
  
  getConnectionState() {
    return {
      isConnected: this.isConnected,
      readyState: this.ws?.readyState,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}
