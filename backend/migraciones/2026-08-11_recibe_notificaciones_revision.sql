-- Agrega columna para controlar quién recibe notificaciones de revisión,
-- desacoplado del rol fijo 'Administradora'
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS recibe_notificaciones_revision BOOLEAN DEFAULT false;

-- Activar para el usuario que deba recibir las notificaciones, ejemplo:
-- UPDATE usuarios SET recibe_notificaciones_revision = true WHERE username = 'jmolina';
