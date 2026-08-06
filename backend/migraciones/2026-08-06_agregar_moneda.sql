-- Agrega soporte de moneda (MXN/USD/EUR) para comisiones internacionales
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS moneda VARCHAR(3) DEFAULT 'MXN';
