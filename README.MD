# Live Order Board

Учебный realtime-проект для практики WebSocket в NestJS и React.

## Стек

- NestJS
- Socket.IO
- React
- TypeScript
- Tailwind CSS

## Что реализовано

- подключение и отключение WebSocket-клиентов;
- отображение количества пользователей онлайн;
- создание заказов в реальном времени;
- изменение статуса заказа;
- удаление заказов;
- восстановление списка заказов после обновления страницы;
- Socket.IO Rooms для отдельных заказов;
- отображение количества пользователей, которые смотрят заказ;
- realtime-сообщения внутри заказа;
- история сообщений;
- typing indicator;
- автоматический `typing:stop` через timeout;
- установка имени пользователя;
- отображение имени пользователя в typing indicator.

## Основные WebSocket-события

### Заказы

```text
order:create
order:created

order:update-status
order:updated

order:delete
order:deleted

orders:get-all
orders:list