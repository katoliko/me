-- Add the author role and ownership-aware policies without changing existing content data.
alter table public.user_roles
  drop constraint if exists user_roles_role_check;

alter table public.user_roles
  add constraint user_roles_role_check check (role in ('admin', 'editor', 'author'));

create or replace function public.is_author()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'author', false)
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['lecturas', 'reflexiones', 'santos', 'oraciones', 'articulos'] loop
    execute format('alter table public.%I add column if not exists created_by uuid references auth.users(id) on delete set null', table_name);
    execute format('alter table public.%I add column if not exists updated_by uuid references auth.users(id) on delete set null', table_name);
    execute format('create index if not exists %I on public.%I (created_by)', table_name || '_created_by_idx', table_name);

    execute format('drop policy if exists %I on public.%I', table_name || '_public_read', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_editor_write', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_author_insert', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_author_update', table_name);

    execute format(
      'create policy %I on public.%I for select using (published = true or public.is_editor() or (public.is_author() and created_by = auth.uid()))',
      table_name || '_public_read',
      table_name
    );
    execute format(
      'create policy %I on public.%I for all using (public.is_editor()) with check (public.is_editor())',
      table_name || '_editor_write',
      table_name
    );
    execute format(
      'create policy %I on public.%I for insert with check (public.is_author() and created_by = auth.uid() and published = false)',
      table_name || '_author_insert',
      table_name
    );
    execute format(
      'create policy %I on public.%I for update using (public.is_author() and created_by = auth.uid() and published = false) with check (public.is_author() and created_by = auth.uid() and published = false)',
      table_name || '_author_update',
      table_name
    );
  end loop;
end $$;

drop policy if exists content_images_author_insert on storage.objects;
create policy content_images_author_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'content-images' and public.is_author());
