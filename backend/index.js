const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// CONFIGURACIÓN DE MULTER (SUBIDA DE MEMBRETES)
// ==========================================
const uploadDir = '/app/uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    cb(null, req.body.fileName || 'membrete_default.png')
  }
})

const upload = multer({ storage: storage })

app.post('/api/upload-membrete', upload.single('membrete'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }
  res.json({ message: 'Membrete actualizado correctamente', file: req.file.filename });
});

// ==========================================
// CONFIGURACIÓN DE BASE DE DATOS
// ==========================================
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT || 5432,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('❌ Error de conexión a DB:', err.message);
  else console.log('✅ Conexión exitosa a PostgreSQL');
});

const limpiar = (valor) => (valor === '' || valor === undefined ? null : valor);
const limpiarNumero = (valor) => (valor === '' || valor === undefined || isNaN(valor) ? 0 : valor);

// ==========================================
// 🤖 FUNCIÓN: PERRO GUARDIÁN DE TELEGRAM
// ==========================================
const enviarAlertaTelegram = async (mensaje) => {
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN; 
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  
  if (!TOKEN || !CHAT_ID) {
    console.log("⚠️ Telegram no configurado en .env. Omitiendo alerta.");
    return; 
  }

  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: mensaje,
        parse_mode: 'Markdown'
      })
    });
  } catch (error) {
    console.error("❌ Error enviando Telegram:", error.message);
  }
};

// ==========================================
// MÓDULO DE USUARIOS
// ==========================================
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT username, nombre, rol FROM usuarios WHERE username = $1 AND password = $2 AND activo = true',
      [username.toLowerCase(), password]
    );
    if (result.rows.length > 0) {
      const usuario = result.rows[0];
      enviarAlertaTelegram(`🔐 *Acceso al Sistema Web*\n\n👤 *Usuario:* ${usuario.nombre}\n📅 *Fecha:* ${new Date().toLocaleString('es-MX')}`);
      res.json({ message: 'Login exitoso', user: usuario });
    } else {
      res.status(401).json({ message: 'Credenciales inválidas o cuenta inactiva' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, nombre, rol, activo FROM usuarios ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/usuarios', async (req, res) => {
  const { username, password, nombre, rol } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (username, password, nombre, rol) VALUES ($1, $2, $3, $4) RETURNING id, username, nombre, rol',
      [username.toLowerCase(), password, nombre, rol]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'El usuario ya existe' }); }
});

app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, rol, activo, password } = req.body;
  try {
    const query = password 
      ? 'UPDATE usuarios SET nombre=$1, rol=$2, activo=$3, password=$4 WHERE id=$5 RETURNING *'
      : 'UPDATE usuarios SET nombre=$1, rol=$2, activo=$3 WHERE id=$4 RETURNING *';
    const values = password ? [nombre, rol, activo, password, id] : [nombre, rol, activo, id];
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// MÓDULO DE AUTORIDADES
// ==========================================
app.get('/api/autoridades', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM autoridades ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).send('Error'); }
});

