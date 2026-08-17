/**
 * Админ-панель: полностью клиентская версия с localStorage.
 * Для «Чистый Финал» — ДЗ курс.
 */

// ============================================================
// Вход в админ-панель
// ============================================================
const ADMIN_PASSWORD = 'admin123';

function isAuthed() {
  return localStorage.getItem('cf_admin_auth') === '1';
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-app').style.display = 'block';
}

function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-app').style.display = 'none';
}

function tryLogin() {
  const pass = document.getElementById('login-password').value;
  if (pass === ADMIN_PASSWORD) {
    localStorage.setItem('cf_admin_auth', '1');
    document.getElementById('login-error').textContent = '';
    showApp();
  } else {
    document.getElementById('login-error').textContent = 'Неверный пароль';
  }
}

// ============================================================
// Демо-данные (как из БД)
// ============================================================
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

const DEFAULT_ORDERS = [
  { id: 1, client_name: 'Анна М.', phone: '+79131111111', chat_message: 'Нужна уборка квартиры 45м, после ремонта', property_type: 'Квартира', area: 45, tariff_id: 1, total_price: 10498, status: 'confirmed', is_urgent: 0, is_night: 0, floors_count: 1, created_at: '2026-07-10 10:00:00', scheduled_date: '2026-07-12', scheduled_time: '', services: [{ service_id: 3, quantity: 4 }, { service_id: 1, quantity: 5 }] },
  { id: 2, client_name: 'Борис К.', phone: '+79132222222', chat_message: 'Квартира 60м, нужна капитальная уборка, срочно!', property_type: 'Квартира', area: 60, tariff_id: 2, total_price: 14280, status: 'calculated', is_urgent: 1, is_night: 0, floors_count: 1, created_at: '2026-07-11 14:30:00', scheduled_date: '2026-07-12', scheduled_time: '', services: [{ service_id: 1, quantity: 3 }] },
  { id: 3, client_name: 'Виктор Д.', phone: '+79133333333', chat_message: 'Коттедж 200м, после стройки, 2 этажа', property_type: 'Коттедж', area: 200, tariff_id: 3, total_price: 0, status: 'new', is_urgent: 0, is_night: 0, floors_count: 2, created_at: '2026-07-12 09:00:00', scheduled_date: '2026-07-15', scheduled_time: '', services: [{ service_id: 2, quantity: 1 }, { service_id: 3, quantity: 8 }, { service_id: 4, quantity: 50 }] },
  { id: 4, client_name: 'Галина С.', phone: '+79134444444', chat_message: 'Уборка 20м, Лайт', property_type: 'Квартира', area: 20, tariff_id: 1, total_price: 5000, status: 'confirmed', is_urgent: 0, is_night: 0, floors_count: 1, created_at: '2026-07-13 11:00:00', scheduled_date: '2026-07-14', scheduled_time: '', services: [{ service_id: 5, quantity: 1 }] },
  { id: 5, client_name: 'Дмитрий Л.', phone: '+79135555555', chat_message: 'Квартира 80м, нужна уборка, могу заказать онлайн', property_type: 'Квартира', area: 80, tariff_id: 2, total_price: 0, status: 'new', is_urgent: 0, is_night: 0, floors_count: 1, created_at: '2026-07-14 16:00:00', scheduled_date: '2026-07-16', scheduled_time: '', services: [{ service_id: 3, quantity: 6 }, { service_id: 1, quantity: 2 }] },
];

const DEFAULT_TEAMS = [
  { id: 1, name: 'Бригада №1 — Чистота', is_available: true },
  { id: 2, name: 'Бригада №2 — Порядок', is_available: true },
  { id: 3, name: 'Бригада №3 — Блеск', is_available: false },
];

