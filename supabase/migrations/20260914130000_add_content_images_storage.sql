insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists content_images_public_read on storage.objects;
create policy content_images_public_read
on storage.objects for select
using (bucket_id = 'content-images');

drop policy if exists content_images_editor_insert on storage.objects;
create policy content_images_editor_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'content-images' and public.is_editor());

drop policy if exists content_images_editor_update on storage.objects;
create policy content_images_editor_update
on storage.objects for update to authenticated
using (bucket_id = 'content-images' and public.is_editor())
with check (bucket_id = 'content-images' and public.is_editor());

drop policy if exists content_images_admin_delete on storage.objects;
create policy content_images_admin_delete
on storage.objects for delete to authenticated
using (bucket_id = 'content-images' and public.is_admin());
