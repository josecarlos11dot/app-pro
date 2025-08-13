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

// 🔗 Base del backend de REGISTROS (dejamos Render por ahora)
const API_REGISTROS_BASE = 'https://sistema-2025-backend.onrender.com';

// ---- API helpers
async function guardarRegistroEnBackend(data, id = null) {
  const url = id
    ? `${API_REGISTROS_BASE}/api/registros/${id}`
    : `${API_REGISTROS_BASE}/api/registros`;
  const metodo = id ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${t}`.trim());
  }
  return res.json().catch(() => ({}));
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
}

// Botón “+ Registro” / “✕ Cerrar”
btnNuevo.addEventListener('click', () => {
  const abierto = formulario.classList.contains('activo');
  abierto ? cerrarFormulario() : abrirFormulario();
});

btnCerrarFormulario.addEventListener('click', cerrarFormulario);
overlayRegistro.addEventListener('click', cerrarFormulario);

// ---- Submit
registroForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Lectura/validación básica
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
  if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.textContent = 'Guardando...'; }

  try {
    await guardarRegistroEnBackend(nuevoRegistro, filaEditando);
    await mostrarRegistrosDelServidor();  // refresca tabla principal

    // ✅ Avisar al main que el guardado fue ok (para borrar la tarjeta pendiente)
    _cierrePorGuardado = true;
    try { window.onRegistroGuardado?.({ placa: nuevoRegistro.placa }); } catch {}

    cerrarFormulario();
  } catch (err) {
    console.error('Error al guardar en backend:', err);
    alert('No se pudo guardar el registro. Revisa tu conexión e inténtalo de nuevo.');
    _cierrePorGuardado = false; // aseguramos que el cierre posterior no cuente como guardado
  } finally {
    if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.textContent = 'Guardar'; }
  }
});

// (Opcional) Si te gusta pintar opciones también al cargar el módulo, puedes dejar:
try { configurarBotonesDinamicos(); } catch {}