// ============================================================
// localStorage обёртка
// ============================================================
function loadData(key, defaultVal) {
  try {
    const raw = localStorage.getItem('cf_' + key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return JSON.parse(JSON.stringify(defaultVal));
}

function saveData(key, val) {
  localStorage.setItem('cf_' + key, JSON.stringify(val));
}

let tariffsData = loadData('tariffs', DEFAULT_TARIFFS);
let servicesData = loadData('services', DEFAULT_SERVICES);
let ordersData = loadData('orders', DEFAULT_ORDERS);
let teamsData = loadData('teams', DEFAULT_TEAMS);

// ============================================================
// Серверные заявки (Netlify Functions + Blobs)
// ============================================================
async function loadServerOrders() {
  try {
    const res = await fetch('/api/orders');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (Array.isArray(data)) {
      ordersData = data;
      saveData('orders', ordersData);
      renderOrders();
      renderTeamsAndStats();
    }
  } catch (e) {
    console.warn('Сервер заявок недоступен, использую локальные данные:', e.message);
  }
}

async function pushOrderToServer(order) {
  try {
    await fetch('/api/orders/' + order.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
  } catch (e) {
    console.warn('Не удалось сохранить заявку на сервере:', e.message);
  }
}

// ============================================================
// Серверный каталог и бригады (Netlify Functions + Blobs)
// ============================================================
async function loadServerData() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data.tariffs && Array.isArray(data.tariffs)) {
      tariffsData = data.tariffs;
      saveData('tariffs', tariffsData);
    }
    if (data.services && Array.isArray(data.services)) {
      servicesData = data.services;
      saveData('services', servicesData);
    }
    if (data.teams && Array.isArray(data.teams)) {
      teamsData = data.teams;
      saveData('teams', teamsData);
    }
    renderTariffs();
    renderServices();
    renderTeamsAndStats();
  } catch (e) {
    console.warn('Сервер каталога недоступен, использую локальные данные:', e.message);
  }
}

async function pushDataToServer() {
  try {
    await fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tariffs: tariffsData, services: servicesData, teams: teamsData })
    });
  } catch (e) {
    console.warn('Не удалось сохранить каталог на сервере:', e.message);
  }
}

// ============================================================
// Калькулятор (клиентская версия)
// ============================================================
function calculate({ area, price_per_sqm, min_order, services = [], is_urgent = false, is_night = false, floors_count = 1, property_is_cottage = false, is_online = false }) {
  let base = area * price_per_sqm;
  if (base < min_order) base = min_order;
  let sum = base;
  for (const svc of services) sum += svc.price * svc.quantity;
  let floorMod = (property_is_cottage && floors_count > 1) ? 1 + (floors_count - 1) * 0.10 : 1;
  let urgentMod = is_urgent ? 1.20 : 1;
  let nightMod = is_night ? 1.30 : 1;
  let onlineMod = is_online ? 0.95 : 1;
  let total = sum * floorMod * urgentMod * nightMod * onlineMod;
  return Math.ceil(Math.round(total * 100) / 100);
}

// ============================================================
// Инициализация
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-btn').addEventListener('click', tryLogin);
  document.getElementById('login-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') tryLogin();
  });
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('cf_admin_auth');
    document.getElementById('login-password').value = '';
    showLogin();
  });

  initTabs();
  renderTariffs();
  renderServices();
  renderOrders();
  renderTeamsAndStats();
  initModal();
  loadServerOrders();
  loadServerData();

  if (isAuthed()) {
    showApp();
  } else {
    showLogin();
  }
});

// ============================================================
// Переключение вкладок
// ============================================================
function initTabs() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
      if (tab.dataset.tab === 'orders') renderOrders();
      if (tab.dataset.tab === 'teams') renderTeamsAndStats();
      if (tab.dataset.tab === 'archive') renderArchive();
    });
  });
}

// ============================================================
// Вкладка 1: Каталог
// ============================================================
function renderTariffs() {
  const tbody = document.getElementById('tariffs-body');
  tbody.innerHTML = tariffsData.map((t) => `
    <tr>
      <td><strong>${t.name}</strong></td>
      <td>${t.description || ''}</td>
      <td><input type="number" class="input-sm" data-tariff-id="${t.id}" data-field="price_per_sqm" value="${t.price_per_sqm}" min="0"></td>
      <td><input type="number" class="input-sm" data-tariff-id="${t.id}" data-field="min_order" value="${t.min_order}" min="0"></td>
      <td><span class="badge">Редактируется</span></td>
    </tr>
  `).join('');
}

