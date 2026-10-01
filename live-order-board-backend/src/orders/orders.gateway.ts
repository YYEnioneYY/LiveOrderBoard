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

  private orders: {
    id: number;
    title: string;
    status: string;
  }[] = [];

  private connectedUsers = 0;

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id)

    this.connectedUsers++;

    this.server.emit(
      'users:online',
      { count: this.connectedUsers },
    )
  }
  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id)

    this.connectedUsers = Math.max(
      0,
      this.connectedUsers - 1,
    );

    this.server.emit(
      'users:online',
      { count: this.connectedUsers }
    )
  }

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

  @SubscribeMessage('order:delete')
  handleDeleteOrder(
    @MessageBody()
    data: { orderId: number },
  ) {
    const order = this.orders.find(
      (order) => order.id === data.orderId,
    );

    if (!order) {
      return
    };

    this.orders = this.orders.filter(order => order.id !== data.orderId);

    this.server.emit(
      'order:deleted',
      {
        orderId: data.orderId,
      }
    );
  }

  @SubscribeMessage('orders:get-all')
  handleGetAllOrders(
    @ConnectedSocket() client: Socket,
  ) {
    client.emit(
      'orders:list',
      this.orders,
    )
  }
}
