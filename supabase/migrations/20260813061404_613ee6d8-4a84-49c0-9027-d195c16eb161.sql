create policy "team_read_vehicle_files" on storage.objects for select to authenticated
  using (bucket_id in ('vehicle-photos','vehicle-documents'));
create policy "team_upload_vehicle_files" on storage.objects for insert to authenticated
  with check (bucket_id in ('vehicle-photos','vehicle-documents'));
create policy "team_update_vehicle_files" on storage.objects for update to authenticated
  using (bucket_id in ('vehicle-photos','vehicle-documents'));
create policy "team_delete_vehicle_files" on storage.objects for delete to authenticated
  using (bucket_id in ('vehicle-photos','vehicle-documents'));