function renderServices() {
  const tbody = document.getElementById('services-body');
  tbody.innerHTML = servicesData.map((s) => `
    <tr>
      <td><strong>${s.name}</strong></td>
      <td>${s.unit}</td>
      <td><input type="number" class="input-sm" data-service-id="${s.id}" data-field="price" value="${s.price}" min="0"></td>
      <td><span class="badge">Редактируется</span></td>
    </tr>
  `).join('');
}

document.getElementById('save-catalog').addEventListener('click', () => {
  for (const t of tariffsData) {
    const priceInput = document.querySelector(`[data-tariff-id="${t.id}"][data-field="price_per_sqm"]`);
    const minInput = document.querySelector(`[data-tariff-id="${t.id}"][data-field="min_order"]`);
    t.price_per_sqm = parseInt(priceInput.value);
    t.min_order = parseInt(minInput.value);
  }
  for (const s of servicesData) {
    const priceInput = document.querySelector(`[data-service-id="${s.id}"][data-field="price"]`);
    s.price = parseInt(priceInput.value);
  }
  saveData('tariffs', tariffsData);
  saveData('services', servicesData);
  pushDataToServer();
  alert('Каталог сохранён!');
});

// ============================================================
// Вкладка 2: Заявки
// ============================================================
function renderOrders() {
  const container = document.getElementById('orders-list');
  const active = ordersData.filter((o) => o.status === 'new' || o.status === 'calculated' || o.status === 'confirmed');
  if (active.length === 0) {
    container.innerHTML = '<p class="empty-text">Заявок пока нет</p>';
    return;
  }
  const statusLabels = { new: 'Новая', calculated: 'Рассчитана', confirmed: 'Подтверждена', completed: 'Выполнена', cancelled: 'Отменена' };
  const statusClasses = { new: 'status-new', calculated: 'status-calculated', confirmed: 'status-confirmed', completed: 'status-completed', cancelled: 'status-cancelled' };

  container.innerHTML = active.map((o) => {
    const tariff = tariffsData.find((t) => t.id === o.tariff_id);
    const team = teamsData.find((t) => t.id === o.team_id);
    const teamInfo = team ? `<span class="order-team">Бригада: ${team.name}${o.team_departure_time ? ' в ' + o.team_departure_time : ''}</span>` : '';
    return `
    <div class="order-card" data-order-id="${o.id}">
      <div class="order-card-header">
        <strong>${o.client_name}</strong>
        <span class="status-badge ${statusClasses[o.status]}">${statusLabels[o.status] || o.status}</span>
        ${o.is_night ? '<span class="status-badge" style="background:#1E1B4B;color:#C4B5FD;">Ночь +30%</span>' : ''}
      </div>
      <div class="order-card-body">
        <div class="order-info">
          <span>Телефон: ${o.phone || '—'}</span>
          <span>Дата: ${o.scheduled_date || '—'}</span>
          <span>Время: ${o.scheduled_time || '—'}</span>
          <span>Площадь: ${o.area ? o.area + ' м²' : '—'}</span>
          <span>Тариф: ${tariff ? tariff.name : '—'}</span>
          <span class="order-price">Итого: ${o.total_price ? o.total_price + ' ₽' : 'не рассчитано'}</span>
          ${teamInfo}
        </div>
        <p class="order-message">${o.chat_message || ''}</p>
      </div>
    </div>`;
  }).join('');

  container.querySelectorAll('.order-card').forEach((card) => {
    card.addEventListener('click', () => openOrderModal(parseInt(card.dataset.orderId)));
  });
}

