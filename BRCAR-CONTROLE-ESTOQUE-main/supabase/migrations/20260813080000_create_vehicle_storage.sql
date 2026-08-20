insert into storage.buckets (id,name,public) values ('vehicle-photos','vehicle-photos',true) on conflict (id) do update set public = excluded.public;
insert into storage.buckets (id,name,public) values ('vehicle-documents','vehicle-documents',false) on conflict (id) do update set public = excluded.public;

drop policy if exists "public_read_vehicle_photos" on storage.objects;
create policy "public_read_vehicle_photos" on storage.objects for select to public using (bucket_id = 'vehicle-photos');
