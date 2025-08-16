// ===============================
// main.js – Pendientes + miniatura con zoom
// ===============================

// 🌐 Base de API (relativa en prod). Puedes sobreescribir con window.API_BASE_OVERRIDE
const API_BASE =
  (typeof window !== 'undefined' && window.API_BASE_OVERRIDE)
    ? window.API_BASE_OVERRIDE
    : '';

// 📥 Importar funciones ya existentes en tu proyecto
import { abrirFormulario } from './registro.js';
import { mostrarRegistrosDelServidor } from './tabla.js';
import { urlImagenSegura } from './utilidades.js';

// ========== Modal de imagen (lightbox) ==========
function ensureImageModal() {
  let modal = document.getElementById('imgModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'imgModal';
    modal.style.cssText = `
      position:fixed; inset:0; display:none;
      align-items:center; justify-content:center;
      background:rgba(0,0,0,.75); z-index:9999; padding:16px;
    `;
    modal.innerHTML = `
      <div style="max-width:90vw; max-height:90vh;">
        <img id="imgModalImg" alt=""
             style="display:block; margin:auto; max-width:100%; max-height:90vh; border-radius:12px;">
      </div>
    `;
    modal.addEventListener('click', () => { modal.style.display = 'none'; });
    document.body.appendChild(modal);
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') modal.style.display = 'none';
    });
  }
  return modal;
}
function openImageModal(src, alt = '') {
  const modal = ensureImageModal();
  const img = modal.querySelector('#imgModalImg');
  img.src = src;
  img.alt = alt || '';
  modal.style.display = 'flex';
}

// ===============================
// Estado
// ===============================
let pendienteEnEdicion = null; // { id, card, placa }

// ===============================
// Helpers
// ===============================
const horaCorta = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Contenedor para las tarjetas de pendientes (si no existe lo crea debajo del título)
function ensureContenedorPendientes() {
  let cont = document.getElementById('pendientesRegistro');
  if (!cont) {
    cont = document.createElement('div');
    cont.id = 'pendientesRegistro';
    cont.style.display = 'grid';
    cont.style.gap = '10px';
    cont.style.margin = '10px 0 16px';
    cont.style.padding = '12px';
    cont.style.background = '#f8fafc';
    cont.style.borderRadius = '12px';

    const titulo = Array.from(document.querySelectorAll('*'))
      .find(n => /Pendientes por registrar/i.test(n.textContent || ''));
    (titulo || document.body).insertAdjacentElement('afterend', cont);
  }
  return cont;
}

// ===============================
// Referencias DOM
// ===============================
const contenedorPendientes = ensureContenedorPendientes();
const inputPlaca =
  document.getElementById('inputPlaca') ||
  document.querySelector('input[name="placa"]') ||
  document.querySelector('#placa');

// ===============================
// Backend helpers
// ===============================
async function obtenerPendientesDelServidor() {
  try {
    const res = await fetch(`${API_BASE}/api/pendientes`);
    const json = await res.json();
    const lista = Array.isArray(json.data) ? json.data : [];

    // Render
    contenedorPendientes.innerHTML = '';
    if (!lista.length) {
      contenedorPendientes.innerHTML = `<div style="color:#64748b;">Sin pendientes por ahora</div>`;
      return;
    }
    lista.forEach(p => agregarPlacaPendiente(p));
  } catch (err) {
    console.warn('⚠️ No se pudieron obtener pendientes:', err.message);
    if (!contenedorPendientes.innerHTML.trim()) {
      contenedorPendientes.innerHTML =
        `<div style="color:#ef4444;">No se pudo conectar con el servidor</div>`;
    }
  }
}

async function consumirPendienteEnBackend(id) {
  try {
    const url = `${API_BASE}/api/pendientes?id=${encodeURIComponent(id)}`;
    const res = await fetch(url, { method: 'DELETE' });
    const json = await res.json();
    if (!json.ok) throw new Error(json.msg || 'No se pudo consumir pendiente');
  } catch (e) {
    console.warn('No se pudo consumir el pendiente en backend:', e.message);
  }
}

