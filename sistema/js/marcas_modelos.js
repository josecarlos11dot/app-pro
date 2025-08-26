// js/marcas_modelos.js

// Ahora:
const DATA_URL = 'data/makes_seed_mx_2025.json';


let MAKES = [];
let marcaActiva = null;
let modeloActivo = null;

const $marcas = document.getElementById('marcas');
const $modelos = document.getElementById('modelos');
const $inputMarca = document.getElementById('inputMarca');
const $inputModelo = document.getElementById('inputModelo');

function limpiar(el){ if(el) el.innerHTML = ''; }
function activar(btn, grupoSel){
  [...grupoSel.querySelectorAll('button')].forEach(x => x.classList.remove('active'));
  btn.classList.add('active');
}

function renderModelos(marca){
  limpiar($modelos);
  (marca.models || []).forEach(mod => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn-choice';
    b.textContent = mod.name;
    b.addEventListener('click', () => {
      modeloActivo = mod;
      activar(b, $modelos);
      if ($inputModelo) $inputModelo.value = mod.name; // guarda el nombre (humano)
    });
    $modelos.appendChild(b);
  });
  // resetea selección de modelo al cambiar marca
  modeloActivo = null;
  if ($inputModelo) $inputModelo.value = '';
}

function renderMarcas(){
  limpiar($marcas);
  MAKES.forEach(m => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn-choice';
    b.textContent = m.name;
    b.addEventListener('click', () => {
      marcaActiva = m;
      activar(b, $marcas);
      if ($inputMarca) $inputMarca.value = m.name; // guarda el nombre
      renderModelos(m);
    });
    $marcas.appendChild(b);
  });
}

export async function initMarcasModelos(){
  // Carga datos
  const res = await fetch(DATA_URL, { cache: 'no-store' });
  if(!res.ok) throw new Error('No se pudo cargar makes_seed_mx_2025.json');
  MAKES = await res.json();
  // Pinta botones
  renderMarcas();
}


// --- Re-render cuando se abre el formulario de "Nuevo" ---
const BTN_NUEVO = document.getElementById('btnNuevo');
if (BTN_NUEVO) {
  BTN_NUEVO.addEventListener('click', () => {
    // Al abrir el popup, volvemos a pintar y quedamos por encima de otros módulos
    if (Array.isArray(MAKES) && MAKES.length) {
      // Limpia y repinta marcas y modelos desde el JSON
      // (usa las mismas funciones internas del módulo)
      // Si en tu archivo los nombres son distintos, sustitúyelos.
      // Aquí asumimos renderMarcas() y renderModelos() como definidas arriba.
      try {
        renderMarcas();
        if (marcaActiva) renderModelos(marcaActiva);
      } catch (e) {
        console.error('No pude repintar marcas/modelos al abrir el formulario:', e);
      }
    }
  });
}
