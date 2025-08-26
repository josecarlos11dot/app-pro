// accionesOpciones.js - Conecta botones de agregar/editar con sus funciones
// ✅ Añadido: semilla si localStorage está vacío, render inicial y listeners idempotentes

import { opciones, renderBotones } from './opciones.js';
import { guardarLocal } from './utilidades.js';
import {
  btnAgregarMarca, btnEditarMarca, marcasDiv, inputMarca,
  btnAgregarModelo, btnEditarModelo, modelosDiv, inputModelo,
  btnAgregarColor, btnEditarColores, coloresDiv, inputColor,
  btnAgregarPrecio, btnEditarPrecios, preciosDiv, inputPrecio,
  btnAgregarLavador, btnEditarLavadores, lavadoresDiv, inputLavador
} from './referencias.js';

// Fuente externa para Marcas/Modelos (inyectada desde index.js)
export let MAKES_DATA = [];

export function setDataMakes(list){
  if (Array.isArray(list) && list.length){
    MAKES_DATA = list;
  }
}


// -------- Helpers seguros --------
const A   = (v) => (Array.isArray(v) ? v : []);
const has = (arr, val) => Array.isArray(arr) && arr.includes(val);
const idx = (arr, val) => (Array.isArray(arr) ? arr.indexOf(val) : -1);

// Para evitar listeners duplicados si se llama varias veces
function bindOnce(el, type, handler, key) {
  if (!el) return;
  const flag = `bound_${type}_${key}`;
  if (el.dataset && el.dataset[flag]) return;
  el.addEventListener(type, handler);
  if (el.dataset) el.dataset[flag] = '1';
}

// Claves reservadas (no son marcas)
const RESERVED = ['colores', 'precios', 'lavadores'];

// Asegura arrays base
function ensureBaseArrays() {
  if (!Array.isArray(opciones.colores))   opciones.colores   = [];
  if (!Array.isArray(opciones.precios))   opciones.precios   = [];
  if (!Array.isArray(opciones.lavadores)) opciones.lavadores = [];
}

// Semilla si storage vacío (para que siempre haya botones)
function seedSiVacio() {
  ensureBaseArrays();
  const marcas = Object.keys(opciones).filter(k => !RESERVED.includes(k));
  const sinMarcas = marcas.length === 0;

  if (sinMarcas) {
    opciones.Honda  = ['Civic', 'CR-V', 'City'];
    opciones.Ford   = ['Fiesta', 'Ranger', 'Focus'];
    opciones.Nissan = ['Versa', 'Sentra', 'NP300'];
  }
  if (!opciones.colores?.length)   opciones.colores   = ['Blanco','Negro','Gris','Rojo','Azul'];
  if (!opciones.precios?.length)   opciones.precios   = ['120','150','180','200','250'];
  if (!opciones.lavadores?.length) opciones.lavadores = ['Mario','Luis','Pedro'];

  if (sinMarcas) guardarLocal('opciones', opciones);
}

// Render inicial de todos los grupos
function renderInicial() {
  ensureBaseArrays();

  // Marcas = todas las claves que no son reservadas
  const marcas = Object.keys(opciones).filter(k => !RESERVED.includes(k));

  // Marca actual = la del input o la primera
  const marcaActual = (inputMarca?.value || marcas[0] || '').trim();

  // Render marcas
  renderBotones(marcas, marcasDiv, inputMarca);

  // Render modelos según marca actual (si no existe array, usa vacío)
  const modelos = Array.isArray(opciones[marcaActual]) ? opciones[marcaActual] : [];
  renderBotones(A(modelos), modelosDiv, inputModelo);

  // Render colores, precios, lavadores
  renderBotones(A(opciones.colores),   coloresDiv,   inputColor);
  renderBotones(A(opciones.precios),   preciosDiv,   inputPrecio);
  renderBotones(A(opciones.lavadores), lavadoresDiv, inputLavador);
}

