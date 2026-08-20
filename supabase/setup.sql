-- ============================================================================
-- KALASROTAM — SUPABASE SETUP
-- ----------------------------------------------------------------------------
-- Run this ONCE, in your Supabase project:
--   Dashboard -> SQL Editor -> New query -> paste all of this -> Run
--
-- It is safe to run more than once; every step checks before it creates.
--
-- What it builds:
--   site_content  one row holding the whole site's content as JSON
--   leads         every enquiry and mailing-list signup
--   artwork       a public storage bucket for photographs
--
-- The security model, in one line: the public can READ content and SUBMIT an
-- enquiry; only a logged-in account can change content or read the enquiries.
-- ============================================================================


-- ── Content ────────────────────────────────────────────────────────────────
-- A single row, id = 1. The check constraint enforces that, so a stray insert
-- cannot create a second version of the site that nothing knows how to pick
-- between.

create table if not exists public.site_content (
  id         integer primary key default 1,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid        references auth.users (id) on delete set null,
  constraint site_content_single_row check (id = 1)
);

insert into public.site_content (id, data)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

alter table public.site_content enable row level security;

-- Visitors read the site. No login needed — it is a public website.
drop policy if exists "content is publicly readable" on public.site_content;
create policy "content is publicly readable"
  on public.site_content for select
  using (true);

-- Only a signed-in account may change it.
drop policy if exists "only signed-in accounts may edit content" on public.site_content;
create policy "only signed-in accounts may edit content"
  on public.site_content for update
  to authenticated
  using (true)
  with check (true);

-- Stamps who saved and when, so you can always tell what changed last.
create or replace function public.touch_site_content()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists site_content_touch on public.site_content;
create trigger site_content_touch
  before update on public.site_content
  for each row execute function public.touch_site_content();


-- ── Live updates ───────────────────────────────────────────────────────────
-- Lets open browsers receive content changes without a refresh.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'site_content'
  ) then
    alter publication supabase_realtime add table public.site_content;
  end if;
end
$$;


-- ── Leads ──────────────────────────────────────────────────────────────────
-- Commission enquiries and mailing-list signups.

create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type       text,
  name       text,
  phone      text,
  email      text,
  medium     text,
  size       text,
  budget     text,
  message    text
);

create index if not exists leads_created_at_idx
  on public.leads (created_at desc);

alter table public.leads enable row level security;

-- Anyone can submit the form. That is the entire point of a contact form.
drop policy if exists "anyone may submit an enquiry" on public.leads;
create policy "anyone may submit an enquiry"
  on public.leads for insert
  to anon, authenticated
  with check (true);

-- Only you can read them. Visitors must never be able to list other people's
-- names and phone numbers.
drop policy if exists "only signed-in accounts may read enquiries" on public.leads;
create policy "only signed-in accounts may read enquiries"
  on public.leads for select
  to authenticated
  using (true);

drop policy if exists "only signed-in accounts may delete enquiries" on public.leads;
create policy "only signed-in accounts may delete enquiries"
  on public.leads for delete
  to authenticated
  using (true);


-- ── Artwork storage ────────────────────────────────────────────────────────
-- Public bucket: the photographs are on a public website, so the files are
-- readable by anyone with the URL. Only signed-in accounts can put files in.

insert into storage.buckets (id, name, public)
values ('artwork', 'artwork', true)
on conflict (id) do update set public = true;

drop policy if exists "artwork is publicly readable" on storage.objects;
create policy "artwork is publicly readable"
  on storage.objects for select
  using (bucket_id = 'artwork');

drop policy if exists "only signed-in accounts may upload artwork" on storage.objects;
create policy "only signed-in accounts may upload artwork"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'artwork');

drop policy if exists "only signed-in accounts may replace artwork" on storage.objects;
create policy "only signed-in accounts may replace artwork"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'artwork');

drop policy if exists "only signed-in accounts may delete artwork" on storage.objects;
create policy "only signed-in accounts may delete artwork"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'artwork');


-- ── Done ───────────────────────────────────────────────────────────────────
-- Next: Authentication -> Users -> Add user, and create an account for
-- Divyansh and one for yourself. Those are the logins for /?admin=1.
--
-- Turn OFF public signups so strangers cannot create accounts:
--   Authentication -> Sign In / Providers -> Email -> disable "Allow new users
--   to sign up".
