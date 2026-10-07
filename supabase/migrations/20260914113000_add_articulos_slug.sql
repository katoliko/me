-- Add stable, readable URLs without deleting or changing article content.
alter table public.articulos
  add column if not exists slug text;

create or replace function public.articulos_slugify(value text)
returns text
language sql
immutable
strict
as $$
  select trim(both '-' from regexp_replace(
    regexp_replace(
      lower(translate(value, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')),
      '[^a-z0-9]+',
      '-',
      'g'
    ),
    '(^-|-$)',
    '',
    'g'
  ));
$$;

with normalized as (
  select
    id,
    coalesce(nullif(public.articulos_slugify(titulo), ''), 'articulo') as base_slug
  from public.articulos
),
numbered as (
  select
    id,
    base_slug,
    row_number() over (partition by base_slug order by id) as duplicate_number,
    count(*) over (partition by base_slug) as duplicate_count
  from normalized
)
update public.articulos as articulos
set slug = case
  when numbered.duplicate_count = 1 then numbered.base_slug
  else numbered.base_slug || '-' || numbered.duplicate_number
end
from numbered
where articulos.id = numbered.id
  and articulos.slug is null;

create unique index if not exists articulos_slug_key
  on public.articulos (slug);

alter table public.articulos
  alter column slug set not null;
