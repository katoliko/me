create table if not exists public.facebook_publications (
  publication_date date primary key,
  status text not null check (status in ('sending', 'published', 'failed')),
  facebook_post_id text,
  image_url text,
  error_message text,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

comment on table public.facebook_publications is
  'Tracks the daily Facebook Page publication result; access tokens are never stored here.';

alter table public.facebook_publications enable row level security;
revoke all on public.facebook_publications from anon, authenticated;
grant all on public.facebook_publications to service_role;
