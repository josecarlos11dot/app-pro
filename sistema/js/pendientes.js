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
  card.dataset.id = String(item?.id ?? '');

  const placaSafe  = String(item?.placa ?? '');
  const imagenSafe = typeof item?.imagen === 'string' ? item.imagen : '';

  card.innerHTML = `
    <div class="pendiente-izq">
      <div class="placa">${placaSafe}</div>
      <div class="hora">${item?.hora ?? ''}</div>

      <!-- seguimos usando <a> para el :target del modal -->
      <a class="btn-registrar"
         href="#formulario"
         role="button"
         aria-controls="formulario"
         data-placa="${placaSafe}"
         data-imagen="${imagenSafe}">
        Registrar
      </a>
    </div>
    <div class="pendiente-der">
      ${imagenSafe ? `<img src="${imagenSafe}" alt="placa ${placaSafe}">` : ''}
    </div>
  `;

  // Parche clave: precargar y forzar el hash para abrir el modal con :target
  const btn = card.querySelector('.btn-registrar');
  btn.addEventListener('click', (e) => {
    try { onRegistrar?.(item, card); } catch (err) { console.warn('onRegistrar falló:', err); }
    e.preventDefault(); // robusto ante handlers globales
    if (location.hash !== '#formulario') {
      location.hash = '#formulario';
    } else {
      // si ya está en #formulario, "retoca" para reenfocar (opcional)
      location.hash = '';
      location.hash = '#formulario';
    }
  });

  return card;
}
