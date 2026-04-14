#!/bin/bash

# --- CONFIGURACIÓN DE FECHA Y RUTAS ---
FECHA=$(date +"%Y-%m-%d_%H-%M")
RUTA_LOCAL="/home/dockerdata/ordenes_comision/backups_locales"
NOMBRE_ARCHIVO="BD_Comisiones_$FECHA.sql.gz"

# Crear la carpeta local si no existe
mkdir -p $RUTA_LOCAL

# --- 1. DATOS DE CONEXIÓN EXACTOS ---
CONTENEDOR_DB="comisiones_db_2026"
USUARIO_DB="admin"
PASSWORD_DB="password_seguro_2026"
NOMBRE_DB="comisiones_db"

echo "Iniciando respaldo de base de datos PostgreSQL..."
# El comando saca el respaldo de Postgres y lo comprime sobre la marcha
docker exec -e PGPASSWORD="$PASSWORD_DB" $CONTENEDOR_DB pg_dump -U $USUARIO_DB $NOMBRE_DB | gzip > $RUTA_LOCAL/$NOMBRE_ARCHIVO

# --- 2. SUBIDA A GOOGLE DRIVE ---
echo "Subiendo a Google Drive..."
rclone copy $RUTA_LOCAL/$NOMBRE_ARCHIVO respaldos:Backups_Ordenes_Comision

# --- 3. LIMPIEZA AUTOMÁTICA (Mantenimiento) ---
echo "Limpiando respaldos locales antiguos (más de 7 días)..."
find $RUTA_LOCAL -type f -name "*.sql.gz" -mtime +7 -exec rm {} \;

echo "¡Respaldo $NOMBRE_ARCHIVO completado y asegurado en la nube!"
