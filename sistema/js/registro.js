// registro.js

// ---- Importaciones
import { configurarBotonesDinamicos } from './accionesOpciones.js';
import { desactivarBotonesActivos } from './utilidades.js';
import { mostrarRegistrosDelServidor } from './tabla.js'; // ✅ faltaba

import {
  formulario,
  overlayRegistro,
  btnNuevo,
  btnCerrarFormulario,
  registroForm,
  inputPlaca,
  inputMarca,
  inputModelo,
  inputColor,
  inputPrecio,
  inputLavador
} from './referencias.js';

// ---- Estado interno
let filaEditando = null;
// Flag para saber si el cierre del formulario es por guardado exitoso
let _cierrePorGuardado = false;


export function setEdicionRegistro(id) {
  const limpio = String(id || '').trim();
  filaEditando = /^[a-f\d]{24}$/i.test(limpio) ? limpio : null;
}
if (typeof window !== 'undefined') window.setEdicionRegistro = setEdicionRegistro;






// 🔗 Base del backend de REGISTROS (dejamos Render por ahora)
const API_REGISTROS_BASE = 'https://sistema-2025-backend.onrender.com';
// --- Precalentamiento del backend (evita primer guardado lento) ---
let backendRegistrosListo = false;

async function precalentarBackendRegistros() {
  try {
    const r = await fetch(`${API_REGISTROS_BASE}/api/registros?__warmup=1`, { cache: 'no-store' });
    backendRegistrosListo = r.ok;
  } catch {
    backendRegistrosListo = false;
  }
}
// Lanza un warmup al cargar el módulo y otro a los 8s
precalentarBackendRegistros();
setTimeout(precalentarBackendRegistros, 8000);


async function guardarRegistroEnBackend(data, id = null, { timeoutMs = 15000 } = {}) {
  const limpio = String(id || '').trim();
  const idValido = /^[a-f\d]{24}$/i.test(limpio);

  const url = idValido
    ? `${API_REGISTROS_BASE}/api/registros/${encodeURIComponent(limpio)}`
    : `${API_REGISTROS_BASE}/api/registros`;
  const metodo = idValido ? 'PUT' : 'POST';

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort('timeout'), timeoutMs);
  try {
    let res = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: ctrl.signal
    });

    // (fallback opcional si tu backend no tuviera PUT/param)
    if (idValido && (res.status === 404 || res.status === 405)) {
      res = await fetch(`${API_REGISTROS_BASE}/api/registros`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: limpio, ...data }),
        signal: ctrl.signal
      });
    }

    const text = await res.text().catch(() => '');
    let json; try { json = text ? JSON.parse(text) : undefined; } catch {}
    if (!res.ok) throw new Error(json?.error || json?.message || text || `HTTP ${res.status}`);
    return json || {};
  } finally {
    clearTimeout(timer);
  }
}



// ---- UI: abrir/cerrar
export function abrirFormulario() {
  // 🔁 Re-pinta botones dinámicos cada vez que se abre (marca/modelo/color/precio/lavador)
  try { configurarBotonesDinamicos(); } catch (e) { console.warn('No pude pintar opciones:', e); }

  formulario.classList.add('activo');
  overlayRegistro.classList.add('activo');
  btnNuevo.textContent = '✕ Cerrar';
}

export function cerrarFormulario() {
  // Si NO venimos de un guardado, entonces es un cierre/cancelación → avisar al main
  if (!_cierrePorGuardado) {
    try { window.onRegistroCancelado?.(); } catch {}
  }

  formulario.classList.remove('activo');
  overlayRegistro.classList.remove('activo');
  btnNuevo.textContent = '+ Registro';
  registroForm.reset();
  filaEditando = null;
  _cierrePorGuardado = false; // reset del flag
  desactivarBotonesActivos();

  // ✅ Si el modal se muestra por :target, limpia el hash para ocultarlo
  if (location.hash === '#formulario') location.hash = '';
}


// Botón “+ Registro” / “✕ Cerrar”
btnNuevo.addEventListener('click', (e) => {
  e.preventDefault(); // evita navegación del <a>
  const vaAbrir = (location.hash !== '#formulario');

  if (vaAbrir) {
    // 1) Abrir por JS si está disponible
    abrirFormulario?.();
    // 2) Forzar :target por CSS
    if (location.hash !== '#formulario') location.hash = '#formulario';
  } else {
    cerrarFormulario();
  }
});

// Cerrar con la X y con overlay
btnCerrarFormulario.addEventListener('click', (e) => {
  e.preventDefault();
  cerrarFormulario();
});
overlayRegistro.addEventListener('click', cerrarFormulario);

// ---- Submit
registroForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nuevoRegistro = {
    placa: (inputPlaca.value || '').trim().toUpperCase(),
    marca: inputMarca.value || '',
    modelo: inputModelo.value || '',
    color: inputColor.value || '',
    precio: inputPrecio.value || '',
    lavador: inputLavador.value || ''
  };

  if (!nuevoRegistro.placa) {
    alert('Ingresa la placa, por favor.');
    inputPlaca.focus();
    return;
  }

  // Evita doble submit
  const btnSubmit = registroForm.querySelector('[type="submit"], button:not([type])');
  const restoreBtn = () => {
    if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.textContent = 'Guardar'; }
  };
  if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.textContent = 'Guardando...'; }

  try {
    // 1) Guardar en backend (con timeout más largo si aún está "frío")
    await guardarRegistroEnBackend(
      nuevoRegistro,
      filaEditando,
      { timeoutMs: backendRegistrosListo ? 15000 : 30000 }
    );

    // Al llegar aquí, el backend ya “despertó”
    backendRegistrosListo = true;

    // 2) Refrescar tabla principal
    await mostrarRegistrosDelServidor();

    // 3) Restaurar botón ANTES de cerrar
    restoreBtn();

    // 4) Avisar al main que el guardado fue OK (para borrar la tarjeta pendiente)
    _cierrePorGuardado = true;
    try { window.onRegistroGuardado?.({ placa: nuevoRegistro.placa }); } catch {}

    // 5) Cerrar modal
    cerrarFormulario();
  } catch (err) {
    console.error('Error al guardar en backend:', err);
    const esTimeout = err?.name === 'AbortError' || /abort|timeout/i.test(String(err?.message || ''));
    const msg = esTimeout
      ? 'Se agotó el tiempo de espera (red lenta). Inténtalo de nuevo.'
      : `No se pudo guardar el registro: ${err.message}`;
    alert(msg);

    _cierrePorGuardado = false;
    restoreBtn();
  }
});

  


// (Opcional) Pintar opciones al cargar el módulo
try { configurarBotonesDinamicos(); } catch {}
