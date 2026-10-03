-- Add peso and foto columns to produtos table
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS peso DECIMAL(10, 3);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS foto VARCHAR(500);

-- Create index for foto for faster lookups
CREATE INDEX IF NOT EXISTS idx_produtos_foto ON produtos(foto);
