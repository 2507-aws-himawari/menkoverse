const WebSocket = require('ws');

const wsUrl = 'wss://o7w1w5hjqb.execute-api.ap-northeast-1.amazonaws.com/dev?roomId=test&playerId=testPlayer';

console.log('Connecting to:', wsUrl);

const ws = new WebSocket(wsUrl);

ws.on('open', function open() {
  console.log('✅ WebSocket connected successfully');
});

ws.on('message', function message(data) {
  console.log('📨 Received:', data.toString());
});

ws.on('error', function error(err) {
  console.log('❌ WebSocket error:', err);
});

ws.on('close', function close(code, reason) {
  console.log('🔌 WebSocket closed:', code, reason.toString());
});

// 5秒後に終了
setTimeout(() => {
  ws.close();
  process.exit(0);
}, 5000);
