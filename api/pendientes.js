// api/pendientes.js

function store() {
  // Compartir memoria dentro de la misma lambda
  if (!globalThis.__COLA__) globalThis.__COLA__ = [];
  return globalThis.__COLA__;
}

export default async function handler(req, res) {
  const cola = store();
  const { method } = req;

  if (method === 'GET') {
    return res.status(200).json({ ok: true, data: cola });
  }

  if (method === 'POST') {
    try {
      const { placa, imagen } = req.body || {};
      const p = String(placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!p) return res.status(400).json({ ok: false, msg: 'Falta placa' });

      const dup = cola.find(x => x.placa === p);
      if (dup) {
        // Si ya existe y llega una imagen nueva, la agregamos
        if (imagen && !dup.imagen) dup.imagen = imagen;
        return res.status(200).json({ ok: true, duplicated: true, item: dup });
      }

      const item = {
        id: Date.now(),
        placa: p,
        status: 'pendiente',
        ts: Date.now(),
        imagen: (typeof imagen === 'string') ? imagen : ''
      };

      cola.push(item);
      return res.status(201).json({ ok: true, item });
    } catch (e) {
      return res.status(500).json({ ok: false, msg: e.message });
    }
  }

  if (method === 'DELETE') {
    const idStr = (req.query?.id ?? req.body?.id ?? '').toString();
    const id = Number(idStr);
    if (!id) return res.status(400).json({ ok: false, msg: 'Falta id' });

    const idx = cola.findIndex(x => x.id === id);
    if (idx === -1) return res.status(404).json({ ok: false, msg: 'No existe' });

    const [removed] = cola.splice(idx, 1);
    return res.status(200).json({ ok: true, removed });
  }

  return res.status(405).json({ ok: false, msg: 'Método no permitido' });
}
