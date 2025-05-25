import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  activeClientsList: Set<string> = new Set();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    this.activeClientsList.add(client.id);

    const count = this.server.engine.clientsCount;
    console.log(`Current client count: ${count}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.activeClientsList.delete(client.id);

    const count = this.server.engine.clientsCount;
    console.log(`Current client count: ${count}`);
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: { message: string }): void {
    this.server.emit('message', data);
  }

  @SubscribeMessage('chat')
  handleReply(client: Socket, message: any): void {
    console.log('Received:', message);
    // Emit a reply back to the client
    client.emit('reply', `replying with: ${message}`);

    // Broadcast the message to all connected clients except the sender
    client.broadcast.emit('reply', `broadcast without sender: ${message}`);

    // Optionally, you can also broadcast to all clients
    this.server.emit('reply', `broadcast to all: ${message}`);
  }
}
