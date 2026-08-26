create extension if not exists "pgcrypto";

create table if not exists public.user_alerts (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null,
  sender_user_id uuid,
  sender_role text,
  title text not null,
  message text not null,
  alert_type text not null default 'general',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists user_alerts_recipient_idx
  on public.user_alerts(recipient_user_id, created_at desc);

create table if not exists public.agro_calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text,
  event_type text not null default 'general',
  start_date date not null,
  end_date date,
  reminder_date date,
  is_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists agro_calendar_events_user_idx
  on public.agro_calendar_events(user_id, start_date);

create table if not exists public.farm_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  activity_type text not null default 'crop',
  crop_or_livestock text,
  season text,
  start_date date,
  end_date date,
  expected_revenue numeric(14,2) not null default 0,
  total_cost numeric(14,2) not null default 0,
  expected_profit numeric(14,2)
    generated always as (expected_revenue - total_cost) stored,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists farm_plans_user_idx
  on public.farm_plans(user_id, start_date);

create table if not exists public.farm_plan_items (
  id uuid primary key default gen_random_uuid(),
  farm_plan_id uuid not null references public.farm_plans(id) on delete cascade,
  title text not null,
  description text,
  item_type text not null default 'activity',
  planned_date date,
  quantity numeric(14,2),
  unit text,
  unit_cost numeric(14,2) not null default 0,
  total_cost numeric(14,2)
    generated always as (coalesce(quantity, 1) * unit_cost) stored,
  is_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists farm_plan_items_plan_idx
  on public.farm_plan_items(farm_plan_id, planned_date);

alter table public.user_alerts enable row level security;
alter table public.agro_calendar_events enable row level security;
alter table public.farm_plans enable row level security;
alter table public.farm_plan_items enable row level security;

-- =====================================================
-- AGROFUTURE 2050 - RLS POLICIES
-- =====================================================

-- USER ALERTS
drop policy if exists "Users can read own alerts" on public.user_alerts;
create policy "Users can read own alerts"
on public.user_alerts
for select
to authenticated
using (recipient_user_id = auth.uid());

drop policy if exists "Users can mark own alerts as read" on public.user_alerts;
create policy "Users can mark own alerts as read"
on public.user_alerts
for update
to authenticated
using (recipient_user_id = auth.uid())
with check (recipient_user_id = auth.uid());


-- AGRO CALENDAR
drop policy if exists "Users can read own calendar events" on public.agro_calendar_events;
create policy "Users can read own calendar events"
on public.agro_calendar_events
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can create own calendar events" on public.agro_calendar_events;
create policy "Users can create own calendar events"
on public.agro_calendar_events
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own calendar events" on public.agro_calendar_events;
create policy "Users can update own calendar events"
on public.agro_calendar_events
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own calendar events" on public.agro_calendar_events;
create policy "Users can delete own calendar events"
on public.agro_calendar_events
for delete
to authenticated
using (user_id = auth.uid());


-- FARM PLANS
drop policy if exists "Users can read own farm plans" on public.farm_plans;
create policy "Users can read own farm plans"
on public.farm_plans
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can create own farm plans" on public.farm_plans;
create policy "Users can create own farm plans"
on public.farm_plans
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own farm plans" on public.farm_plans;
create policy "Users can update own farm plans"
on public.farm_plans
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own farm plans" on public.farm_plans;
create policy "Users can delete own farm plans"
on public.farm_plans
for delete
to authenticated
using (user_id = auth.uid());


-- FARM PLAN ITEMS
drop policy if exists "Users can read own plan items" on public.farm_plan_items;
create policy "Users can read own plan items"
on public.farm_plan_items
for select
to authenticated
using (
  exists (
    select 1
    from public.farm_plans
    where farm_plans.id = farm_plan_items.farm_plan_id
      and farm_plans.user_id = auth.uid()
  )
);

drop policy if exists "Users can create own plan items" on public.farm_plan_items;
create policy "Users can create own plan items"
on public.farm_plan_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.farm_plans
    where farm_plans.id = farm_plan_items.farm_plan_id
      and farm_plans.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own plan items" on public.farm_plan_items;
create policy "Users can update own plan items"
on public.farm_plan_items
for update
to authenticated
using (
  exists (
    select 1
    from public.farm_plans
    where farm_plans.id = farm_plan_items.farm_plan_id
      and farm_plans.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.farm_plans
    where farm_plans.id = farm_plan_items.farm_plan_id
      and farm_plans.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own plan items" on public.farm_plan_items;
create policy "Users can delete own plan items"
on public.farm_plan_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.farm_plans
    where farm_plans.id = farm_plan_items.farm_plan_id
      and farm_plans.user_id = auth.uid()
  )
);

