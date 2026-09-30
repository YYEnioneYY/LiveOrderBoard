import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

type Order = {
  id: number;
  title: string;
  status: string;
};

function App() {
  const [connected, setConnected] = useState(false);
  const [title, setTitle] = useState('');

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const handleConnect = () => {
      console.log('Connected:', socket.id);
      setConnected(true);
    };

    const handleDisconnect = () => {
      console.log('Disconnected');
      setConnected(false);
    };

    const handleOrderCreated = (order: Order) => {
      console.log('Order created:', order);

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

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('order:created', handleOrderCreated);
    socket.on('order:updated', handleOrderUpdated);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('order:created', handleOrderCreated);
      socket.off('order:updated', handleOrderUpdated);
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
      
          <hr />
        </div>
      ))}
    </div>
  );
}

export default App;