app.post('/api/autoridades', async (req, res) => {
  const { nombre, cargo } = req.body;
  try {
    const result = await pool.query('INSERT INTO autoridades (nombre, cargo) VALUES ($1, $2) RETURNING *', [nombre, cargo]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/autoridades/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, cargo, activo } = req.body;
  try {
    const result = await pool.query('UPDATE autoridades SET nombre=$1, cargo=$2, activo=$3 WHERE id=$4 RETURNING *', [nombre, cargo, activo, id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/autoridades/:id', async (req, res) => {
  try {
      await pool.query('DELETE FROM autoridades WHERE id = $1', [req.params.id]);
      res.json({ message: 'Eliminado correctamente' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// MÓDULO DE ÓRDENES
// ==========================================
app.get('/api/ordenes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ordenes ORDER BY anio_folio DESC, numero_folio DESC, id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).send('Error'); }
});

app.get('/api/ordenes/duplicar/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ordenes WHERE id = $1', [req.params.id]);
    if (result.rows.length > 0) {
      const data = result.rows[0];
      delete data.id;
      delete data.numero_folio;
      delete data.anio_folio;
      res.json(data);
    } else {
      res.status(404).send('No encontrado');
    }
  } catch (err) { res.status(500).send('Error'); }
});

app.get('/api/ordenes/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ordenes WHERE id = $1', [req.params.id]);
    if (result.rows.length > 0) res.json(result.rows[0]);
    else res.status(404).send('No encontrado');
  } catch (err) { res.status(500).send('Error'); }
});

app.delete('/api/ordenes/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM ordenes WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length > 0) {
            res.json({ message: 'Orden eliminada correctamente' });
        } else {
            res.status(404).json({ error: 'Orden no encontrada' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/ordenes', async (req, res) => {
  try {
    const data = req.body;
    const fechaRef = data.fecha_elaboracion ? new Date(data.fecha_elaboracion) : new Date();
    const anioActual = fechaRef.getFullYear();

    const resFolio = await pool.query('SELECT MAX(numero_folio) as ultimo FROM ordenes WHERE anio_folio = $1', [anioActual]);
    const nuevoNumeroFolio = (resFolio.rows[0].ultimo || 0) + 1;

    const query = `
      INSERT INTO ordenes (
        tipo_comision, comisionado, rfc, categoria, adscripcion, lugar, motivo,
        fecha_inicio, fecha_fin, hora_salida, hora_regreso,
        medio_transporte, vehiculo_marca, vehiculo_modelo, vehiculo_placas,
        clave_programatica, cuota_diaria, 
        importe_combustible, importe_pasajes, importe_pasajes_aereos, importe_congresos,
        importe_viaticos, importe_otros, importe_total, estatus, fecha_elaboracion,
        numero_folio, anio_folio, informe_actividades
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
      RETURNING *
    `;

    const values = [
      limpiar(data.tipo_comision), limpiar(data.comisionado), limpiar(data.rfc), limpiar(data.categoria), limpiar(data.adscripcion), data.lugar, limpiar(data.motivo),
      data.fecha_inicio, data.fecha_fin, limpiar(data.hora_salida), limpiar(data.hora_regreso),
      data.medio_transporte, limpiar(data.vehiculo_marca), limpiar(data.vehiculo_modelo), limpiar(data.vehiculo_placas),
      limpiar(data.clave_programatica), limpiar(data.cuota_diaria), 
      limpiarNumero(data.importe_combustible), limpiarNumero(data.importe_pasajes), 
      limpiarNumero(data.importe_pasajes_aereos), limpiarNumero(data.importe_congresos),
      limpiarNumero(data.importe_viaticos), limpiarNumero(data.importe_otros), 
      limpiarNumero(data.importe_total), data.estatus || 'Borrador',
      data.fecha_elaboracion || new Date(),
      nuevoNumeroFolio, anioActual, limpiar(data.informe_actividades)
    ];

    const newOrden = await pool.query(query, values);
    
    enviarAlertaTelegram(`📝 *NUEVA ORDEN CREADA*\n\n📄 *Folio:* ${String(nuevoNumeroFolio).padStart(3, '0')}/CESMECA/${anioActual}\n👤 *Viajero:* ${data.comisionado}\n📍 *Destino:* ${data.lugar}\n💰 *Monto:* $${data.importe_total}`);

    res.json(newOrden.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al crear orden" });
  }
});

app.put('/api/ordenes/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const query = `
      UPDATE ordenes SET
        tipo_comision=$1, comisionado=$2, rfc=$3, categoria=$4, adscripcion=$5, lugar=$6, motivo=$7,
        fecha_inicio=$8, fecha_fin=$9, hora_salida=$10, hora_regreso=$11,
        medio_transporte=$12, vehiculo_marca=$13, vehiculo_modelo=$14, vehiculo_placas=$15,
        clave_programatica=$16, cuota_diaria=$17, 
        importe_combustible=$18, importe_pasajes=$19, importe_pasajes_aereos=$20, importe_congresos=$21,
        importe_viaticos=$22, importe_otros=$23, importe_total=$24, estatus=$25, fecha_elaboracion=$26, informe_actividades=$27
      WHERE id=$28 RETURNING *
    `;
    const values = [
      limpiar(data.tipo_comision), limpiar(data.comisionado), limpiar(data.rfc), limpiar(data.categoria), limpiar(data.adscripcion), data.lugar, limpiar(data.motivo),
      data.fecha_inicio, data.fecha_fin, limpiar(data.hora_salida), limpiar(data.hora_regreso),
      data.medio_transporte, limpiar(data.vehiculo_marca), limpiar(data.vehiculo_modelo), limpiar(data.vehiculo_placas),
      limpiar(data.clave_programatica), limpiar(data.cuota_diaria), 
      limpiarNumero(data.importe_combustible), limpiarNumero(data.importe_pasajes), 
      limpiarNumero(data.importe_pasajes_aereos), limpiarNumero(data.importe_congresos),
      limpiarNumero(data.importe_viaticos), limpiarNumero(data.importe_otros), 
      limpiarNumero(data.importe_total), data.estatus || 'Borrador', data.fecha_elaboracion, limpiar(data.informe_actividades), id
    ];
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PERSONAL ---
app.get('/api/personal', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM personal ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).send('Error'); }
});

app.post('/api/personal', async (req, res) => {
  const { nombre, rfc, categoria, adscripcion } = req.body;
  try {
    const result = await pool.query('INSERT INTO personal (nombre, rfc, categoria, adscripcion) VALUES ($1, $2, $3, $4) RETURNING *', [nombre, rfc, categoria, adscripcion]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/personal/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, rfc, categoria, adscripcion } = req.body;
  try {
    const result = await pool.query('UPDATE personal SET nombre=$1, rfc=$2, categoria=$3, adscripcion=$4 WHERE id=$5 RETURNING *', [nombre, rfc, categoria, adscripcion, id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/personal/:id', async (req, res) => {
  try {
      await pool.query('DELETE FROM personal WHERE id = $1', [req.params.id]);
      res.json({ message: 'Eliminado correctamente' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- VEHÍCULOS ---
app.get('/api/vehiculos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehiculos ORDER BY marca ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).send('Error'); }
});

app.post('/api/vehiculos', async (req, res) => {
  const { marca, modelo, placas } = req.body;
  try {
    const result = await pool.query('INSERT INTO vehiculos (marca, modelo, placas) VALUES ($1, $2, $3) RETURNING *', [marca, modelo, placas]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/vehiculos/:id', async (req, res) => {
  const { id } = req.params;
  const { marca, modelo, placas } = req.body;
  try {
    const result = await pool.query('UPDATE vehiculos SET marca=$1, modelo=$2, placas=$3 WHERE id=$4 RETURNING *', [marca, modelo, placas, id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/vehiculos/:id', async (req, res) => {
  try {
      await pool.query('DELETE FROM vehiculos WHERE id = $1', [req.params.id]);
      res.json({ message: 'Eliminado correctamente' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CLAVES PROGRAMÁTICAS ---
app.get('/api/claves-programaticas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM claves_programaticas ORDER BY clave ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/claves-programaticas', async (req, res) => {
  const { clave, descripcion } = req.body;
  try {
    const result = await pool.query('INSERT INTO claves_programaticas (clave, descripcion) VALUES ($1, $2) RETURNING *', [clave, descripcion]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/claves-programaticas/:id', async (req, res) => {
  const { id } = req.params;
  const { clave, descripcion } = req.body;
  try {
    const result = await pool.query('UPDATE claves_programaticas SET clave=$1, descripcion=$2 WHERE id=$3 RETURNING *', [clave, descripcion, id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/claves-programaticas/:id', async (req, res) => {
  try {
      await pool.query('DELETE FROM claves_programaticas WHERE id = $1', [req.params.id]);
      res.json({ message: 'Eliminado correctamente' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CLAVES PRESUPUESTALES ---
app.get('/api/claves-presupuestales', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM claves_presupuestales ORDER BY clave ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/claves-presupuestales', async (req, res) => {
  const { clave, descripcion } = req.body;
  try {
    const result = await pool.query('INSERT INTO claves_presupuestales (clave, descripcion) VALUES ($1, $2) RETURNING *', [clave, descripcion]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/claves-presupuestales/:id', async (req, res) => {
  const { id } = req.params;
  const { clave, descripcion } = req.body;
  try {
    const result = await pool.query('UPDATE claves_presupuestales SET clave=$1, descripcion=$2 WHERE id=$3 RETURNING *', [clave, descripcion, id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/claves-presupuestales/:id', async (req, res) => {
  try {
      await pool.query('DELETE FROM claves_presupuestales WHERE id = $1', [req.params.id]);
      res.json({ message: 'Eliminado correctamente' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(port, () => {
  console.log(`🚀 Servidor UNICACH corriendo en puerto ${port}`);
});
