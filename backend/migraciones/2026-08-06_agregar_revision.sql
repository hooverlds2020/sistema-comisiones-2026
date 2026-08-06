-- Agrega flujo de revisión por correo: revision_estatus (NULL, Pendiente, Con Observaciones, Aprobada)
-- y observaciones_revision (nota que deja la administradora al regresar una orden)
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS revision_estatus VARCHAR(30) DEFAULT NULL;
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS observaciones_revision TEXT DEFAULT NULL;
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS comisionado_email VARCHAR(150);