export function configurarBotonesDinamicos() {
  // 1) Garantiza datos y pinta una vez
  seedSiVacio();
  renderInicial();

  // 2) Listeners (solo una vez cada uno)

  // ======================
  // Marca
  // ======================
  bindOnce(btnAgregarMarca, 'click', () => {
    const nuevaMarca = (prompt('Escribe el nombre de la nueva marca:') || '').trim();
    if (!nuevaMarca) return;

    if (opciones[nuevaMarca] || RESERVED.includes(nuevaMarca)) {
      alert('Esa marca ya existe o es un nombre reservado.');
      return;
    }
    opciones[nuevaMarca] = [];
    guardarLocal('opciones', opciones);

    const marcas = Object.keys(opciones).filter(k => !RESERVED.includes(k));
    renderBotones(marcas, marcasDiv, inputMarca);
  }, 'agregarMarca');

  bindOnce(btnEditarMarca, 'click', () => {
    const marcaEditar = (prompt('¿Qué marca quieres editar?') || '').trim();
    if (!marcaEditar || !opciones[marcaEditar]) {
      alert('Esa marca no existe.');
      return;
    }
    const nuevoNombre = (prompt(`Nuevo nombre para ${marcaEditar}:`) || '').trim();
    if (!nuevoNombre || RESERVED.includes(nuevoNombre)) {
      alert('Ese nombre no es válido.');
      return;
    }
    opciones[nuevoNombre] = A(opciones[marcaEditar]);
    delete opciones[marcaEditar];
    guardarLocal('opciones', opciones);

    const marcas = Object.keys(opciones).filter(k => !RESERVED.includes(k));
    renderBotones(marcas, marcasDiv, inputMarca);
  }, 'editarMarca');

  // ======================
  // Modelo
  // ======================
  bindOnce(btnAgregarModelo, 'click', () => {
    const marca = (inputMarca.value || '').trim();
    if (!marca || !opciones[marca]) {
      alert('Primero selecciona una marca.');
      return;
    }
    if (!Array.isArray(opciones[marca])) opciones[marca] = [];

    const nuevoModelo = (prompt(`Nuevo modelo para ${marca}:`) || '').trim();
    if (!nuevoModelo) return;

    if (!has(opciones[marca], nuevoModelo)) {
      opciones[marca].push(nuevoModelo);
      guardarLocal('opciones', opciones);
      renderBotones(A(opciones[marca]), modelosDiv, inputModelo);
    } else {
      alert('Ese modelo ya existe.');
    }
  }, 'agregarModelo');

  bindOnce(btnEditarModelo, 'click', () => {
    const marca = (inputMarca.value || '').trim();
    if (!marca || !opciones[marca]) {
      alert('Primero selecciona una marca.');
      return;
    }
    if (!Array.isArray(opciones[marca])) opciones[marca] = [];

    const modeloEditar = (prompt(`¿Qué modelo de ${marca} quieres editar?`) || '').trim();
    if (!modeloEditar || !has(opciones[marca], modeloEditar)) {
      alert('Ese modelo no existe.');
      return;
    }
    const nuevoNombre = (prompt(`Nuevo nombre para ${modeloEditar}:`) || '').trim();
    if (!nuevoNombre) return;

    const i = idx(opciones[marca], modeloEditar);
    if (i >= 0) {
      opciones[marca][i] = nuevoNombre;
      guardarLocal('opciones', opciones);
      renderBotones(A(opciones[marca]), modelosDiv, inputModelo);
    }
  }, 'editarModelo');

  // ======================
  // Color
  // ======================
  bindOnce(btnAgregarColor, 'click', () => {
    ensureBaseArrays();
    const nuevo = (prompt('Nuevo color:') || '').trim();
    if (!nuevo) return;

    if (!has(opciones.colores, nuevo)) {
      opciones.colores.push(nuevo);
      guardarLocal('opciones', opciones);
      renderBotones(A(opciones.colores), coloresDiv, inputColor);
    } else {
      alert('Ese color ya existe.');
    }
  }, 'agregarColor');

  bindOnce(btnEditarColores, 'click', () => {
    ensureBaseArrays();
    const actual = (prompt('¿Qué color quieres editar?') || '').trim();
    if (!actual || !has(opciones.colores, actual)) {
      alert('Ese color no existe.');
      return;
    }

    const nuevo = (prompt(`Nuevo nombre para ${actual}:`) || '').trim();
    if (!nuevo) return;

    const i = idx(opciones.colores, actual);
    if (i >= 0) {
      opciones.colores[i] = nuevo;
      guardarLocal('opciones', opciones);
      renderBotones(A(opciones.colores), coloresDiv, inputColor);
    }
  }, 'editarColores');

  // ======================
  // Precio
  // ======================
  bindOnce(btnAgregarPrecio, 'click', () => {
    ensureBaseArrays();
    const nuevo = (prompt('Nuevo precio:') || '').trim();
    if (!nuevo) return;

    if (!has(opciones.precios, nuevo)) {
      opciones.precios.push(nuevo);
      guardarLocal('opciones', opciones);
      renderBotones(A(opciones.precios), preciosDiv, inputPrecio);
    } else {
      alert('Ese precio ya existe.');
    }
  }, 'agregarPrecio');

  bindOnce(btnEditarPrecios, 'click', () => {
    ensureBaseArrays();
    const actual = (prompt('¿Qué precio quieres editar?') || '').trim();
    if (!actual || !has(opciones.precios, actual)) {
      alert('Ese precio no existe.');
      return;
    }

    const nuevo = (prompt(`Nuevo valor para ${actual}:`) || '').trim();
    if (!nuevo) return;

    const i = idx(opciones.precios, actual);
    if (i >= 0) {
      opciones.precios[i] = nuevo;
      guardarLocal('opciones', opciones);
      renderBotones(A(opciones.precios), preciosDiv, inputPrecio);
    }
  }, 'editarPrecios');

  // ======================
  // Lavador
  // ======================
  bindOnce(btnAgregarLavador, 'click', () => {
    ensureBaseArrays();
    const nuevo = (prompt('Nuevo lavador:') || '').trim();
    if (!nuevo) return;

    if (!has(opciones.lavadores, nuevo)) {
      opciones.lavadores.push(nuevo);
      guardarLocal('opciones', opciones);
      renderBotones(A(opciones.lavadores), lavadoresDiv, inputLavador);
    } else {
      alert('Ese lavador ya existe.');
    }
  }, 'agregarLavador');

  bindOnce(btnEditarLavadores, 'click', () => {
    ensureBaseArrays();
    const actual = (prompt('¿Qué lavador quieres editar?') || '').trim();
    if (!actual || !has(opciones.lavadores, actual)) {
      alert('Ese lavador no existe.');
      return;
    }

    const nuevo = (prompt(`Nuevo nombre para ${actual}:`) || '').trim();
    if (!nuevo) return;

    const i = idx(opciones.lavadores, actual);
    if (i >= 0) {
      opciones.lavadores[i] = nuevo;
      guardarLocal('opciones', opciones);
      renderBotones(A(opciones.lavadores), lavadoresDiv, inputLavador);
    }
  }, 'editarLavadores');
}