// ===============================
// UI: tarjeta pendiente
// ===============================
function agregarPlacaPendiente(data) {
  const payload =
    typeof data === 'string'
      ? { id: Date.now(), placa: data, imagen: '', hora: horaCorta() }
      : (data || {});

  const { id, placa = '', hora = horaCorta() } = payload;
  const imagen = urlImagenSegura(payload.imagen);

  const tarjeta = document.createElement('div');
  tarjeta.classList.add('tarjeta-pendiente');
  tarjeta.style.display = 'grid';
  tarjeta.style.gridTemplateColumns = '1fr auto';
  tarjeta.style.alignItems = 'center';
  tarjeta.style.gap = '12px';
  tarjeta.style.padding = '10px 12px';
  tarjeta.style.background = '#fff';
  tarjeta.style.borderRadius = '12px';
  tarjeta.style.boxShadow = '0 2px 10px rgba(0,0,0,.06)';

  tarjeta.innerHTML = `
    <div class="pendiente-izq" style="display:grid;gap:6px;">
      <div class="placa" style="font-weight:700;font-size:1.1rem;letter-spacing:.5px;">
        ${String(placa).toUpperCase()}
      </div>
      <div class="hora" style="font-size:.9rem;color:#666;">${hora}</div>
      <button class="btn-registrar"
        style="justify-self:start;padding:6px 10px;border:0;border-radius:8px;background:#0d6efd;color:#fff;cursor:pointer;">
        Registrar
      </button>
    </div>
    <div class="pendiente-der">
      ${ imagen ? `<img src="${imagen}" alt="Placa ${String(placa).toUpperCase()}" loading="lazy" style="max-height:70px;border-radius:8px;">` : '' }
    </div>
  `;

  // Zoom al hacer clic en miniatura
  const thumb = tarjeta.querySelector('.pendiente-der img');
  if (thumb) {
    thumb.style.cursor = 'zoom-in';
    thumb.addEventListener('click', (e) => {
      e.stopPropagation();
      openImageModal(thumb.src, `Placa ${String(placa).toUpperCase()}`);
    });
  }

  const btn = tarjeta.querySelector('.btn-registrar');
  btn.addEventListener('click', () => {
    pendienteEnEdicion = { id, card: tarjeta, placa: String(placa).toUpperCase() };

    // sincroniza con el input del formulario, si existe
    if (inputPlaca) {
      inputPlaca.value = pendienteEnEdicion.placa;
      inputPlaca.dispatchEvent(new Event('change'));
    }

    // comunica a registro.js el id (si expusiste setEdicionRegistro)
    if (typeof window !== 'undefined' && typeof window.setEdicionRegistro === 'function') {
      window.setEdicionRegistro(id);
    }

    // feedback visual
    btn.disabled = true;
    btn.textContent = 'En edición…';

    abrirPopupRegistro();
  });

  contenedorPendientes.appendChild(tarjeta);
}

// ===============================
// Hooks para completar/cancelar edición (para que registro.js los llame)
// ===============================
export async function finalizarEdicionTrasGuardado() {
  if (!pendienteEnEdicion) return;

  const { id, card } = pendienteEnEdicion;
  try {
    // Quita la tarjeta del DOM
    card?.remove();
    // Consume en backend
    await consumirPendienteEnBackend(id);
    // Refresca la tabla de registros ya guardados
    await mostrarRegistrosDelServidor();
  } finally {
    pendienteEnEdicion = null;
  }
}
export function cancelarEdicion() {
  if (!pendienteEnEdicion) return;
  const { card } = pendienteEnEdicion;
  // Rehabilita el botón “Registrar”
  const btn = card?.querySelector('.btn-registrar');
  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Registrar';
  }
  pendienteEnEdicion = null;
}

// expón los hooks por si registro.js los necesita invocar
if (typeof window !== 'undefined') {
  window.finalizarEdicionTrasGuardado = finalizarEdicionTrasGuardado;
  window.cancelarEdicion = cancelarEdicion;
}

// ===============================
// Abrir popup/overlay del formulario
// ===============================
function abrirPopupRegistro() {
  try {
    // Tu lógica nativa para abrir el modal del registro
    abrirFormulario?.();
  } catch (e) {
    console.warn('No se pudo abrir el formulario:', e.message);
  }
}

// ===============================
// Init
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  // Cargar la tabla al inicio
  mostrarRegistrosDelServidor();

  // Cargar pendientes inicialmente y refrescar cada 4s
  obtenerPendientesDelServidor();
  setInterval(obtenerPendientesDelServidor, 4000);
});