// ============================================================
// Архив: выполненные и отменённые заявки
// ============================================================
function renderArchive() {
  const container = document.getElementById('archive-list');
  const archived = ordersData.filter((o) => o.status === 'completed' || o.status === 'cancelled');
  if (archived.length === 0) {
    container.innerHTML = '<p class="empty-text">Архив пуст</p>';
    return;
  }
  const statusLabels = { completed: 'Выполнена', cancelled: 'Отменена' };
  const statusClasses = { completed: 'status-completed', cancelled: 'status-cancelled' };
  container.innerHTML = archived.map((o) => {
    const tariff = tariffsData.find((t) => t.id === o.tariff_id);
    const team = teamsData.find((t) => t.id === o.team_id);
    const teamInfo = team ? `<span class="order-team">Бригада: ${team.name}</span>` : '';
    return `
    <div class="order-card" data-order-id="${o.id}">
      <div class="order-card-header">
        <strong>${o.client_name}</strong>
        <span class="status-badge ${statusClasses[o.status]}">${statusLabels[o.status]}</span>
        ${o.is_night ? '<span class="status-badge" style="background:#1E1B4B;color:#C4B5FD;">Ночь +30%</span>' : ''}
      </div>
      <div class="order-card-body">
        <div class="order-info">
          <span>Телефон: ${o.phone || '—'}</span>
          <span>Дата: ${o.scheduled_date || '—'}</span>
          <span>Площадь: ${o.area ? o.area + ' м²' : '—'}</span>
          <span>Тариф: ${tariff ? tariff.name : '—'}</span>
          <span class="order-price">Итого: ${o.total_price ? o.total_price + ' ₽' : '—'}</span>
          ${teamInfo}
        </div>
        <p class="order-message">${o.chat_message || ''}</p>
      </div>
    </div>`;
  }).join('');

  container.querySelectorAll('.order-card').forEach((card) => {
    card.addEventListener('click', () => openOrderModal(parseInt(card.dataset.orderId)));
  });
}

