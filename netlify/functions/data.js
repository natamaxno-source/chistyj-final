const { getStore, connectLambda } = require('@netlify/blobs');

/**
 * Каталог (тарифы, услуги) и бригады для админ-панели.
 * GET /api/data        → { tariffs, services, teams }
 * PUT /api/data        → сохранить все три набора
 * Данные в Netlify Blobs (store "settings").
 */

const DEFAULT_TARIFFS = [
  { id: 1, name: 'Лайт', description: 'Косметическая уборка — быстрое обновление интерьера', price_per_sqm: 120, min_order: 5000 },
  { id: 2, name: 'Стандарт', description: 'Капитальная уборка — глубокая чистка всех поверхностей', price_per_sqm: 170, min_order: 7000 },
  { id: 3, name: 'Премиум', description: 'После строительных/ремонтных работ — полная очистка', price_per_sqm: 230, min_order: 10000 },
];

const DEFAULT_SERVICES = [
  { id: 1, name: 'Вывоз мусора (мешок)', unit: 'шт.', price: 400 },
  { id: 2, name: 'Вывоз мусора (Газель)', unit: 'рейс', price: 3500 },
  { id: 3, name: 'Мойка окна (1 створка)', unit: 'шт.', price: 350 },
  { id: 4, name: 'Снятие защитной плёнки', unit: 'пог. м', price: 200 },
  { id: 5, name: 'Химчистка дивана (2-мест.)', unit: 'шт.', price: 2500 },
];

const DEFAULT_TEAMS = [
  { id: 1, name: 'Бригада №1 — Чистота', is_available: true },
  { id: 2, name: 'Бригада №2 — Порядок', is_available: true },
  { id: 3, name: 'Бригада №3 — Блеск', is_available: false },
];

exports.handler = async (event) => {
  connectLambda(event);

  const store = getStore('settings');

  const readJson = async (key, fallback) => {
    const raw = await store.get(key, { type: 'text' });
    if (!raw) return JSON.parse(JSON.stringify(fallback));
    try { return JSON.parse(raw); } catch (_) { return JSON.parse(JSON.stringify(fallback)); }
  };

  try {
    if (event.httpMethod === 'GET') {
      const data = {
        tariffs: await readJson('tariffs', DEFAULT_TARIFFS),
        services: await readJson('services', DEFAULT_SERVICES),
        teams: await readJson('teams', DEFAULT_TEAMS)
      };
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        body: JSON.stringify(data)
      };
    }

    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      if (Array.isArray(body.tariffs)) await store.set('tariffs', JSON.stringify(body.tariffs));
      if (Array.isArray(body.services)) await store.set('services', JSON.stringify(body.services));
      if (Array.isArray(body.teams)) await store.set('teams', JSON.stringify(body.teams));
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        body: JSON.stringify({ ok: true })
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
