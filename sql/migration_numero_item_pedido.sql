ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS numero_item INTEGER;

-- Numera os itens que já existem, por pedido, na ordem em que foram incluídos
UPDATE itens_pedido i
SET numero_item = r.n
FROM (
  SELECT id, row_number() OVER (PARTITION BY pedido_id ORDER BY criado_em, id) AS n
  FROM itens_pedido
) r
WHERE i.id = r.id AND i.numero_item IS NULL;
