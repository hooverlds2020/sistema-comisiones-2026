const fs = require('fs');

// --- 1. PARCHAR EL BACKEND (index.js) ---
const backendFile = '/home/dockerdata/ordenes_comision/backend/index.js';
let backendContent = fs.readFileSync(backendFile, 'utf8');

// Agregar los 4 campos de fechas múltiples a la consulta SQL
backendContent = backendContent.replace(
    /informe_actividades=\$27\s*WHERE id=\$28 RETURNING \*/g,
    'informe_actividades=$27, es_fechas_multiples=$28, periodo_texto=$29, dias_salida=$30, dias_regreso=$31\n      WHERE id=$32 RETURNING *'
);

// Agregar los 4 valores correspondientes a la consulta
backendContent = backendContent.replace(
    /limpiarNumero\(data\.importe_total\), data\.estatus \|\| 'Borrador', data\.fecha_elaboracion, limpiar\(data\.informe_actividades\), id/g,
    "limpiarNumero(data.importe_total), data.estatus || 'Borrador', data.fecha_elaboracion, limpiar(data.informe_actividades), data.es_fechas_multiples || false, data.periodo_texto || '', data.dias_salida || '', data.dias_regreso || '', id"
);

fs.writeFileSync(backendFile, backendContent);
console.log("✅ Backend parchado: Ahora sí guardará las fechas múltiples al editar.");

// --- 2. PARCHAR EL FRONTEND (EditarComision.jsx) ---
const frontendFile = '/home/dockerdata/ordenes_comision/frontend/src/components/EditarComision.jsx';
let frontendContent = fs.readFileSync(frontendFile, 'utf8');

const targetStr = "const datosFinales = { ...formData, clave_programatica: clavesSeleccionadas.join(', '), usuario_modificador: JSON.parse(localStorage.getItem('usuarioActivo') || '{}').nombre || 'Sistema' };";

if (!frontendContent.includes('datosFinales.fecha_inicio = null;')) {
    const replacementStr = targetStr + "\n\n    // Limpiar textos vacíos para que PostgreSQL no marque error\n    if (!datosFinales.fecha_inicio) datosFinales.fecha_inicio = null;\n    if (!datosFinales.fecha_fin) datosFinales.fecha_fin = null;\n    if (!datosFinales.hora_salida) datosFinales.hora_salida = null;\n    if (!datosFinales.hora_regreso) datosFinales.hora_regreso = null;";
    frontendContent = frontendContent.replace(targetStr, replacementStr);
    fs.writeFileSync(frontendFile, frontendContent);
    console.log("✅ Frontend parchado: Limpieza de fechas activada.");
}
