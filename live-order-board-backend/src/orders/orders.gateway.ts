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

type Order = {
  id: number;
  title: string;
  status: string;
}

type OrderMessage = {
  id: number;
  orderId: number;
  text: string;
  createdAt: Date;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private orders: Order[] = [];

  private messages: OrderMessage[] = [];

  private connectedUsers = 0;

  private users = new Map<string, string>();

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id)

    this.connectedUsers++;

    const defaultName = `User-${client.id.slice(0, 5)}`;

    this.users.set(
      client.id,
      defaultName,
    );

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

    this.users.delete(client.id);

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

  @SubscribeMessage('order:join')
  handleJoinOrder(
    @MessageBody()
    data: { orderId: number },

    @ConnectedSocket()
    client: Socket,
  ) {
    const roomName = `order:${data.orderId}`;

    client.join(roomName);

    const room = this.server.sockets.adapter.rooms.get(roomName);

    const count = room?.size ?? 0;

    this.server
      .to(roomName)
      .emit(
        'order:viewers',
        {
          orderId: data.orderId,
          count,
        }
      );

    const messages = this.messages.filter((message) => message.orderId === data.orderId);

    client.emit(
      'order:messages:list',
      messages,
    );
  }

  @SubscribeMessage('order:leave')
  handleLeaveOrder(
    @MessageBody()
    data: { orderId: number },

    @ConnectedSocket()
    client: Socket,
  ) {
    const roomName = `order:${data.orderId}`;

    client.leave(roomName);

    const room = this.server.sockets.adapter.rooms.get(roomName);
    
    const count = room?.size ?? 0;
    
    this.server
      .to(roomName)
      .emit(
        'order:viewers',
        {
          orderId: data.orderId,
          count,
        },
      );
  }

  @SubscribeMessage('order:message:send')
  handleSendMessage(
    @MessageBody()
    data: {
      orderId: number;
      text: string;
    },
  ) {
    const order = this.orders.find(
      (order) => order.id === data.orderId,
    );

    if (!order) {
      return;
    }

    const message: OrderMessage = {
      id: Date.now(),
      orderId: data.orderId,
      text: data.text,
      createdAt: new Date(),
    };

    this.messages.push(message);

    const roomName = `order:${data.orderId}`;

    this.server
      .to(roomName)
      .emit(
        'order:message:created',
        message,
      );
  }

  @SubscribeMessage('order:typing:start')
  handleTypingStart(
    @MessageBody()
    data: { orderId: number; },

    @ConnectedSocket()
    client: Socket,
  ) {
    const roomName = `order:${data.orderId}`;

    const userName = this.users.get(client.id);

    client
      .to(roomName)
      .emit(
        'order:typing',
        {
          orderId: data.orderId,
          userName,
          isTyping: true,
        }
      )
  }

  @SubscribeMessage('order:typing:stop')
  handleTypingStop(
    @MessageBody()
    data: { orderId: number; },

    @ConnectedSocket()
    client: Socket,
  ) {
    const roomName = `order:${data.orderId}`;

    const userName = this.users.get(client.id);

    client
      .to(roomName)
      .emit(
        'order:typing',
        {
          orderId: data.orderId,
          userName,
          isTyping: false,
        }
      )
  }

  @SubscribeMessage('user:set-name')
  handleSetName(
    @MessageBody()
    data: { name: string },

    @ConnectedSocket()
    client: Socket,
  ) {
    const name = data.name.trim();

    if (!name) {
      return
    }

    this.users.set(
      client.id,
      name,
    );
  }
}
