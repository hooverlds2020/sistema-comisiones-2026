-- Historial completo de eventos de revision (enviar_revision, observar, aprobar, marcar_resuelto, enviar_comisionado)
CREATE TABLE IF NOT EXISTS revisiones_historial (
  id SERIAL PRIMARY KEY,
  orden_id INTEGER NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  accion VARCHAR(30) NOT NULL,
  observaciones TEXT,
  usuario VARCHAR(100),
  fecha TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_revisiones_historial_orden ON revisiones_historial(orden_id);
