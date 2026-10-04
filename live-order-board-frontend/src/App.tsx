import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

type Order = {
  id: number;
  title: string;
  status: string;
};

type OrderMessage = {
  id: number;
  orderId: number;
  text: string;
  createdAt: string;
};

function App() {
  const [connected, setConnected] = useState(false);
  const [title, setTitle] = useState('');

  const [orders, setOrders] = useState<Order[]>([]);

  const [onlineUsers, setOnlineUsers] = useState(0);

  const [openedOrderId, setOpenedOrderId] = useState<number | null>(null);

  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    const handleConnect = () => {
      console.log('Connected:', socket.id);
      setConnected(true);
      socket.emit('orders:get-all');
    };

    const handleDisconnect = () => {
      console.log('Disconnected');
      setConnected(false);
    };

    const handleUsersOnline = (data: { count: number }) => {
      setOnlineUsers(data.count);
    };

    const handleOrderCreated = (order: Order) => {
      setOrders((currentOrders) => [
        ...currentOrders,
        order,
      ]);
    };

    const handleOrderUpdated = (updatedOrder: Order) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === updatedOrder.id
            ? updatedOrder
            : order,
        ),
      );
    };

    const handleOrderDeleted = (data: { orderId: number }) => {
      setOrders((currentOrders) =>
        currentOrders.filter((order) =>
          order.id !== data.orderId
        ),
      );
    };

    const handleOrdersList = (orders: Order[]) => {
      setOrders(orders);
    };

    const handleMessageCreated = (
      message: OrderMessage,
    ) => {
      setMessages((currentMessages) => [
        ...currentMessages,
        message,
      ]);
    };

    const handleMessagesList = (
      messages: OrderMessage[],
    ) => {
      setMessages(messages);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('order:created', handleOrderCreated);
    socket.on('order:updated', handleOrderUpdated);
    socket.on('order:deleted', handleOrderDeleted);
    socket.on('users:online', handleUsersOnline);
    socket.on('orders:list', handleOrdersList);
    socket.on('order:message:created', handleMessageCreated);
    socket.on('order:messages:list', handleMessagesList);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('order:created', handleOrderCreated);
      socket.off('order:updated', handleOrderUpdated);
      socket.off('order:deleted', handleOrderDeleted);
      socket.off('users:online', handleUsersOnline);
      socket.off('orders:list', handleOrdersList);
      socket.off('order:message:created', handleMessageCreated);
      socket.off('order:messages:list', handleMessagesList);
    };
  }, []);

  const createOrder = () => {
    if (!title.trim()) {
      return;
    }

    socket.emit(
      'order:create',
      {
        title: title.trim(),
      },
    );

    setTitle('');
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Live Order Board</h1>

      <p>
        Online users: {onlineUsers}
      </p>

      <p>
        WebSocket: {connected ? '🟢 connected' : '🔴 disconnected'}
      </p>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Название заказа"
      />

      <button onClick={createOrder}>
        Создать
      </button>

      <h2>Заказы</h2>

      {orders.map((order) => (
        <div key={order.id}>
          <p>
            #{order.id}
          </p>
      
          <p>
            {order.title}
          </p>
      
          <select
            value={order.status}
            onChange={(e) => {
              socket.emit(
                'order:update-status',
                {
                  orderId: order.id,
                  status: e.target.value,
                },
              );
            }}
          >
            <option value="NEW">
              NEW
            </option>
          
            <option value="IN_PROGRESS">
              IN_PROGRESS
            </option>
          
            <option value="DONE">
              DONE
            </option>
          </select>
          <p></p>
          <button
            onClick={() => {
              socket.emit(
                'order:delete',
                { orderId: order.id }
              );
            }}
          >
            Удалить
          </button>

          <button
            onClick={() => {
              socket.emit(
                'order:join',
                {
                  orderId: order.id,
                },
              );
            
              setOpenedOrderId(order.id);
            }}
          >
            Открыть
          </button>

          <button
            onClick={() => {
              socket.emit(
                'order:leave',
                {
                  orderId: order.id,
                },
              );
            
              setOpenedOrderId(null);
            }}
          >
            Закрыть
          </button>

          {openedOrderId === order.id && (
            <p>Вы смотрите этот заказ</p>
          )}
      
          <hr />
          
        </div>
      ))}

      {openedOrderId !== null && (
        <div>
          <h2>
            Сообщения заказа #{openedOrderId}
          </h2>

          <input
            value={messageText}
            onChange={(e) =>
              setMessageText(e.target.value)
            }
            placeholder="Введите сообщение"
          />

          <button
            onClick={() => {
              if (!messageText.trim()) {
                return;
              }
            
              socket.emit(
                'order:message:send',
                {
                  orderId: openedOrderId,
                  text: messageText.trim(),
                },
              );
            
              setMessageText('');
            }}
          >
            Отправить
          </button>
        </div>
      )}

      {messages
        .filter(
          (message) =>
            message.orderId === openedOrderId,
        )
        .map((message) => (
          <div key={message.id}>
            <p>{message.text}</p>
        
            <small>
              {new Date(
                message.createdAt,
              ).toLocaleTimeString()}
            </small>
          </div>
        ))}
    </div>
  );
}

export default App;