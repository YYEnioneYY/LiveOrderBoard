import {
  useEffect,
  useRef,
  useState,
} from 'react';

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

  const [openedOrderId, setOpenedOrderId] =
    useState<number | null>(null);

  const [messages, setMessages] =
    useState<OrderMessage[]>([]);

  const [messageText, setMessageText] =
    useState('');

  const [viewersByOrder, setViewersByOrder] =
    useState<Record<number, number>>({});

  const [typingByOrder, setTypingByOrder] =
    useState<Record<number, string | null>>({});

  const typingTimeoutRef =
    useRef<number | null>(null);

  const [name, setName] = useState('');

  const [currentUserName, setCurrentUserName] =
    useState<string | null>(null);

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

    const handleUsersOnline = (
      data: { count: number },
    ) => {
      setOnlineUsers(data.count);
    };

    const handleOrderCreated = (
      order: Order,
    ) => {
      setOrders((currentOrders) => [
        ...currentOrders,
        order,
      ]);
    };

    const handleOrderUpdated = (
      updatedOrder: Order,
    ) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === updatedOrder.id
            ? updatedOrder
            : order,
        ),
      );
    };

    const handleOrderDeleted = (
      data: { orderId: number },
    ) => {
      setOrders((currentOrders) =>
        currentOrders.filter(
          (order) =>
            order.id !== data.orderId,
        ),
      );
    };

    const handleOrdersList = (
      orders: Order[],
    ) => {
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

    const handleOrderViewers = (
      data: {
        orderId: number;
        count: number;
      },
    ) => {
      setViewersByOrder((current) => ({
        ...current,
        [data.orderId]: data.count,
      }));
    };

    const handleTyping = (
      data: {
        orderId: number;
        userName: string;
        isTyping: boolean;
      },
    ) => {
      setTypingByOrder((current) => ({
        ...current,
        [data.orderId]: data.isTyping
          ? data.userName
          : null,
      }));
    };

    socket.on(
      'connect',
      handleConnect,
    );

    socket.on(
      'disconnect',
      handleDisconnect,
    );

    socket.on(
      'order:created',
      handleOrderCreated,
    );

    socket.on(
      'order:updated',
      handleOrderUpdated,
    );

    socket.on(
      'order:deleted',
      handleOrderDeleted,
    );

    socket.on(
      'users:online',
      handleUsersOnline,
    );

    socket.on(
      'orders:list',
      handleOrdersList,
    );

    socket.on(
      'order:message:created',
      handleMessageCreated,
    );

    socket.on(
      'order:messages:list',
      handleMessagesList,
    );

    socket.on(
      'order:viewers',
      handleOrderViewers,
    );

    socket.on(
      'order:typing',
      handleTyping,
    );

    return () => {
      socket.off(
        'connect',
        handleConnect,
      );

      socket.off(
        'disconnect',
        handleDisconnect,
      );

      socket.off(
        'order:created',
        handleOrderCreated,
      );

      socket.off(
        'order:updated',
        handleOrderUpdated,
      );

      socket.off(
        'order:deleted',
        handleOrderDeleted,
      );

      socket.off(
        'users:online',
        handleUsersOnline,
      );

      socket.off(
        'orders:list',
        handleOrdersList,
      );

      socket.off(
        'order:message:created',
        handleMessageCreated,
      );

      socket.off(
        'order:messages:list',
        handleMessagesList,
      );

      socket.off(
        'order:viewers',
        handleOrderViewers,
      );

      socket.off(
        'order:typing',
        handleTyping,
      );
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

  const openedOrder =
    orders.find(
      (order) =>
        order.id === openedOrderId,
    ) ?? null;

  const openedOrderMessages =
    messages.filter(
      (message) =>
        message.orderId === openedOrderId,
    );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Live Order Board
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Realtime order management
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
              Online:{' '}
              <span className="font-semibold text-slate-900">
                {onlineUsers}
              </span>
            </div>

            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                connected
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  connected
                    ? 'bg-emerald-500'
                    : 'bg-red-500'
                }`}
              />

              {connected
                ? 'Connected'
                : 'Disconnected'}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* USER */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {currentUserName === null ? (
            <>
              <h2 className="font-semibold">
                Представьтесь
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Имя будет отображаться в realtime-событиях.
              </p>

              <div className="mt-4 flex max-w-md gap-2">
                <input
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value,
                    )
                  }
                  placeholder="Ваше имя"
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <button
                  onClick={() => {
                    const trimmedName =
                      name.trim();

                    if (!trimmedName) {
                      return;
                    }

                    socket.emit(
                      'user:set-name',
                      {
                        name: trimmedName,
                      },
                    );

                    setCurrentUserName(
                      trimmedName,
                    );
                  }}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Сохранить
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                {currentUserName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Вы вошли как
                </p>

                <p className="font-semibold">
                  {currentUserName}
                </p>
              </div>
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* LEFT */}

          <section>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-lg font-semibold">
                  Заказы
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Создание и управление заказами в реальном времени.
                </p>

                <div className="mt-5 flex gap-2">
                  <input
                    value={title}
                    onChange={(e) =>
                      setTitle(
                        e.target.value,
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter'
                      ) {
                        createOrder();
                      }
                    }}
                    placeholder="Название нового заказа"
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  <button
                    onClick={createOrder}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    Создать
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {orders.length === 0 && (
                  <div className="p-10 text-center">
                    <p className="font-medium text-slate-600">
                      Заказов пока нет
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Создайте первый заказ выше.
                    </p>
                  </div>
                )}

                {orders.map(
                  (order) => {
                    const isOpened =
                      openedOrderId ===
                      order.id;

                    return (
                      <div
                        key={
                          order.id
                        }
                        className={`p-5 transition ${
                          isOpened
                            ? 'bg-blue-50/60'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-medium text-slate-400">
                                #
                                {
                                  order.id
                                }
                              </p>

                              <h3 className="mt-1 font-semibold">
                                {
                                  order.title
                                }
                              </h3>
                            </div>

                            {isOpened && (
                              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                                Открыт
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={
                                order.status
                              }
                              onChange={(
                                e,
                              ) => {
                                socket.emit(
                                  'order:update-status',
                                  {
                                    orderId:
                                      order.id,

                                    status:
                                      e
                                        .target
                                        .value,
                                  },
                                );
                              }}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                            >
                              <option value="NEW">
                                NEW
                              </option>

                              <option value="IN_PROGRESS">
                                IN PROGRESS
                              </option>

                              <option value="DONE">
                                DONE
                              </option>
                            </select>

                            {!isOpened ? (
                              <button
                                onClick={() => {
                                  socket.emit(
                                    'order:join',
                                    {
                                      orderId:
                                        order.id,
                                    },
                                  );

                                  setOpenedOrderId(
                                    order.id,
                                  );
                                }}
                                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                              >
                                Открыть
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  socket.emit(
                                    'order:typing:stop',
                                    {
                                      orderId:
                                        order.id,
                                    },
                                  );

                                  socket.emit(
                                    'order:leave',
                                    {
                                      orderId:
                                        order.id,
                                    },
                                  );

                                  setOpenedOrderId(
                                    null,
                                  );
                                }}
                                className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-300"
                              >
                                Закрыть
                              </button>
                            )}

                            <button
                              onClick={() => {
                                socket.emit(
                                  'order:delete',
                                  {
                                    orderId:
                                      order.id,
                                  },
                                );
                              }}
                              className="ml-auto rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </section>

          {/* RIGHT */}

          <section>
            <div className="sticky top-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {openedOrderId ===
              null ? (
                <div className="flex min-h-96 flex-col items-center justify-center p-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                    💬
                  </div>

                  <h2 className="mt-4 font-semibold">
                    Заказ не открыт
                  </h2>

                  <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                    Откройте заказ слева,
                    чтобы увидеть сообщения
                    и realtime-информацию.
                  </p>
                </div>
              ) : (
                <>
                  <div className="border-b border-slate-200 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          ЗАКАЗ
                        </p>

                        <h2 className="mt-1 text-lg font-semibold">
                          {openedOrder?.title ??
                            `#${openedOrderId}`}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />

                        {viewersByOrder[
                          openedOrderId
                        ] ?? 0}{' '}
                        смотрят
                      </div>
                    </div>
                  </div>

                  {/* MESSAGES */}

                  <div className="flex h-96 flex-col">
                    <div className="flex-1 space-y-3 overflow-y-auto p-5">
                      {openedOrderMessages.length ===
                        0 && (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-sm text-slate-400">
                            Сообщений пока нет
                          </p>
                        </div>
                      )}

                      {openedOrderMessages.map(
                        (
                          message,
                        ) => (
                          <div
                            key={
                              message.id
                            }
                            className="max-w-[85%] rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3"
                          >
                            <p className="text-sm leading-6">
                              {
                                message.text
                              }
                            </p>

                            <p className="mt-1 text-[11px] text-slate-400">
                              {new Date(
                                message.createdAt,
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour:
                                    '2-digit',
                                  minute:
                                    '2-digit',
                                },
                              )}
                            </p>
                          </div>
                        ),
                      )}
                    </div>

                    {/* TYPING */}

                    <div className="min-h-7 px-5">
                      {typingByOrder[
                        openedOrderId
                      ] && (
                        <p className="text-xs text-slate-400">
                          <span className="font-medium text-slate-600">
                            {
                              typingByOrder[
                                openedOrderId
                              ]
                            }
                          </span>{' '}
                          печатает...
                        </p>
                      )}
                    </div>

                    {/* SEND */}

                    <div className="border-t border-slate-200 p-4">
                      <div className="flex gap-2">
                        <input
                          value={
                            messageText
                          }
                          onChange={(
                            e,
                          ) => {
                            const value =
                              e.target
                                .value;

                            setMessageText(
                              value,
                            );

                            socket.emit(
                              'order:typing:start',
                              {
                                orderId:
                                  openedOrderId,
                              },
                            );

                            if (
                              typingTimeoutRef.current !==
                              null
                            ) {
                              clearTimeout(
                                typingTimeoutRef.current,
                              );
                            }

                            typingTimeoutRef.current =
                              window.setTimeout(
                                () => {
                                  socket.emit(
                                    'order:typing:stop',
                                    {
                                      orderId:
                                        openedOrderId,
                                    },
                                  );
                                },
                                1000,
                              );
                          }}
                          onKeyDown={(
                            e,
                          ) => {
                            if (
                              e.key ===
                              'Enter'
                            ) {
                              if (
                                !messageText.trim()
                              ) {
                                return;
                              }

                              socket.emit(
                                'order:message:send',
                                {
                                  orderId:
                                    openedOrderId,

                                  text: messageText.trim(),
                                },
                              );

                              socket.emit(
                                'order:typing:stop',
                                {
                                  orderId:
                                    openedOrderId,
                                },
                              );

                              setMessageText(
                                '',
                              );
                            }
                          }}
                          placeholder="Введите сообщение..."
                          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />

                        <button
                          onClick={() => {
                            if (
                              !messageText.trim()
                            ) {
                              return;
                            }

                            socket.emit(
                              'order:message:send',
                              {
                                orderId:
                                  openedOrderId,

                                text: messageText.trim(),
                              },
                            );

                            if (
                              typingTimeoutRef.current !==
                              null
                            ) {
                              clearTimeout(
                                typingTimeoutRef.current,
                              );

                              typingTimeoutRef.current =
                                null;
                            }

                            socket.emit(
                              'order:typing:stop',
                              {
                                orderId:
                                  openedOrderId,
                              },
                            );

                            setMessageText(
                              '',
                            );
                          }}
                          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                          Отправить
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;