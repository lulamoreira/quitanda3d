-- Atualizando a capa do drop
UPDATE drops 
SET drop_image_url = 'https://stlflix.b-cdn.net/Coffee_Tower_Pod_Dispenser_thumb_29a32442c4.png' 
WHERE id = '88d7f123-f888-4437-be0e-579e3e814940';

-- Atualizando as peças usando seus IDs reais
UPDATE pieces 
SET image_url = 'https://stlflix.b-cdn.net/Coffee_Tower_Pod_Dispenser_thumb_29a32442c4.png' 
WHERE id = 'c3dc250d-a05c-44b1-80cd-23c1946cec27';

UPDATE pieces 
SET image_url = 'https://stlflix.b-cdn.net/Coffee_Time_Letter_Board_thumb_3e3ba31db1.png' 
WHERE id = 'ab5f03fd-a593-4de7-82ad-eabe05effdc0';

UPDATE pieces 
SET image_url = 'https://stlflix.b-cdn.net/Tea_Cascade_Tea_Bag_Dispenser_thumb_4946093dd3.png' 
WHERE id = 'f465c880-4147-428b-9418-f516d5b74cc5';