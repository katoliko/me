-- Add soft deletion and tighten content permissions around ownership.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['lecturas', 'reflexiones', 'santos', 'oraciones', 'articulos'] loop
    execute format('alter table public.%I add column if not exists deleted_at timestamptz', table_name);
    execute format('alter table public.%I add column if not exists deleted_by uuid references auth.users(id) on delete set null', table_name);
    execute format('create index if not exists %I on public.%I (deleted_at)', table_name || '_deleted_at_idx', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_editor_write', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_editor_insert', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_editor_update', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_editor_delete', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_admin_delete', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_public_read', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_author_insert', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_author_update', table_name);

    execute format(
      'create policy %I on public.%I for select using ((status = ''published'' and published = true and deleted_at is null) or public.is_editor() or (public.is_author() and created_by = auth.uid() and deleted_at is null))',
      table_name || '_public_read',
      table_name
    );
    execute format(
      'create policy %I on public.%I for insert with check (public.is_editor())',
      table_name || '_editor_insert',
      table_name
    );
    execute format(
      'create policy %I on public.%I for update using (public.is_editor()) with check (public.is_editor())',
      table_name || '_editor_update',
      table_name
    );
    execute format(
      'create policy %I on public.%I for delete using (public.is_admin())',
      table_name || '_admin_delete',
      table_name
    );
    execute format(
      'create policy %I on public.%I for insert with check (public.is_author() and created_by = auth.uid() and status = ''draft'' and deleted_at is null)',
      table_name || '_author_insert',
      table_name
    );
    execute format(
      'create policy %I on public.%I for update using (public.is_author() and created_by = auth.uid() and status = ''draft'' and deleted_at is null) with check (public.is_author() and created_by = auth.uid() and status = ''draft'' and deleted_at is null)',
      table_name || '_author_update',
      table_name
    );
  end loop;
end $$;
