// pendientes.js
const API_BASE = ''; // relativo en prod (en local con vercel dev también funciona)

function base() {
  return (typeof API_BASE === 'string' && API_BASE) ? API_BASE : '';
}

export async function obtenerPendientes() {
  try {
    const res = await fetch(`${base()}/api/pendientes`, { cache: 'no-store' });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json && json.ok !== false && Array.isArray(json.data)) {
      return json.data;
    }
  } catch (e) {
    console.warn('obtenerPendientes falló:', e);
  }
  return []; // ante error, lista vacía
}

export async function consumirPendiente(id) {
  try {
    const url = `${base()}/api/pendientes?id=${encodeURIComponent(id)}`;
    const res = await fetch(url, { method: 'DELETE' });
    const json = await res.json().catch(() => ({}));
    return res.ok && (json.ok !== false); // true si borró
  } catch (e) {
    console.warn('consumirPendiente falló:', e);
    return false;
  }
}

export function renderTarjetaPendiente(item, onRegistrar) {
  const card = document.createElement('div');
  card.className = 'pendiente-card';

  card.innerHTML = `
    <div class="pendiente-izq">
      <div class="placa">${item.placa}</div>
      <div class="hora">${item.hora ?? ''}</div>
      <button class="btn-registrar">Registrar</button>
    </div>
    <div class="pendiente-der">
      ${item.imagen ? `<img src="${item.imagen}" alt="placa ${item.placa}">` : ''}
    </div>
  `;

  card.querySelector('.btn-registrar')
      .addEventListener('click', () => onRegistrar(item, card));

  return card;
}
