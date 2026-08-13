revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.log_vehicle_created() from public, anon, authenticated;
revoke execute on function public.log_vehicle_status_change() from public, anon, authenticated;
revoke execute on function public.log_vehicle_expense() from public, anon, authenticated;
revoke execute on function public.log_price_change() from public, anon, authenticated;
revoke execute on function public.log_vehicle_sold() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
grant execute on function public.has_role(uuid, public.app_role) to service_role;
