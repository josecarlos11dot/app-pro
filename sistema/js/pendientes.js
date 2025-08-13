// pendientes.js
const API_BASE = ''; // relativo en prod

export async function obtenerPendientes() {
  const res = await fetch(`${API_BASE}/api/pendientes`, { cache: 'no-store' });
  const json = await res.json();
  return json.ok ? json.data : [];
}

export async function consumirPendiente(id) {
  const res = await fetch(`${API_BASE}/api/pendientes/${id}`, { method: 'DELETE' });
  const json = await res.json();
  return json.ok;
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

  card.querySelector('.btn-registrar').addEventListener('click', () => onRegistrar(item, card));
  return card;
}
