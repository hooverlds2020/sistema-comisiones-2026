const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

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

const transporterEmail = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const enviarCorreo = async ({ to, subject, html, attachments, replyTo }) => {
  try {
    const mailOptions = {
      from: `"Sistema de Comisiones CESMECA" <${process.env.EMAIL_USER}>`,
      to, subject, html, attachments: attachments || [],
    };
    if (replyTo) mailOptions.replyTo = replyTo;
    await transporterEmail.sendMail(mailOptions);
    console.log(`Correo enviado a ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error('Error al enviar correo:', err.message, '| code:', err.code, '| response:', err.response);
    return false;
  }
};

app.post('/api/test-email', async (req, res) => {
  const destino = req.body.to;
  if (!destino) return res.status(400).json({ error: 'Falta el campo "to"' });
  const ok = await enviarCorreo({
    to: destino,
    subject: 'Prueba - Sistema de Comisiones CESMECA',
    html: '<p>Este es un correo de prueba del Sistema de Órdenes de Comisión de CESMECA. Si lo recibiste, la configuración de correo funciona correctamente.</p>',
  });
  if (ok) res.json({ message: 'Correo enviado' });
  else res.status(500).json({ error: 'Fallo el envio, revisa los logs del contenedor' });
});

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
    const usernameLower = req.body.username.toLowerCase();
    const passwordIntentada = req.body.password;
    const result = await pool.query('SELECT id, username, nombre, rol, password FROM usuarios WHERE username = $1 AND activo = true', [usernameLower]);
    if (result.rows.length === 0) return res.status(401).json({ message: 'Inválidas' });

    const fila = result.rows[0];
    const esHash = fila.password && fila.password.startsWith('$2');
    let valido = false;

    if (esHash) {
      valido = await bcrypt.compare(passwordIntentada, fila.password);
    } else {
      valido = fila.password === passwordIntentada;
      if (valido) {
        const nuevoHash = await bcrypt.hash(passwordIntentada, 10);
        await pool.query('UPDATE usuarios SET password=$1 WHERE id=$2', [nuevoHash, fila.id]);
      }
    }

    if (!valido) return res.status(401).json({ message: 'Inválidas' });

    const usuario = { username: fila.username, nombre: fila.nombre, rol: fila.rol };
    enviarAlertaTelegram(`🛡️ *Acceso al Sistema*\n👤 *Usuario:* ${usuario.nombre}\n🕒 *Fecha:* ${new Date().toLocaleString('es-MX')}`);
    registrarBitacora(usuario.username, 'LOGIN', null, 'Inicio de sesión');
    res.json({ message: 'Login exitoso', user: usuario });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/usuarios', async (req, res) => {
  try { res.json((await pool.query('SELECT id, username, nombre, rol, activo FROM usuarios ORDER BY nombre ASC')).rows); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/usuarios', async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    res.json((await pool.query('INSERT INTO usuarios (username, password, nombre, rol) VALUES ($1, $2, $3, $4) RETURNING id, username, nombre, rol', [req.body.username.toLowerCase(), hash, req.body.nombre, req.body.rol])).rows[0]);
  } catch (err) { res.status(500).json({ error: 'Ya existe' }); }
});
app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params; const { nombre, rol, activo, password } = req.body;
  try {
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    const query = passwordHash ? 'UPDATE usuarios SET nombre=$1, rol=$2, activo=$3, password=$4 WHERE id=$5 RETURNING *' : 'UPDATE usuarios SET nombre=$1, rol=$2, activo=$3 WHERE id=$4 RETURNING *';
    res.json((await pool.query(query, passwordHash ? [nombre, rol, activo, passwordHash, id] : [nombre, rol, activo, id])).rows[0]);
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

app.get('/api/ordenes/:id/historial', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM revisiones_historial WHERE orden_id=$1 ORDER BY fecha ASC', [req.params.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/ordenes/:id/revision', async (req, res) => {
  try {
    const { accion, observaciones, usuario, pdfBase64 } = req.body;
    const ordActual = await pool.query('SELECT * FROM ordenes WHERE id=$1', [req.params.id]);
    if (ordActual.rows.length === 0) return res.status(404).json({ error: 'No encontrada' });
    const ord = ordActual.rows[0];
    const f = `${String(ord.numero_folio).padStart(3, '0')}/CESMECA/${ord.anio_folio}`;
    const linkOrden = `https://orden-comision.clickwebhoover.online/editar/${ord.id}`;
    const attachments = pdfBase64 ? [{ filename: `Orden_${f.replace(/\//g, '-')}.pdf`, content: pdfBase64, encoding: 'base64' }] : [];

    if (accion === 'enviar_revision') {
      await pool.query('UPDATE ordenes SET revision_estatus=$1, observaciones_revision=NULL WHERE id=$2', ['Pendiente', ord.id]);
      const revisora = await pool.query("SELECT email FROM usuarios WHERE rol = 'Administradora' AND email IS NOT NULL LIMIT 1");
      if (revisora.rows[0]?.email) {
        await enviarCorreo({
          to: revisora.rows[0].email,
          subject: `Orden ${f} lista para revisión`,
          html: `<p>La orden de comisión <b>${f}</b> de <b>${ord.comisionado}</b> está lista para tu revisión.</p><p>Puedes revisarla y aprobarla aquí: <a href="${linkOrden}">${linkOrden}</a></p>`,
          attachments,
        });
      }
      registrarBitacora(usuario, 'REVISION', f, 'Enviada a revisión');
      await pool.query('INSERT INTO revisiones_historial (orden_id, accion, observaciones, usuario) VALUES ($1,$2,$3,$4)', [ord.id, 'enviar_revision', null, usuario]);
    } else if (accion === 'observar') {
      await pool.query('UPDATE ordenes SET revision_estatus=$1, observaciones_revision=$2 WHERE id=$3', ['Con Observaciones', observaciones || '', ord.id]);
      const creador = await pool.query('SELECT email FROM usuarios WHERE nombre = $1 AND email IS NOT NULL LIMIT 1', [ord.usuario_modificador]);
      if (creador.rows[0]?.email) {
        await enviarCorreo({
          to: creador.rows[0].email,
          subject: `Orden ${f} tiene observaciones`,
          html: `<p>La orden de comisión <b>${f}</b> de <b>${ord.comisionado}</b> tiene observaciones:</p><blockquote>${observaciones || ''}</blockquote><p>Revísala aquí: <a href="${linkOrden}">${linkOrden}</a></p>`,
        });
      }
      registrarBitacora(usuario, 'REVISION', f, `Con observaciones: ${observaciones || ''}`);
      await pool.query('INSERT INTO revisiones_historial (orden_id, accion, observaciones, usuario) VALUES ($1,$2,$3,$4)', [ord.id, 'observar', observaciones || '', usuario]);
    } else if (accion === 'aprobar') {
      await pool.query('UPDATE ordenes SET revision_estatus=$1, observaciones_revision=NULL WHERE id=$2', ['Aprobada', ord.id]);
      registrarBitacora(usuario, 'REVISION', f, 'Aprobada');
      await pool.query('INSERT INTO revisiones_historial (orden_id, accion, observaciones, usuario) VALUES ($1,$2,$3,$4)', [ord.id, 'aprobar', null, usuario]);
    } else if (accion === 'marcar_resuelto') {
      await pool.query('UPDATE ordenes SET revision_estatus=$1, observaciones_revision=NULL WHERE id=$2', ['Pendiente', ord.id]);
      registrarBitacora(usuario, 'REVISION', f, 'Marcada como resuelta sin reenvio de correo');
      await pool.query('INSERT INTO revisiones_historial (orden_id, accion, observaciones, usuario) VALUES ($1,$2,$3,$4)', [ord.id, 'marcar_resuelto', null, usuario]);
    } else if (accion === 'enviar_comisionado') {
      if (!ord.comisionado_email) {
        return res.status(400).json({ error: 'La orden no tiene correo del comisionado capturado.' });
      }
      const creadorReply = await pool.query('SELECT email FROM usuarios WHERE nombre = $1 AND email IS NOT NULL LIMIT 1', [ord.usuario_modificador]);
      const enviado = await enviarCorreo({
        to: ord.comisionado_email,
        subject: `Orden de comisión ${f} aprobada`,
        html: `<p>Tu orden de comisión <b>${f}</b> ha sido aprobada. Se adjunta el documento final.</p><p>Si tienes alguna observación sobre este documento, puedes responder directamente a este correo.</p>`,
        attachments,
        replyTo: creadorReply.rows[0]?.email || undefined,
      });
      if (!enviado) {
        return res.status(500).json({ error: 'No se pudo enviar el correo. Intenta de nuevo.' });
      }
      registrarBitacora(usuario, 'REVISION', f, 'Enviada al comisionado por correo');
      await pool.query('INSERT INTO revisiones_historial (orden_id, accion, observaciones, usuario) VALUES ($1,$2,$3,$4)', [ord.id, 'enviar_comisionado', null, usuario]);
    } else {
      return res.status(400).json({ error: 'Accion no reconocida' });
    }

    const actualizada = await pool.query('SELECT * FROM ordenes WHERE id=$1', [ord.id]);
    res.json(actualizada.rows[0]);
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

// MODIFICADA CON vehiculo_anio
app.post('/api/ordenes', async (req, res) => {
  try {
    const data = req.body;
    if (!data.comisionado || !data.lugar) return res.status(400).json({ error: "Faltan datos" });
    const anioActual = (data.fecha_elaboracion ? new Date(data.fecha_elaboracion) : new Date()).getFullYear();
    const resFolio = await pool.query('SELECT MAX(numero_folio) as ultimo FROM ordenes WHERE anio_folio = $1', [anioActual]);
    const nFolio = (resFolio.rows[0].ultimo || 0) + 1;
    const query = `INSERT INTO ordenes (tipo_comision, comisionado, rfc, categoria, adscripcion, lugar, motivo, fecha_inicio, fecha_fin, hora_salida, hora_regreso, medio_transporte, vehiculo_marca, vehiculo_modelo, vehiculo_placas, vehiculo_anio, moneda, comisionado_email, clave_programatica, cuota_diaria, importe_combustible, importe_pasajes, importe_pasajes_aereos, importe_congresos, importe_viaticos, importe_otros, importe_total, estatus, fecha_elaboracion, numero_folio, anio_folio, informe_actividades, es_fechas_multiples, periodo_texto, dias_salida, dias_regreso, usuario_modificador) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37) RETURNING *`;
    const val = [limpiar(data.tipo_comision), limpiar(data.comisionado), limpiar(data.rfc), limpiar(data.categoria), limpiar(data.adscripcion), data.lugar, limpiar(data.motivo), data.fecha_inicio, data.fecha_fin, limpiar(data.hora_salida), limpiar(data.hora_regreso), data.medio_transporte, limpiar(data.vehiculo_marca), limpiar(data.vehiculo_modelo), limpiar(data.vehiculo_placas), limpiar(data.vehiculo_anio), limpiar(data.moneda) || 'MXN', limpiar(data.comisionado_email), limpiar(data.clave_programatica), limpiar(data.cuota_diaria), limpiarNumero(data.importe_combustible), limpiarNumero(data.importe_pasajes), limpiarNumero(data.importe_pasajes_aereos), limpiarNumero(data.importe_congresos), limpiarNumero(data.importe_viaticos), limpiarNumero(data.importe_otros), limpiarNumero(data.importe_total), data.estatus || 'En Proceso', data.fecha_elaboracion || new Date(), nFolio, anioActual, limpiar(data.informe_actividades), data.es_fechas_multiples || false, data.periodo_texto || '', data.dias_salida || '', data.dias_regreso || '', limpiar(data.usuario_modificador)];
    const newOrden = await pool.query(query, val);
    const f = `${String(nFolio).padStart(3, '0')}/CESMECA/${anioActual}`;
    registrarBitacora(data.usuario_modificador, 'CREAR', f, `Creada para ${data.comisionado}`); enviarAlertaTelegram(`✨ *NUEVA*\n📄 *Folio:* ${f}\n👤 *Viajero:* ${data.comisionado}\n💰 *Monto:* $${data.importe_total}\n👨‍💻 *Usuario:* ${data.usuario_modificador || 'Sistema'}`);
    res.json(newOrden.rows[0]);
  } catch (err) { res.status(500).json({ error: "Error" }); }
});

// MODIFICADA CON vehiculo_anio
app.put('/api/ordenes/:id', async (req, res) => {
  try {
    const d = req.body;
    const q = `UPDATE ordenes SET tipo_comision=$1, comisionado=$2, rfc=$3, categoria=$4, adscripcion=$5, lugar=$6, motivo=$7, fecha_inicio=$8, fecha_fin=$9, hora_salida=$10, hora_regreso=$11, medio_transporte=$12, vehiculo_marca=$13, vehiculo_modelo=$14, vehiculo_placas=$15, vehiculo_anio=$16, moneda=$17, comisionado_email=$18, clave_programatica=$19, cuota_diaria=$20, importe_combustible=$21, importe_pasajes=$22, importe_pasajes_aereos=$23, importe_congresos=$24, importe_viaticos=$25, importe_otros=$26, importe_total=$27, estatus=$28, fecha_elaboracion=$29, informe_actividades=$30, es_fechas_multiples=$31, periodo_texto=$32, dias_salida=$33, dias_regreso=$34, usuario_modificador=$35 WHERE id=$36 RETURNING *`;
    const v = [limpiar(d.tipo_comision), limpiar(d.comisionado), limpiar(d.rfc), limpiar(d.categoria), limpiar(d.adscripcion), d.lugar, limpiar(d.motivo), d.fecha_inicio, d.fecha_fin, limpiar(d.hora_salida), limpiar(d.hora_regreso), d.medio_transporte, limpiar(d.vehiculo_marca), limpiar(d.vehiculo_modelo), limpiar(d.vehiculo_placas), limpiar(d.vehiculo_anio), limpiar(d.moneda) || 'MXN', limpiar(d.comisionado_email), limpiar(d.clave_programatica), limpiar(d.cuota_diaria), limpiarNumero(d.importe_combustible), limpiarNumero(d.importe_pasajes), limpiarNumero(d.importe_pasajes_aereos), limpiarNumero(d.importe_congresos), limpiarNumero(d.importe_viaticos), limpiarNumero(d.importe_otros), limpiarNumero(d.importe_total), d.estatus || 'En Proceso', d.fecha_elaboracion, limpiar(d.informe_actividades), d.es_fechas_multiples || false, d.periodo_texto || '', d.dias_salida || '', d.dias_regreso || '', limpiar(d.usuario_modificador), req.params.id];
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

// MODIFICADA CON anio PARA VEHÍCULOS
app.post('/api/vehiculos', async (req, res) => { try { res.json((await pool.query('INSERT INTO vehiculos (marca, modelo, placas, anio) VALUES ($1,$2,$3,$4) RETURNING *', [req.body.marca, req.body.modelo, req.body.placas, req.body.anio])).rows[0]); } catch(e){ res.status(500).json({error:e.message}); }});
app.put('/api/vehiculos/:id', async (req, res) => { try { res.json((await pool.query('UPDATE vehiculos SET marca=$1, modelo=$2, placas=$3, anio=$4 WHERE id=$5 RETURNING *', [req.body.marca, req.body.modelo, req.body.placas, req.body.anio, req.params.id])).rows[0]); } catch(e){ res.status(500).json({error:e.message}); }});

const genCatalog = (ruta, tabla) => {
  app.get(ruta, async (req, res) => { try { res.json((await pool.query(`SELECT * FROM ${tabla} ORDER BY clave ASC`)).rows); } catch (e) { res.status(500).json({error:e.message}); } });
  app.post(ruta, async (req, res) => { try { res.json((await pool.query(`INSERT INTO ${tabla} (clave, descripcion) VALUES ($1,$2) RETURNING *`, [req.body.clave, req.body.descripcion])).rows[0]); } catch (e) { res.status(500).json({error:e.message}); } });
  app.put(`${ruta}/:id`, async (req, res) => { try { res.json((await pool.query(`UPDATE ${tabla} SET clave=$1, descripcion=$2 WHERE id=$3 RETURNING *`, [req.body.clave, req.body.descripcion, req.params.id])).rows[0]); } catch (e) { res.status(500).json({error:e.message}); } });
  app.delete(`${ruta}/:id`, async (req, res) => { try { await pool.query(`DELETE FROM ${tabla} WHERE id = $1`, [req.params.id]); res.json({ message: 'Eliminado' }); } catch (e) { res.status(500).json({error:e.message}); } });
};
genCatalog('/api/claves-programaticas', 'claves_programaticas'); genCatalog('/api/claves-presupuestales', 'claves_presupuestales');

app.get('/api/bitacora', async (req, res) => { try { res.json((await pool.query('SELECT * FROM bitacora ORDER BY fecha DESC LIMIT 100')).rows); } catch(e){ res.status(500).json({error:e.message}); }});

app.listen(port, () => console.log(`🚀 Servidor en puerto ${port}`));
