-- Adicionando parâmetro para forçar novo carregamento sem cache/restrição de hotlink
UPDATE drops 
SET drop_image_url = drop_image_url || '?v=q3d'
WHERE drop_image_url LIKE '%stlflix.b-cdn.net%' AND id = '88d7f123-f888-4437-be0e-579e3e814940';

UPDATE pieces 
SET image_url = image_url || '?v=q3d'
WHERE image_url LIKE '%stlflix.b-cdn.net%' AND drop_id = '88d7f123-f888-4437-be0e-579e3e814940';

-- Também para o novo drop Peekablocks
UPDATE drops 
SET drop_image_url = drop_image_url || '?v=q3d'
WHERE drop_image_url LIKE '%stlflix.b-cdn.net%' AND drop_name = 'Peekablocks!';

UPDATE pieces 
SET image_url = image_url || '?v=q3d'
WHERE image_url LIKE '%stlflix.b-cdn.net%' AND drop_id IN (SELECT id FROM drops WHERE drop_name = 'Peekablocks!');