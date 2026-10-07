-- Indexes supporting administrative filtering, pagination, and trash lookups.
create index if not exists articulos_admin_listing_idx
  on public.articulos (deleted_at, status, updated_at desc, id desc);
create index if not exists lecturas_admin_listing_idx
  on public.lecturas (deleted_at, status, updated_at desc, id desc);
create index if not exists reflexiones_admin_listing_idx
  on public.reflexiones (deleted_at, status, updated_at desc, id desc);
create index if not exists santos_admin_listing_idx
  on public.santos (deleted_at, status, updated_at desc, id desc);
create index if not exists oraciones_admin_listing_idx
  on public.oraciones (deleted_at, status, updated_at desc, id desc);
