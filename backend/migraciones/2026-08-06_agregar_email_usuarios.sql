-- Agrega correo electronico a usuarios, necesario para el flujo de notificaciones de revision
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email VARCHAR(150);
