// index.js - Importa todos los módulos funcionales del sistema
import { configurarBotonesDinamicos, setDataMakes } from './accionesOpciones.js';
import './utilidades.js';
import './opciones.js';
import './registro.js';
import './tabla.js';
import './filtros.js';
import './main.js';

(async () => {
    try {
      const res = await fetch('/data/makes_seed_mx_2025.json', { cache: 'no-store' });
      const list = await res.json();
      setDataMakes(list);         // inyecta marcas/modelos del JSON
    } catch (e) {
      console.warn('No se pudo cargar JSON; usaré la semilla interna.', e);
    }
    configurarBotonesDinamicos(); // pinta Marca→Modelo con los datos disponibles
  })();
  

