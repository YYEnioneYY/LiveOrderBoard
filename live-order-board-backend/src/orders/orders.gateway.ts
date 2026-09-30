import { 
  WebSocketGateway, 
  WebSocketServer,
  OnGatewayConnection, 
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';

import { Socket, Server } from 'socket.io'

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id)
  }
  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id)
  }

  private orders: {
    id: number;
    title: string;
    status: string;
  }[] = [];

  @SubscribeMessage('order:create')
  handleCreateOrder(
    @MessageBody() data: { title: string },
    @ConnectedSocket() client: Socket,
  ) {
    const order = {
      id: Date.now(),
      title: data.title,
      status: 'NEW',
    };

    this.orders.push(order);

    console.log('Order received:', order);
    console.log('From client:', client.id);

    this.server.emit(
      'order:created',
      order,
    );
  }

  @SubscribeMessage('order:update-status')
  handleUpdateStatus(
    @MessageBody()
    data: {
      orderId: number;
      status: string;
    },
  ) {
    const order = this.orders.find(
      (order) => order.id === data.orderId,
    );

    if (!order) {
      return;
    }

    order.status = data.status;

    console.log('Order status updated:', data)

    this.server.emit(
      'order:updated',
      order,
    );
  }
}
