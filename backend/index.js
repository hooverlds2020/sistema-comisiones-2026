const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de la base de datos
const pool = new Pool({
  user: process.env.DB_USER || 'admin',
  host: process.env.DB_HOST || 'db',
  database: process.env.DB_NAME || 'comisiones_db',
  password: process.env.DB_PASS || 'password_seguro_2026',
  port: 5432,
});

// Funciones auxiliares para limpieza de datos
const limpiar = (valor) => (valor === '' || valor === undefined ? null : valor);
const limpiarNumero = (valor) => (valor === '' || valor === undefined || isNaN(valor) ? 0 : valor);

// --- RUTAS DE CATÁLOGOS ---

app.get('/api/personal', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM personal ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error al obtener personal');
  }
});

app.get('/api/vehiculos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehiculos ORDER BY marca, modelo ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error al obtener vehículos');
  }
});

app.get('/api/claves', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM claves_programaticas ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error al obtener claves');
  }
});

// --- RUTA DE AUTORIDADES (FIRMAS) ---
app.get('/api/autoridades', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM autoridades ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error al obtener autoridades');
  }
});

// --- RUTAS DE ÓRDENES DE COMISIÓN ---

// Obtener todas
app.get('/api/ordenes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ordenes ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error al obtener órdenes');
  }
});

// Obtener una específica
app.get('/api/ordenes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM ordenes WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Orden no encontrada" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error al obtener la orden');
  }
});

// Crear nueva orden
app.post('/api/ordenes', async (req, res) => {
  try {
    const { 
      tipo_comision, comisionado, rfc, categoria, adscripcion, lugar, motivo,
      fecha_inicio, fecha_fin, hora_salida, hora_regreso,
      medio_transporte, vehiculo_marca, vehiculo_modelo, vehiculo_placas,
      clave_programatica, cuota_diaria, 
      importe_combustible, importe_pasajes, importe_pasajes_aereos, 
      importe_congresos, importe_viaticos, importe_otros, 
      importe_total, estatus, fecha_elaboracion 
    } = req.body;
    
    const query = `
      INSERT INTO ordenes (
        tipo_comision, comisionado, rfc, categoria, adscripcion, lugar, motivo,
        fecha_inicio, fecha_fin, hora_salida, hora_regreso,
        medio_transporte, vehiculo_marca, vehiculo_modelo, vehiculo_placas,
        clave_programatica, cuota_diaria, 
        importe_combustible, importe_pasajes, importe_pasajes_aereos, importe_congresos,
        importe_viaticos, importe_otros, importe_total, estatus, fecha_elaboracion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      RETURNING *
    `;

    const values = [
      limpiar(tipo_comision), limpiar(comisionado), limpiar(rfc), limpiar(categoria), limpiar(adscripcion), lugar, limpiar(motivo),
      fecha_inicio, fecha_fin, limpiar(hora_salida), limpiar(hora_regreso),
      medio_transporte, limpiar(vehiculo_marca), limpiar(vehiculo_modelo), limpiar(vehiculo_placas),
      limpiar(clave_programatica), limpiar(cuota_diaria), 
      limpiarNumero(importe_combustible), limpiarNumero(importe_pasajes), 
      limpiarNumero(importe_pasajes_aereos), limpiarNumero(importe_congresos),
      limpiarNumero(importe_viaticos), limpiarNumero(importe_otros), 
      limpiarNumero(importe_total), estatus || 'Borrador',
      fecha_elaboracion || new Date() 
    ];

    const newOrden = await pool.query(query, values);
    res.json(newOrden.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al crear la orden" });
  }
});

// Actualizar orden existente
app.put('/api/ordenes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      tipo_comision, comisionado, rfc, categoria, adscripcion, lugar, motivo,
      fecha_inicio, fecha_fin, hora_salida, hora_regreso,
      medio_transporte, vehiculo_marca, vehiculo_modelo, vehiculo_placas,
      clave_programatica, cuota_diaria, 
      importe_combustible, importe_pasajes, importe_pasajes_aereos, 
      importe_congresos, importe_viaticos, importe_otros, 
      importe_total, estatus, fecha_elaboracion
    } = req.body;

    const query = `
      UPDATE ordenes SET 
        tipo_comision=$1, comisionado=$2, rfc=$3, categoria=$4, adscripcion=$5, lugar=$6, motivo=$7,
        fecha_inicio=$8, fecha_fin=$9, hora_salida=$10, hora_regreso=$11,
        medio_transporte=$12, vehiculo_marca=$13, vehiculo_modelo=$14, vehiculo_placas=$15,
        clave_programatica=$16, cuota_diaria=$17, 
        importe_combustible=$18, importe_pasajes=$19, importe_pasajes_aereos=$20, importe_congresos=$21,
        importe_viaticos=$22, importe_otros=$23, importe_total=$24, estatus=$25, fecha_elaboracion=$26
      WHERE id = $27 RETURNING *
    `;

    const values = [
      limpiar(tipo_comision), limpiar(comisionado), limpiar(rfc), limpiar(categoria), limpiar(adscripcion), lugar, limpiar(motivo),
      fecha_inicio, fecha_fin, limpiar(hora_salida), limpiar(hora_regreso),
      medio_transporte, limpiar(vehiculo_marca), limpiar(vehiculo_modelo), limpiar(vehiculo_placas),
      limpiar(clave_programatica), limpiar(cuota_diaria), 
      limpiarNumero(importe_combustible), limpiarNumero(importe_pasajes), 
      limpiarNumero(importe_pasajes_aereos), limpiarNumero(importe_congresos),
      limpiarNumero(importe_viaticos), limpiarNumero(importe_otros), 
      limpiarNumero(importe_total), estatus, fecha_elaboracion,
      id 
    ];

    const updateOrden = await pool.query(query, values);
    res.json(updateOrden.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al actualizar la orden" });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
