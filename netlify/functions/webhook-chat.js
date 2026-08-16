const { getStore, connectLambda } = require('@netlify/blobs');

/**
 * Приём заявки с лендинга (чат-бот и формы).
 * POST /api/webhook/chat  →  /.netlify/functions/webhook-chat
 * Сохраняет заявку в Netlify Blobs (store "orders").
 */
exports.handler = async (event) => {
  connectLambda(event);

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const store = getStore('orders');
    const id = Date.now();

    const order = {
      id,
      client_name: data.name || 'Не указано',
      phone: data.phone || '',
      chat_message: [data.address, data.date, data.time].filter(Boolean).join(', ') || data.chat_message || '',
      property_type: data.type || 'Квартира',
      area: data.area ? Number(data.area) : 0,
      status: 'new',
      source: data.source || 'Чат',
      created_at: new Date().toLocaleString('ru-RU'),
      scheduled_date: data.date || '',
      scheduled_time: data.time || '',
      is_urgent: 0,
      is_night: 0,
      total_price: 0
    };

    await store.set(String(id), JSON.stringify(order));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, id })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: String((e && e.message) || e) })
    };
  }
};
