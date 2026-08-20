-- BR Car Seminovos: mantém os dois números oficiais informados na legenda.
-- O caractere | permite que a interface exiba os dois e ofereça escolha no botão de WhatsApp.
update public.garage_settings
set whatsapp = '(43) 99642-8523 | (43) 99977-4439'
where id = true;
