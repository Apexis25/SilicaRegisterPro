-- ═══════════════════════════════════════════════════════════════════════════
-- SilicaRegister Pro — Initial Database Schema
-- ═══════════════════════════════════════════════════════════════════════════
-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── ORGANISATIONS ─────────────────────────────────────────────────────────
-- Each paying customer is an organisation (PCBU)
create table public.organisations (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  abn           text,
  address       text,
  logo_url      text,
  plan          text not null default 'founding_beta'
                  check (plan in ('founding_beta','starter','growth','pro')),
  plan_status   text not null default 'active'
                  check (plan_status in ('active','trialing','past_due','canceled')),
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  trial_ends_at  timestamptz,
  max_workers    int not null default 50,   -- Growth default
  max_sites      int not null default 5,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── PROFILES ──────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with role and org membership
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  organisation_id uuid references public.organisations(id) on delete cascade,
  full_name       text,
  role            text not null default 'admin'
                    check (role in ('owner','admin','supervisor')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── SITES ─────────────────────────────────────────────────────────────────
create table public.sites (
  id              uuid primary key default uuid_generate_v4(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name            text not null,
  address         text,
  principal_contractor text,
  project_number  text,
  is_active       boolean not null default true,
  qr_token        text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── WORKERS ───────────────────────────────────────────────────────────────
create table public.workers (
  id              uuid primary key default uuid_generate_v4(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  full_name       text not null,
  role_trade      text not null,
  employer        text,                -- subcontractor company name
  phone           text,
  email           text,
  is_active       boolean not null default true,
  notes           text,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Worker ↔ Site assignments (many-to-many)
create table public.worker_sites (
  worker_id  uuid not null references public.workers(id) on delete cascade,
  site_id    uuid not null references public.sites(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (worker_id, site_id)
);

-- ── EXPOSURE EVENTS ───────────────────────────────────────────────────────
-- Every QR check-in or manually logged silica exposure event
create table public.exposure_events (
  id              uuid primary key default uuid_generate_v4(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  worker_id       uuid not null references public.workers(id) on delete restrict,
  site_id         uuid not null references public.sites(id) on delete restrict,
  task_activity   text not null,   -- e.g. 'Concrete grinding'
  rpe_type        text,            -- e.g. 'P2 half-face respirator'
  controls_used   text[],          -- e.g. ['wet_cutting','lev','signage']
  check_in_at     timestamptz not null default now(),
  check_out_at    timestamptz,
  duration_hours  numeric(5,2),    -- computed on check-out or manual entry
  logged_via      text not null default 'qr'
                    check (logged_via in ('qr','manual','supervisor')),
  logged_by       uuid references public.profiles(id),
  notes           text,
  created_at      timestamptz not null default now()
);

-- ── FIT TESTS ─────────────────────────────────────────────────────────────
create table public.fit_tests (
  id              uuid primary key default uuid_generate_v4(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  worker_id       uuid not null references public.workers(id) on delete restrict,
  rpe_type        text not null,
  rpe_model       text,
  test_date       date not null,
  fit_factor      numeric(6,2),
  result          text not null check (result in ('pass','fail','exempt_papr')),
  provider        text,            -- testing organisation
  next_due_date   date,
  certificate_url text,            -- Supabase Storage path
  added_by        uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── MONITORING UPLOADS ────────────────────────────────────────────────────
-- Air monitoring results stored in Supabase Storage
create table public.monitoring_uploads (
  id              uuid primary key default uuid_generate_v4(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  site_id         uuid references public.sites(id) on delete set null,
  description     text not null,
  file_name       text not null,
  file_url        text not null,   -- Supabase Storage public URL
  file_type       text,            -- 'pdf','xlsx','docx', etc.
  file_size_bytes bigint,
  monitoring_date date,
  provider        text,            -- hygienist / lab
  result_summary  text,
  uploaded_by     uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);

-- ── SITE CONTROLS ─────────────────────────────────────────────────────────
-- Controls in place at each site (for audit pack Site Controls Checklist)
create table public.site_controls (
  id              uuid primary key default uuid_generate_v4(),
  site_id         uuid not null references public.sites(id) on delete cascade,
  control_type    text not null,   -- e.g. 'wet_cutting', 'lev', 'enclosure'
  status          text not null default 'yes'
                    check (status in ('yes','no','na')),
  notes           text,
  updated_by      uuid references public.profiles(id),
  updated_at      timestamptz not null default now()
);

-- ── AUDIT LOG ─────────────────────────────────────────────────────────────
-- Immutable append-only audit trail (Pro plan)
create table public.audit_log (
  id              uuid primary key default uuid_generate_v4(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id         uuid references public.profiles(id),
  action          text not null,   -- 'create','update','delete'
  table_name      text not null,
  record_id       uuid,
  old_values      jsonb,
  new_values      jsonb,
  ip_address      inet,
  created_at      timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════════════════

-- Fit-test status per worker (used in dashboard and audit pack)
create or replace view public.worker_fit_test_status as
select
  w.id as worker_id,
  w.full_name,
  w.organisation_id,
  ft.id as fit_test_id,
  ft.rpe_type,
  ft.test_date,
  ft.next_due_date,
  ft.result,
  case
    when ft.result = 'exempt_papr'          then 'exempt'
    when ft.next_due_date is null           then 'no_record'
    when ft.next_due_date < current_date    then 'overdue'
    when ft.next_due_date < current_date + interval '30 days' then 'expiring_soon'
    else 'current'
  end as status
from public.workers w
left join lateral (
  select * from public.fit_tests f
  where f.worker_id = w.id
  order by f.test_date desc
  limit 1
) ft on true;

-- Exposure summary per worker (used in audit pack)
create or replace view public.worker_exposure_summary as
select
  e.worker_id,
  e.organisation_id,
  count(*)               as total_events,
  sum(e.duration_hours)  as total_hours,
  max(e.check_in_at)     as last_exposure
from public.exposure_events e
group by e.worker_id, e.organisation_id;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.organisations       enable row level security;
alter table public.profiles            enable row level security;
alter table public.sites               enable row level security;
alter table public.workers             enable row level security;
alter table public.worker_sites        enable row level security;
alter table public.exposure_events     enable row level security;
alter table public.fit_tests           enable row level security;
alter table public.monitoring_uploads  enable row level security;
alter table public.site_controls       enable row level security;
alter table public.audit_log           enable row level security;

-- Helper: get current user's org id
create or replace function public.my_org_id()
returns uuid language sql security definer stable as $$
  select organisation_id from public.profiles where id = auth.uid()
$$;

-- Helper: is user in org?
create or replace function public.is_in_org(org_id uuid)
returns boolean language sql security definer stable as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and organisation_id = org_id
  )
$$;

-- Organisations: members can read their own org
create policy "members_read_org" on public.organisations
  for select using (public.is_in_org(id));

create policy "owner_update_org" on public.organisations
  for update using (
    exists(select 1 from public.profiles where id = auth.uid()
           and organisation_id = organisations.id and role = 'owner')
  );

-- Profiles: own row readable; same-org rows readable by admins
create policy "own_profile" on public.profiles
  for select using (id = auth.uid() or organisation_id = public.my_org_id());

create policy "own_profile_update" on public.profiles
  for update using (id = auth.uid());

-- Sites
create policy "org_members_read_sites" on public.sites
  for select using (organisation_id = public.my_org_id());

create policy "org_admins_write_sites" on public.sites
  for all using (organisation_id = public.my_org_id());

-- Workers
create policy "org_members_read_workers" on public.workers
  for select using (organisation_id = public.my_org_id());

create policy "org_admins_write_workers" on public.workers
  for all using (organisation_id = public.my_org_id());

-- Worker sites
create policy "org_members_read_worker_sites" on public.worker_sites
  for select using (
    exists(select 1 from public.workers w where w.id = worker_id and w.organisation_id = public.my_org_id())
  );

create policy "org_admins_write_worker_sites" on public.worker_sites
  for all using (
    exists(select 1 from public.workers w where w.id = worker_id and w.organisation_id = public.my_org_id())
  );

-- Exposure events
create policy "org_members_read_events" on public.exposure_events
  for select using (organisation_id = public.my_org_id());

create policy "org_admins_write_events" on public.exposure_events
  for all using (organisation_id = public.my_org_id());

-- Fit tests
create policy "org_members_read_fit_tests" on public.fit_tests
  for select using (organisation_id = public.my_org_id());

create policy "org_admins_write_fit_tests" on public.fit_tests
  for all using (organisation_id = public.my_org_id());

-- Monitoring uploads
create policy "org_members_read_monitoring" on public.monitoring_uploads
  for select using (organisation_id = public.my_org_id());

create policy "org_admins_write_monitoring" on public.monitoring_uploads
  for all using (organisation_id = public.my_org_id());

-- Site controls
create policy "org_members_read_controls" on public.site_controls
  for select using (
    exists(select 1 from public.sites s where s.id = site_id and s.organisation_id = public.my_org_id())
  );

create policy "org_admins_write_controls" on public.site_controls
  for all using (
    exists(select 1 from public.sites s where s.id = site_id and s.organisation_id = public.my_org_id())
  );

-- Audit log: read-only for org members
create policy "org_members_read_audit_log" on public.audit_log
  for select using (organisation_id = public.my_org_id());

-- PUBLIC: QR check-in — sites are findable by qr_token (no auth needed)
-- We use a service role API route to handle this securely

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Auto-compute duration on check-out
create or replace function public.compute_exposure_duration()
returns trigger language plpgsql as $$
begin
  if NEW.check_out_at is not null and OLD.check_out_at is null then
    NEW.duration_hours := round(
      extract(epoch from (NEW.check_out_at - NEW.check_in_at)) / 3600.0,
      2
    );
  end if;
  return NEW;
end;
$$;

create trigger set_exposure_duration
  before update on public.exposure_events
  for each row execute function public.compute_exposure_duration();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin NEW.updated_at = now(); return NEW; end;
$$;

create trigger set_workers_updated_at     before update on public.workers     for each row execute function public.set_updated_at();
create trigger set_sites_updated_at       before update on public.sites       for each row execute function public.set_updated_at();
create trigger set_fit_tests_updated_at   before update on public.fit_tests   for each row execute function public.set_updated_at();
create trigger set_orgs_updated_at        before update on public.organisations for each row execute function public.set_updated_at();
create trigger set_profiles_updated_at    before update on public.profiles    for each row execute function public.set_updated_at();

-- Auto-create profile on user signup (via Supabase Auth trigger)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (NEW.id, NEW.raw_user_meta_data->>'full_name');
  return NEW;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════
create index idx_workers_org           on public.workers(organisation_id);
create index idx_sites_org             on public.sites(organisation_id);
create index idx_sites_qr_token        on public.sites(qr_token);
create index idx_exposure_org          on public.exposure_events(organisation_id);
create index idx_exposure_worker       on public.exposure_events(worker_id);
create index idx_exposure_site         on public.exposure_events(site_id);
create index idx_exposure_check_in     on public.exposure_events(check_in_at desc);
create index idx_fit_tests_org         on public.fit_tests(organisation_id);
create index idx_fit_tests_worker      on public.fit_tests(worker_id);
create index idx_fit_tests_due         on public.fit_tests(next_due_date);
create index idx_monitoring_org        on public.monitoring_uploads(organisation_id);
create index idx_audit_log_org         on public.audit_log(organisation_id);
create index idx_audit_log_created     on public.audit_log(created_at desc);