// ============================================================
// Вкладка 3: Бригады и статистика
// ============================================================
function renderTeamsAndStats() {
  const now = new Date();
  const confirmed = ordersData.filter((o) => o.status === 'confirmed' || o.status === 'completed');
  const thisMonth = confirmed.filter((o) => {
    const m = o.created_at && o.created_at.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    return m && parseInt(m[2]) === now.getMonth() + 1 && parseInt(m[3]) === now.getFullYear();
  });
  const totalRevenue = thisMonth.reduce((s, o) => s + (o.total_price || 0), 0);
  const avgPrice = thisMonth.length ? Math.round(totalRevenue / thisMonth.length) : 0;
  const todayStr = now.toLocaleDateString('ru-RU');
  const todayOrders = ordersData.filter((o) => o.created_at && o.created_at.startsWith(todayStr)).length;

  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card"><div class="stat-value">${todayOrders}</div><div class="stat-label">Заявок за сегодня</div></div>
    <div class="stat-card"><div class="stat-value">${formatPrice(totalRevenue)}</div><div class="stat-label">Выручка за месяц</div></div>
    <div class="stat-card"><div class="stat-value">${formatPrice(avgPrice)}</div><div class="stat-label">Средний чек</div></div>
    <div class="stat-card"><div class="stat-value">${ordersData.length}</div><div class="stat-label">Всего заявок</div></div>
  `;

  const activeOrders = ordersData.filter((o) => o.status === 'confirmed' || o.status === 'calculated');
  const teamsList = document.getElementById('teams-list');
  teamsList.innerHTML = teamsData.map((t) => {
    const assigned = activeOrders.filter((o) => o.team_id === t.id);
    const isBusy = assigned.length > 0;
    const job = assigned.map((o) =>
      `<div class="team-job">${o.client_name} — ${o.scheduled_date || 'дата не указана'}${o.team_departure_time ? ', ' + o.team_departure_time : ''}</div>`
    ).join('');
    return `
    <div class="team-card">
      <div class="team-info">
        <strong>${t.name}</strong>
        <span class="team-status ${isBusy ? 'busy' : 'available'}">${isBusy ? 'Занята' : 'Свободна'}</span>
      </div>
      ${isBusy ? `<div class="team-jobs">${job}</div>` : ''}
    </div>`;
  }).join('');
}

// ============================================================
// Модальное окно заявки
// ============================================================
let currentOrderId = null;

function initModal() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });
  document.getElementById('modal-confirm').addEventListener('click', confirmOrder);
  document.getElementById('modal-complete').addEventListener('click', completeOrder);
  document.getElementById('modal-cancel').addEventListener('click', cancelOrder);
  ['modal-area', 'modal-tariff', 'modal-property-type', 'modal-floors', 'modal-urgent', 'modal-night'].forEach((id) => {
    document.getElementById(id).addEventListener('input', recalcFromModal);
  });
}

function openOrderModal(orderId) {
  const order = ordersData.find((o) => o.id === orderId);
  if (!order) return;
  currentOrderId = orderId;

  document.getElementById('modal-order-id').textContent = orderId;
  document.getElementById('modal-chat-message').textContent = order.chat_message || '—';
  document.getElementById('modal-client-name').textContent = order.client_name;
  document.getElementById('modal-client-phone').textContent = order.phone || '—';
  document.getElementById('modal-area').value = order.area || '';
  document.getElementById('modal-property-type').value = order.property_type || 'Квартира';
  document.getElementById('modal-floors').value = order.floors_count || 1;
  document.getElementById('modal-urgent').checked = !!order.is_urgent;
  document.getElementById('modal-night').checked = !!order.is_night;
  document.getElementById('modal-scheduled').value = order.scheduled_date || '';
  const departureTime = order.team_departure_time || order.scheduled_time || '';
  document.getElementById('modal-time').value = departureTime;

  const teamSelect = document.getElementById('modal-team');
  teamSelect.innerHTML = '<option value="">Не назначена</option>' + teamsData.map((t) =>
    `<option value="${t.id}" ${t.id === order.team_id ? 'selected' : ''}>${t.name}</option>`
  ).join('');

  const select = document.getElementById('modal-tariff');
  select.innerHTML = tariffsData.map((t) =>
    `<option value="${t.id}" ${t.id === order.tariff_id ? 'selected' : ''}>${t.name} — ${t.price_per_sqm} ₽/м²</option>`
  ).join('');

  const svcContainer = document.getElementById('modal-services-list');
  svcContainer.innerHTML = servicesData.map((s) => {
    const sel = (order.services || []).find((os) => os.service_id === s.id);
    const qty = sel ? sel.quantity : 0;
    return `
      <div class="service-row">
        <label class="service-label">
          <input type="checkbox" data-service-id="${s.id}" ${sel ? 'checked' : ''}> ${s.name} (${s.unit} — ${s.price} ₽)
        </label>
        <input type="number" class="input-sm qty-input" data-service-id="${s.id}" value="${qty}" min="0" ${sel ? '' : 'disabled'}>
      </div>`;
  }).join('');

  svcContainer.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const qi = svcContainer.querySelector(`.qty-input[data-service-id="${cb.dataset.serviceId}"]`);
      qi.disabled = !cb.checked;
      if (cb.checked && parseInt(qi.value) === 0) qi.value = 1;
      recalcFromModal();
    });
  });
  svcContainer.querySelectorAll('.qty-input').forEach((qi) => {
    qi.addEventListener('input', recalcFromModal);
  });

  document.getElementById('modal-total-price').textContent = order.total_price ? order.total_price + ' ₽' : '— ₽';
  recalcFromModal();
  document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  currentOrderId = null;
}

function getModalData() {
  const area = parseFloat(document.getElementById('modal-area').value) || 0;
  const tariffId = parseInt(document.getElementById('modal-tariff').value);
  const propertyType = document.getElementById('modal-property-type').value;
  const floorsCount = parseInt(document.getElementById('modal-floors').value) || 1;
  const isUrgent = document.getElementById('modal-urgent').checked;
  const isNight = document.getElementById('modal-night').checked;
  const scheduledDate = document.getElementById('modal-scheduled').value;
  const teamId = parseInt(document.getElementById('modal-team').value) || null;
  const teamDepartureTime = document.getElementById('modal-time').value.trim();
  const services = [];
  document.querySelectorAll('#modal-services-list input[type="checkbox"]:checked').forEach((cb) => {
    const serviceId = parseInt(cb.dataset.serviceId);
    const qtyInput = document.querySelector(`.qty-input[data-service-id="${serviceId}"]`);
    const quantity = parseInt(qtyInput.value) || 0;
    if (quantity > 0) services.push({ service_id: serviceId, quantity });
  });
  return { area, tariff_id: tariffId, property_type: propertyType, floors_count: floorsCount, is_urgent: isUrgent, is_night: isNight, services, scheduled_date: scheduledDate, team_id: teamId, team_departure_time: teamDepartureTime };
}

function recalcFromModal() {
  const data = getModalData();
  if (!data.area || !data.tariff_id) { document.getElementById('modal-total-price').textContent = '— ₽'; return; }
  const tariff = tariffsData.find((t) => t.id === data.tariff_id);
  if (!tariff) return;
  const svcList = data.services.map((s) => {
    const svc = servicesData.find((sd) => sd.id === s.service_id);
    return { price: svc ? svc.price : 0, quantity: s.quantity };
  });
  const total = calculate({
    area: data.area, price_per_sqm: tariff.price_per_sqm, min_order: tariff.min_order,
    services: svcList, is_urgent: data.is_urgent, is_night: data.is_night,
    floors_count: data.floors_count, property_is_cottage: data.property_type === 'Коттедж',
  });
  document.getElementById('modal-total-price').textContent = total + ' ₽';
}

function saveOrder() {
  if (currentOrderId === null) return;
  const data = getModalData();
  const order = ordersData.find((o) => o.id === currentOrderId);
  if (!order) return;
  Object.assign(order, data);
  const tariff = tariffsData.find((t) => t.id === data.tariff_id);
  if (tariff) {
    const svcList = data.services.map((s) => {
      const svc = servicesData.find((sd) => sd.id === s.service_id);
      return { price: svc ? svc.price : 0, quantity: s.quantity };
    });
    order.total_price = calculate({
      area: data.area, price_per_sqm: tariff.price_per_sqm, min_order: tariff.min_order,
      services: svcList, is_urgent: data.is_urgent, is_night: data.is_night,
      floors_count: data.floors_count, property_is_cottage: data.property_type === 'Коттедж',
    });
  }
  saveData('orders', ordersData);
  pushOrderToServer(order);
  document.getElementById('modal-total-price').textContent = order.total_price + ' ₽';
}

function confirmOrder() {
  if (currentOrderId === null) return;
  saveOrder();
  const order = ordersData.find((o) => o.id === currentOrderId);
  if (order) { order.status = 'confirmed'; saveData('orders', ordersData); pushOrderToServer(order); }
  alert('Заявка подтверждена!');
  closeModal();
  renderOrders();
}

function completeOrder() {
  if (currentOrderId === null) return;
  const order = ordersData.find((o) => o.id === currentOrderId);
  if (!order) return;
  order.status = 'completed';
  saveData('orders', ordersData);
  pushOrderToServer(order);
  alert('Заявка выполнена и перемещена в архив!');
  closeModal();
  renderOrders();
}

function cancelOrder() {
  if (currentOrderId === null) return;
  const order = ordersData.find((o) => o.id === currentOrderId);
  if (!order) return;
  if (!confirm('Отменить заявку ' + order.client_name + '?')) return;
  order.status = 'cancelled';
  saveData('orders', ordersData);
  pushOrderToServer(order);
  alert('Заявка отменена и перемещена в архив!');
  closeModal();
  renderOrders();
}

// ============================================================
// Утилиты
// ============================================================
function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

// ============================================================
// Тёмная тема
// ============================================================
const themeBtn = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('cf_theme') || 'light';
if (savedTheme === 'dark') {
  document.body.classList.add('dark-theme');
  themeBtn.textContent = '☀️';
}
themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  const isDark = document.body.classList.contains('dark-theme');
  themeBtn.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('cf_theme', isDark ? 'dark' : 'light');
});
