// sistema/js/tabla.js — versión mínima

import { esDeHoy } from './utilidades.js';
import { abrirFormulario } from './registro.js';
import {
  inputPlaca, inputMarca, inputModelo, inputColor, inputPrecio, inputLavador
} from './referencias.js';

// Usa la misma base que en registro.js
const API_REGISTROS_BASE = 'https://sistema-2025-backend.onrender.com';

const registroBody =
  (typeof window !== 'undefined' && window.registroBody) ||
  document.getElementById('registroBody');

let _datos = [];
let _tbodyBind = false;

/* ============ Pintado de tabla ============ */
export function mostrarRegistros(datos) {
  if (!registroBody) return;
  registroBody.innerHTML = '';

  datos.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.dataset.id = r._id; // <- se usa luego para Editar/Eliminar
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${r.placa || ''}</td>
      <td>${r.marca || ''}</td>
      <td>${r.modelo || ''}</td>
      <td>${r.color || ''}</td>
      <td>$${r.precio || ''}</td>
      <td>${r.lavador || ''}</td>
      <td>${new Date(r.fecha).toLocaleString('es-MX', {
        day:'2-digit', month:'2-digit', year:'numeric',
        hour:'2-digit', minute:'2-digit', hour12:true
      })} hrs</td>
      <td>
        <button class="btn-editar">Editar</button>
        <button class="btn-eliminar">Eliminar</button>
      </td>
    `;
    registroBody.appendChild(tr);
  });
}

export function actualizarResumen(/* registros */) {
  // Mínimo: si tienes un “resumen” puedes implementarlo aquí.
  // Lo dejamos vacío para no romper imports existentes.
}

/* ============ Carga desde backend ============ */
export async function mostrarRegistrosDelServidor() {
  try {
    const res = await fetch(`${API_REGISTROS_BASE}/api/registros`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const datos = await res.json().catch(() => []);
    _datos = Array.isArray(datos) ? datos : [];

    const hoy = _datos.filter(r => esDeHoy(r.fecha));
    mostrarRegistros(hoy);

    bindRowActions();
  } catch (e) {
    console.error('Error al cargar registros:', e);
  }
}

/* ============ Acciones (delegación) ============ */
function bindRowActions() {
  if (_tbodyBind || !registroBody) return;
  _tbodyBind = true;

  registroBody.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;

    const tr = ev.target.closest('tr');
    const id = tr?.dataset?.id;
    if (!id) return;

    // 🔻 ELIMINAR
    if (btn.classList.contains('btn-eliminar')) {
      const ok = await eliminarRegistro(id);  // asegúrate de tener esta función (maneja 204)
      if (ok) {
        try { tr.remove(); } catch {}
        await mostrarRegistrosDelServidor();   // refresca la tabla
      } else {
        alert('No se pudo eliminar. Intenta de nuevo.');
      }
      return;
    }

    // ✏️ EDITAR
    if (btn.classList.contains('btn-editar')) {
      const r = _datos.find(x => x._id === id);
      if (!r) return;

      // Prefill del formulario
      if (inputPlaca)   inputPlaca.value   = (r.placa  || '').toUpperCase();
      if (inputMarca)   inputMarca.value   = r.marca   || '';
      if (inputModelo)  inputModelo.value  = r.modelo  || '';
      if (inputColor)   inputColor.value   = r.color   || '';
      if (inputPrecio)  inputPrecio.value  = r.precio  || '';
      if (inputLavador) inputLavador.value = r.lavador || '';

      // Marca edición (si existe en registro.js hará PUT; si no, no rompe)
      window.setEdicionRegistro?.(id);

      // Abre el modal
      abrirFormulario();
      return;
    }
  });
}


/* ============ Helpers backend ============ */
async function eliminarRegistro(id) {
  try {
    const url = `${API_REGISTROS_BASE}/api/registros/${encodeURIComponent(id)}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (res.status === 204) return true;        // DELETE sin body
    const json = await res.json().catch(() => ({}));
    return res.ok && (json.ok !== false);
  } catch (e) {
    console.error('eliminarRegistro error:', e);
    return false;
  }
}
