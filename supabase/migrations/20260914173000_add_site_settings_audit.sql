-- Audit changes to general site configuration and homepage sections.
do $$
begin
  if to_regclass('public.site_settings') is not null then
    drop trigger if exists site_settings_audit on public.site_settings;
    create trigger site_settings_audit after insert or update or delete on public.site_settings
    for each row execute function public.record_admin_audit();
  end if;
  if to_regclass('public.homepage_sections') is not null then
    drop trigger if exists homepage_sections_audit on public.homepage_sections;
    create trigger homepage_sections_audit after insert or update or delete on public.homepage_sections
    for each row execute function public.record_admin_audit();
  end if;
end $$;
