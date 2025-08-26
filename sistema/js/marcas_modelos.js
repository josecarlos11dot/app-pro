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
