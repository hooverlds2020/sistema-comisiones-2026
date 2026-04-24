const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uploadDir = '/app/uploads';
if (!fs.existsSync(uploadDir)){ fs.mkdirSync(uploadDir, { recursive: true }); }

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir) },
  filename: function (req, file, cb) { cb(null, req.body.fileName || 'membrete_default.png') }
})
const upload = multer({ storage: storage })

app.post('/api/upload-membrete', upload.single('membrete'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No archivo' });
  res.json({ message: 'Membrete actualizado', file: req.file.filename });
});

const pool = new Pool({
  user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME, password: process.env.DB_PASS, port: process.env.DB_PORT || 5432,
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('❌ Error de DB:', err.message);
  else console.log('✅ Conexión exitosa a PostgreSQL');
});

const limpiar = (valor) => (valor === '' || valor === undefined ? null : valor);
const limpiarNumero = (valor) => (valor === '' || valor === undefined || isNaN(valor) ? 0 : valor);

const enviarAlertaTelegram = async (mensaje) => {
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN; const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  if (!TOKEN || !CHAT_ID) return;
  try { await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: CHAT_ID, text: mensaje, parse_mode: 'Markdown' }) });
  } catch (error) { console.error("❌ Telegram:", error.message); }
};

const registrarBitacora = async (usuario, accion, folio, detalles) => {
  try { await pool.query('INSERT INTO bitacora (usuario, accion, folio, detalles) VALUES ($1, $2, $3, $4)', [usuario || 'Sistema', accion, folio, detalles]);
  } catch (err) { console.error('❌ Error bitácora:', err.message); }
};

