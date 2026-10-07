-- Add the editorial workflow while keeping published for backwards compatibility.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['lecturas', 'reflexiones', 'santos', 'oraciones', 'articulos'] loop
    execute format('alter table public.%I add column if not exists status text not null default ''draft''', table_name);
    execute format('alter table public.%I add column if not exists scheduled_at timestamptz', table_name);
    execute format('update public.%I set status = case when published then ''published'' else ''draft'' end where status is null or status = ''draft'' and published = true', table_name);
    execute format('alter table public.%I drop constraint if exists %I', table_name, table_name || '_status_check');
    execute format('alter table public.%I add constraint %I check (status in (''draft'', ''review'', ''scheduled'', ''published'', ''archived''))', table_name, table_name || '_status_check');
    execute format('alter table public.%I drop constraint if exists %I', table_name, table_name || '_scheduled_at_check');
    execute format('alter table public.%I add constraint %I check (status <> ''scheduled'' or scheduled_at is not null)', table_name, table_name || '_scheduled_at_check');
    execute format('create index if not exists %I on public.%I (status, scheduled_at)', table_name || '_status_schedule_idx', table_name);

    execute format('drop policy if exists %I on public.%I', table_name || '_public_read', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_author_insert', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_author_update', table_name);
    execute format(
      'create policy %I on public.%I for select using (status = ''published'' and published = true or public.is_editor() or (public.is_author() and created_by = auth.uid()))',
      table_name || '_public_read',
      table_name
    );
    execute format(
      'create policy %I on public.%I for insert with check (public.is_author() and created_by = auth.uid() and status = ''draft'')',
      table_name || '_author_insert',
      table_name
    );
    execute format(
      'create policy %I on public.%I for update using (public.is_author() and created_by = auth.uid() and status = ''draft'') with check (public.is_author() and created_by = auth.uid() and status = ''draft'')',
      table_name || '_author_update',
      table_name
    );
  end loop;
end $$;

create or replace function public.sync_content_publication_fields()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' then
    new.published = true;
    new.published_at = coalesce(new.published_at, now());
    new.scheduled_at = null;
  elsif new.status = 'scheduled' then
    new.published = false;
    new.published_at = null;
  else
    new.published = false;
    new.published_at = null;
    if new.status <> 'scheduled' then
      new.scheduled_at = null;
    end if;
  end if;
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['lecturas', 'reflexiones', 'santos', 'oraciones', 'articulos'] loop
    execute format('drop trigger if exists %I on public.%I', table_name || '_publication_fields', table_name);
    execute format(
      'create trigger %I before insert or update of status, scheduled_at, published on public.%I for each row execute function public.sync_content_publication_fields()',
      table_name || '_publication_fields',
      table_name
    );
  end loop;
end $$;
