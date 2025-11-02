import { WebSocketServer } from 'ws';

declare global {
  var _wss: WebSocketServer | undefined;
}

export const getWss = () => {
  if (!global._wss) {
    console.log("Creating new WebSocket server");
    global._wss = new WebSocketServer({ noServer: true });
  }
  return global._wss;
};