// --- USUARIOS ---
app.post('/api/login', async (req, res) => {
  try {
    const result = await pool.query('SELECT username, nombre, rol FROM usuarios WHERE username = $1 AND password = $2 AND activo = true', [req.body.username.toLowerCase(), req.body.password]);
    if (result.rows.length > 0) {
      const usuario = result.rows[0];
      enviarAlertaTelegram(`🛡️ *Acceso al Sistema*\n👤 *Usuario:* ${usuario.nombre}\n🕒 *Fecha:* ${new Date().toLocaleString('es-MX')}`);
      registrarBitacora(usuario.username, 'LOGIN', null, 'Inicio de sesión');
      res.json({ message: 'Login exitoso', user: usuario });
    } else res.status(401).json({ message: 'Inválidas' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/usuarios', async (req, res) => {
  try { res.json((await pool.query('SELECT id, username, nombre, rol, activo FROM usuarios ORDER BY nombre ASC')).rows); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/usuarios', async (req, res) => {
  try { res.json((await pool.query('INSERT INTO usuarios (username, password, nombre, rol) VALUES ($1, $2, $3, $4) RETURNING id, username, nombre, rol', [req.body.username.toLowerCase(), req.body.password, req.body.nombre, req.body.rol])).rows[0]); } 
  catch (err) { res.status(500).json({ error: 'Ya existe' }); }
});
app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params; const { nombre, rol, activo, password } = req.body;
  try {
    const query = password ? 'UPDATE usuarios SET nombre=$1, rol=$2, activo=$3, password=$4 WHERE id=$5 RETURNING *' : 'UPDATE usuarios SET nombre=$1, rol=$2, activo=$3 WHERE id=$4 RETURNING *';
    res.json((await pool.query(query, password ? [nombre, rol, activo, password, id] : [nombre, rol, activo, id])).rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- AUTORIDADES ---
app.get('/api/autoridades', async (req, res) => { try { res.json((await pool.query('SELECT * FROM autoridades ORDER BY nombre ASC')).rows); } catch (err) { res.status(500).send('Error'); }});
app.post('/api/autoridades', async (req, res) => { try { res.json((await pool.query('INSERT INTO autoridades (nombre, cargo) VALUES ($1, $2) RETURNING *', [req.body.nombre, req.body.cargo])).rows[0]); } catch (err) { res.status(500).json({ error: err.message }); }});
app.put('/api/autoridades/:id', async (req, res) => { try { res.json((await pool.query('UPDATE autoridades SET nombre=$1, cargo=$2, activo=$3 WHERE id=$4 RETURNING *', [req.body.nombre, req.body.cargo, req.body.activo, req.params.id])).rows[0]); } catch (err) { res.status(500).json({ error: err.message }); }});
app.delete('/api/autoridades/:id', async (req, res) => { try { await pool.query('DELETE FROM autoridades WHERE id = $1', [req.params.id]); res.json({ message: 'Eliminado' }); } catch (err) { res.status(500).json({ error: err.message }); }});

// --- ORDENES ---
app.get('/api/ordenes', async (req, res) => { try { res.json((await pool.query('SELECT * FROM ordenes ORDER BY anio_folio DESC, numero_folio DESC, id DESC')).rows); } catch (err) { res.status(500).send('Error'); }});
app.get('/api/ordenes/duplicar/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ordenes WHERE id = $1', [req.params.id]);
    if (result.rows.length > 0) { const data = result.rows[0]; delete data.id; delete data.numero_folio; delete data.anio_folio; res.json(data); } else res.status(404).send('No encontrado');
  } catch (err) { res.status(500).send('Error'); }
});
app.get('/api/ordenes/:id', async (req, res) => { try { const result = await pool.query('SELECT * FROM ordenes WHERE id = $1', [req.params.id]); if (result.rows.length > 0) res.json(result.rows[0]); else res.status(404).send('No encontrado'); } catch (err) { res.status(500).send('Error'); }});

app.delete('/api/ordenes/:id', async (req, res) => {
    try {
        const { usuario_modificador } = req.body;
        const result = await pool.query('DELETE FROM ordenes WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length > 0) {
            const ord = result.rows[0]; const f = `${String(ord.numero_folio).padStart(3, '0')}/CESMECA/${ord.anio_folio}`;
            registrarBitacora(usuario_modificador, 'ELIMINAR', f, `Eliminada orden de ${ord.comisionado}`); enviarAlertaTelegram(`🗑️ *ELIMINADA*\n📄 *Folio:* ${f}\n👤 *Viajero:* ${ord.comisionado}\n👨‍💻 *Usuario:* ${usuario_modificador || 'Sistema'}`); res.json({ message: 'OK' });
        } else res.status(404).json({ error: 'No encontrada' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/ordenes/:id/reasignar', async (req, res) => {
  try {
    const result = await pool.query('UPDATE ordenes SET usuario_modificador=$1 WHERE id=$2 RETURNING *', [req.body.nuevo_usuario, req.params.id]);
    if (result.rows.length > 0) {
      const ord = result.rows[0]; const f = `${String(ord.numero_folio).padStart(3, '0')}/CESMECA/${ord.anio_folio}`;
      registrarBitacora(req.body.admin_usuario, 'REASIGNAR', f, `Reasignada a ${req.body.nuevo_usuario || 'Sistema'}`); res.json(ord);
    } else res.status(404).json({ error: 'No encontrada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/ordenes/:id/estatus', async (req, res) => {
  try {
    const { estatus, usuario } = req.body;
    const result = await pool.query('UPDATE ordenes SET estatus=$1 WHERE id=$2 RETURNING *', [estatus, req.params.id]);
    if (result.rows.length > 0) {
      const ord = result.rows[0]; const f = `${String(ord.numero_folio).padStart(3, '0')}/CESMECA/${ord.anio_folio}`;
      registrarBitacora(usuario, 'ESTATUS', f, `Marcado como ${estatus}`); res.json(ord);
    } else res.status(404).json({ error: 'No encontrada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🔢 NUEVA RUTA: RENUMERAR FOLIO (SOLO ADMIN)
app.patch('/api/ordenes/:id/folio', async (req, res) => {
  try {
    const { nuevo_numero, nuevo_anio, admin_usuario } = req.body;
    const result = await pool.query('UPDATE ordenes SET numero_folio=$1, anio_folio=$2 WHERE id=$3 RETURNING *', [nuevo_numero, nuevo_anio, req.params.id]);
    if (result.rows.length > 0) {
      const ord = result.rows[0]; const f = `${String(nuevo_numero).padStart(3, '0')}/CESMECA/${nuevo_anio}`;
      registrarBitacora(admin_usuario, 'RENUMERAR', f, `Folio cambiado manualmente a ${f}`); res.json(ord);
    } else res.status(404).json({ error: 'No encontrada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ordenes', async (req, res) => {
  try {
    const data = req.body;
    if (!data.comisionado || !data.lugar) return res.status(400).json({ error: "Faltan datos" });
    const anioActual = (data.fecha_elaboracion ? new Date(data.fecha_elaboracion) : new Date()).getFullYear();
    const resFolio = await pool.query('SELECT MAX(numero_folio) as ultimo FROM ordenes WHERE anio_folio = $1', [anioActual]);
    const nFolio = (resFolio.rows[0].ultimo || 0) + 1;
    const query = `INSERT INTO ordenes (tipo_comision, comisionado, rfc, categoria, adscripcion, lugar, motivo, fecha_inicio, fecha_fin, hora_salida, hora_regreso, medio_transporte, vehiculo_marca, vehiculo_modelo, vehiculo_placas, clave_programatica, cuota_diaria, importe_combustible, importe_pasajes, importe_pasajes_aereos, importe_congresos, importe_viaticos, importe_otros, importe_total, estatus, fecha_elaboracion, numero_folio, anio_folio, informe_actividades, es_fechas_multiples, periodo_texto, dias_salida, dias_regreso, usuario_modificador) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34) RETURNING *`;
    const val = [limpiar(data.tipo_comision), limpiar(data.comisionado), limpiar(data.rfc), limpiar(data.categoria), limpiar(data.adscripcion), data.lugar, limpiar(data.motivo), data.fecha_inicio, data.fecha_fin, limpiar(data.hora_salida), limpiar(data.hora_regreso), data.medio_transporte, limpiar(data.vehiculo_marca), limpiar(data.vehiculo_modelo), limpiar(data.vehiculo_placas), limpiar(data.clave_programatica), limpiar(data.cuota_diaria), limpiarNumero(data.importe_combustible), limpiarNumero(data.importe_pasajes), limpiarNumero(data.importe_pasajes_aereos), limpiarNumero(data.importe_congresos), limpiarNumero(data.importe_viaticos), limpiarNumero(data.importe_otros), limpiarNumero(data.importe_total), data.estatus || 'En Proceso', data.fecha_elaboracion || new Date(), nFolio, anioActual, limpiar(data.informe_actividades), data.es_fechas_multiples || false, data.periodo_texto || '', data.dias_salida || '', data.dias_regreso || '', limpiar(data.usuario_modificador)];
    const newOrden = await pool.query(query, val);
    const f = `${String(nFolio).padStart(3, '0')}/CESMECA/${anioActual}`;
    registrarBitacora(data.usuario_modificador, 'CREAR', f, `Creada para ${data.comisionado}`); enviarAlertaTelegram(`✨ *NUEVA*\n📄 *Folio:* ${f}\n👤 *Viajero:* ${data.comisionado}\n💰 *Monto:* $${data.importe_total}\n👨‍💻 *Usuario:* ${data.usuario_modificador || 'Sistema'}`);
    res.json(newOrden.rows[0]);
  } catch (err) { res.status(500).json({ error: "Error" }); }
});

app.put('/api/ordenes/:id', async (req, res) => {
  try {
    const d = req.body;
    const q = `UPDATE ordenes SET tipo_comision=$1, comisionado=$2, rfc=$3, categoria=$4, adscripcion=$5, lugar=$6, motivo=$7, fecha_inicio=$8, fecha_fin=$9, hora_salida=$10, hora_regreso=$11, medio_transporte=$12, vehiculo_marca=$13, vehiculo_modelo=$14, vehiculo_placas=$15, clave_programatica=$16, cuota_diaria=$17, importe_combustible=$18, importe_pasajes=$19, importe_pasajes_aereos=$20, importe_congresos=$21, importe_viaticos=$22, importe_otros=$23, importe_total=$24, estatus=$25, fecha_elaboracion=$26, informe_actividades=$27, es_fechas_multiples=$28, periodo_texto=$29, dias_salida=$30, dias_regreso=$31, usuario_modificador=$32 WHERE id=$33 RETURNING *`;
    const v = [limpiar(d.tipo_comision), limpiar(d.comisionado), limpiar(d.rfc), limpiar(d.categoria), limpiar(d.adscripcion), d.lugar, limpiar(d.motivo), d.fecha_inicio, d.fecha_fin, limpiar(d.hora_salida), limpiar(d.hora_regreso), d.medio_transporte, limpiar(d.vehiculo_marca), limpiar(d.vehiculo_modelo), limpiar(d.vehiculo_placas), limpiar(d.clave_programatica), limpiar(d.cuota_diaria), limpiarNumero(d.importe_combustible), limpiarNumero(d.importe_pasajes), limpiarNumero(d.importe_pasajes_aereos), limpiarNumero(d.importe_congresos), limpiarNumero(d.importe_viaticos), limpiarNumero(d.importe_otros), limpiarNumero(d.importe_total), d.estatus || 'En Proceso', d.fecha_elaboracion, limpiar(d.informe_actividades), d.es_fechas_multiples || false, d.periodo_texto || '', d.dias_salida || '', d.dias_regreso || '', limpiar(d.usuario_modificador), req.params.id];
    const r = await pool.query(q, v);
    if (r.rows.length > 0) { const o = r.rows[0]; registrarBitacora(d.usuario_modificador, 'EDITAR', `${String(o.numero_folio).padStart(3, '0')}/CESMECA/${o.anio_folio}`, `Modificada`); }
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CATALOGOS EXTRAS ---
const genRoutes = (ruta, tabla) => {
  app.get(ruta, async (req, res) => { try { res.json((await pool.query(`SELECT * FROM ${tabla} ORDER BY ${tabla==='vehiculos'?'marca':'nombre'} ASC`)).rows); } catch (e) { res.status(500).json({ error: e.message }); } });
  app.delete(`${ruta}/:id`, async (req, res) => { try { await pool.query(`DELETE FROM ${tabla} WHERE id = $1`, [req.params.id]); res.json({ message: 'Eliminado' }); } catch (e) { res.status(500).json({ error: e.message }); } });
};
genRoutes('/api/personal', 'personal'); genRoutes('/api/vehiculos', 'vehiculos');
app.post('/api/personal', async (req, res) => { try { res.json((await pool.query('INSERT INTO personal (nombre, rfc, categoria, adscripcion) VALUES ($1,$2,$3,$4) RETURNING *', [req.body.nombre, req.body.rfc, req.body.categoria, req.body.adscripcion])).rows[0]); } catch(e){ res.status(500).json({error:e.message}); }});
app.put('/api/personal/:id', async (req, res) => { try { res.json((await pool.query('UPDATE personal SET nombre=$1, rfc=$2, categoria=$3, adscripcion=$4 WHERE id=$5 RETURNING *', [req.body.nombre, req.body.rfc, req.body.categoria, req.body.adscripcion, req.params.id])).rows[0]); } catch(e){ res.status(500).json({error:e.message}); }});
app.post('/api/vehiculos', async (req, res) => { try { res.json((await pool.query('INSERT INTO vehiculos (marca, modelo, placas) VALUES ($1,$2,$3) RETURNING *', [req.body.marca, req.body.modelo, req.body.placas])).rows[0]); } catch(e){ res.status(500).json({error:e.message}); }});
app.put('/api/vehiculos/:id', async (req, res) => { try { res.json((await pool.query('UPDATE vehiculos SET marca=$1, modelo=$2, placas=$3 WHERE id=$4 RETURNING *', [req.body.marca, req.body.modelo, req.body.placas, req.params.id])).rows[0]); } catch(e){ res.status(500).json({error:e.message}); }});

const genCatalog = (ruta, tabla) => {
  app.get(ruta, async (req, res) => { try { res.json((await pool.query(`SELECT * FROM ${tabla} ORDER BY clave ASC`)).rows); } catch (e) { res.status(500).json({error:e.message}); } });
  app.post(ruta, async (req, res) => { try { res.json((await pool.query(`INSERT INTO ${tabla} (clave, descripcion) VALUES ($1,$2) RETURNING *`, [req.body.clave, req.body.descripcion])).rows[0]); } catch (e) { res.status(500).json({error:e.message}); } });
  app.put(`${ruta}/:id`, async (req, res) => { try { res.json((await pool.query(`UPDATE ${tabla} SET clave=$1, descripcion=$2 WHERE id=$3 RETURNING *`, [req.body.clave, req.body.descripcion, req.params.id])).rows[0]); } catch (e) { res.status(500).json({error:e.message}); } });
  app.delete(`${ruta}/:id`, async (req, res) => { try { await pool.query(`DELETE FROM ${tabla} WHERE id = $1`, [req.params.id]); res.json({ message: 'Eliminado' }); } catch (e) { res.status(500).json({error:e.message}); } });
};
genCatalog('/api/claves-programaticas', 'claves_programaticas'); genCatalog('/api/claves-presupuestales', 'claves_presupuestales');

app.get('/api/bitacora', async (req, res) => { try { res.json((await pool.query('SELECT * FROM bitacora ORDER BY fecha DESC LIMIT 100')).rows); } catch(e){ res.status(500).json({error:e.message}); }});

app.listen(port, () => console.log(`🚀 Servidor en puerto ${port}`));
