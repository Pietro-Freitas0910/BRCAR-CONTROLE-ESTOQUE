revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.log_vehicle_created() from anon, authenticated;
revoke execute on function public.log_vehicle_status_change() from anon, authenticated;
revoke execute on function public.log_vehicle_expense() from anon, authenticated;
revoke execute on function public.log_price_change() from anon, authenticated;
revoke execute on function public.log_vehicle_sold() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from anon;