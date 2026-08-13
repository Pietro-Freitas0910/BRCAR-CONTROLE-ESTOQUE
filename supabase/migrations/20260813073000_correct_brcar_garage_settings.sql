-- Correct BR Car public garage information in existing environments.
update public.garage_settings
set
  name = 'BR Car Seminovos',
  whatsapp = '(43) 99642-8523 | (43) 99977-4439',
  address = 'Av. Brasil, 1155 - Vila Salomé, Cambé - PR, 86192-000',
  city = 'Cambé - PR',
  instagram = '@br.car.br'
where id = true;
