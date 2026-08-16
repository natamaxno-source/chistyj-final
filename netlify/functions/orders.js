const { getStore, connectLambda } = require('@netlify/blobs');

/**
 * Чтение и обновление заявок для админ-панели.
 * GET   /api/orders        → список всех заявок
 * PATCH /api/orders/:id    → обновление заявки
 * Все данные в Netlify Blobs (store "orders").
 */
exports.handler = async (event) => {
  connectLambda(event);

  const store = getStore('orders');

  try {
    if (event.httpMethod === 'GET') {
      const list = await store.list();
      const orders = [];
      for (const item of list.blobs) {
        const raw = await store.get(item.key, { type: 'text' });
        if (raw) {
          try { orders.push(JSON.parse(raw)); } catch (_) { /* пропускаем повреждённые */ }
        }
      }
      orders.sort((a, b) => b.id - a.id);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        body: JSON.stringify(orders)
      };
    }

    if (event.httpMethod === 'PATCH') {
      const parts = event.path.split('/').filter(Boolean);
      const id = parts[parts.length - 1];
      if (!id || id === 'orders') {
        return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Не указан id заявки' }) };
      }
      const body = JSON.parse(event.body || '{}');
      const raw = await store.get(String(id), { type: 'text' });
      if (!raw) {
        return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Заявка не найдена' }) };
      }
      const order = JSON.parse(raw);
      Object.assign(order, body);
      await store.set(String(id), JSON.stringify(order));
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        body: JSON.stringify(order)
      };
    }

    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: String((e && e.message) || e) })
    };
  }
};
