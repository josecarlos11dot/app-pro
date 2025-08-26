// index.js - Importa todos los módulos funcionales del sistema

import './utilidades.js';
import './opciones.js';
import './registro.js';
import './tabla.js';
import './filtros.js';
import './main.js';
import { configurarBotonesDinamicos, setDataMakes } from './accionesOpciones.js';

(async () => {
  try {
    const res = await fetch('/data/makes_seed_mx_2025.json', { cache: 'no-store' });
    const list = await res.json();
    setDataMakes(list);
  } catch (e) {
    console.warn('No pude cargar el JSON, uso semilla.', e);
  }
  configurarBotonesDinamicos();
})();


