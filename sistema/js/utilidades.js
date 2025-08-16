// utilidades.js - Funciones reutilizables generales

export function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function guardarLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function parseFecha(texto) {
  const partes = texto.split('/');
  return new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
}

export function esDeHoy(fechaStr) {
  const hoy = new Date();
  const fecha = new Date(fechaStr);
  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  );
}

export function activarBoton(contenedor, valor) {
  [...contenedor.children].forEach(b => {
    const texto = b.textContent.replace('$', '').trim();
    b.classList.toggle('activo', texto === valor || b.textContent === `$${valor}`);
  });
}

export function desactivarBotonesActivos() {
  document.querySelectorAll('.btn.activo').forEach(b => b.classList.remove('activo'));
}

// ✅ Acepta dataURL (canvas/OCR) y http/https
export function urlImagenSegura(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:image/')) return url; // base64 del canvas
  try {
    const u = new URL(url);
    return (u.protocol === 'http:' || u.protocol === 'https:') ? url : '';
  } catch {
    return '';
  }
}
