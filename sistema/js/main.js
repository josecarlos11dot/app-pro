// ===============================
// main.js – Fila en espera (pendientes) + registrar
// ===============================

// 🌐 Config: cambia aquí según el entorno
// Puedes definir window.API_BASE_OVERRIDE en un <script> antes de cargar este archivo
const API_BASE = ''; // relativo en prod
  window.API_BASE_OVERRIDE ||
  'http://localhost:3000'; // desarrollo local

// 📥 Importar función oficial desde registro.js
import { abrirFormulario } from './registro.js';

// 🔧 Helpers
const horaCorta = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function ensureContenedorPendientes() {
  let cont = document.getElementById('pendientesRegistro');
  if (!cont) {
    cont = document.createElement('div');
    cont.id = 'pendientesRegistro';
    const titulo = Array.from(document.querySelectorAll('*'))
      .find(n => /pendientes por registrar/i.test(n.textContent || ''));
    (titulo || document.body).insertAdjacentElement('afterend', cont);
  }
  return cont;
}

function urlImagenSegura(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    const u = new URL(url);
    if (u.hostname.includes('via.placeholder.com')) {
      return 'https://placehold.co/320x200';
    }
    return url;
  } catch {
    return 'https://placehold.co/320x200';
  }
}

// 🔧 Referencias al DOM (ajusta selectores a tu HTML si hace falta)
const contenedorPendientes = ensureContenedorPendientes();
const inputPlaca =
  document.getElementById('inputPlaca') ||
  document.querySelector('input[name="placa"]') ||
  document.querySelector('input#placa');

const overlayRegistro =
  document.getElementById('overlayRegistro') ||
  document.querySelector('#overlay, .overlay');

const formulario =
  document.getElementById('formRegistro') ||
  document.querySelector('#formulario, form');

function clickBotonRegistroReal() {
  let btn =
    document.getElementById('btnAbrirRegistro') ||
    document.querySelector('[data-action="abrir-registro"]') ||
    Array.from(document.querySelectorAll('button, a')).find(el =>
      (el.textContent || '').trim().toLowerCase().includes('+ registro')
    );
  if (btn) {
    btn.click();
    return true;
  }
  return false;
}

function abrirPopupRegistro() {
  // ✅ Usar la función importada
  if (typeof abrirFormulario === 'function') {
    abrirFormulario();
    return;
  }
  // Si no, simular el click del botón real
  if (clickBotonRegistroReal()) return;

  // Fallback: mostrar overlay/form
  if (overlayRegistro) overlayRegistro.style.display = 'block';
  if (formulario) formulario.style.display = 'block';
}

// ===============================
// Backend: obtener y consumir pendientes
// ===============================
async function obtenerPendientesDelServidor() {
  try {
    const res = await fetch(`${API_BASE}/api/pendientes`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json().catch(() => ({}));
    const lista = json.ok && Array.isArray(json.data) ? json.data : [];

    contenedorPendientes.innerHTML = '';
    if (!lista.length) {
      contenedorPendientes.innerHTML =
        `<div class="pendiente-vacio">Sin pendientes por ahora</div>`;
      return;
    }
    lista.forEach(p => agregarPlacaPendiente(p));
  } catch (err) {
    console.warn('⚠️ No se pudieron obtener pendientes:', err.message);
    if (!contenedorPendientes.innerHTML.trim()) {
      contenedorPendientes.innerHTML =
        `<div class="pendiente-error">No se pudo conectar con el servidor</div>`;
    }
  }
}

async function consumirPendienteEnBackend(id) {
  try {
    const res = await fetch(`${API_BASE}/api/pendientes/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    const json = await res.json().catch(() => ({}));
    return !!json.ok;
  } catch (e) {
    console.warn('Fallo al consumir pendiente:', e);
    return false;
  }
}

// ===============================
// UI: tarjeta pendiente
// ===============================
function agregarPlacaPendiente(data) {
  const payload =
    typeof data === 'string'
      ? { id: Date.now(), placa: data, imagen: '', hora: horaCorta() }
      : data || {};

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
      ${ imagen ? `<img src="${imagen}" alt="Placa ${String(placa).toUpperCase()}" style="max-height:70px;border-radius:8px;">` : '' }
    </div>
  `;

  tarjeta.querySelector('.btn-registrar').addEventListener('click', async () => {
    if (inputPlaca) {
      inputPlaca.value = String(placa).toUpperCase();
      inputPlaca.dispatchEvent(new Event('change'));
    }

    abrirPopupRegistro();
    tarjeta.remove();

    if (id != null) {
      const ok = await consumirPendienteEnBackend(id);
      if (!ok) {
        console.warn('No se pudo consumir en backend, se re-renderizará en el próximo polling.');
      }
    }
  });

  contenedorPendientes.appendChild(tarjeta);
}

// ===============================
// Arranque
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  if (typeof configurarBotonesDinamicos === 'function') configurarBotonesDinamicos?.();
  if (typeof cargarTodoDesdeStorage === 'function') cargarTodoDesdeStorage?.();
  if (typeof mostrarRegistrosDelServidor === 'function') mostrarRegistrosDelServidor?.();

  obtenerPendientesDelServidor();
  setInterval(obtenerPendientesDelServidor, 4000); // polling cada 4s
});
