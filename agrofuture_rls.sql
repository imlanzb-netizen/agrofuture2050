-- AGROFUTURE 2050 - RLS POLICIES

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
    where public.farm_plans.id = public.farm_plan_items.farm_plan_id
      and public.farm_plans.user_id = auth.uid()
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
    where public.farm_plans.id = public.farm_plan_items.farm_plan_id
      and public.farm_plans.user_id = auth.uid()
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
    where public.farm_plans.id = public.farm_plan_items.farm_plan_id
      and public.farm_plans.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.farm_plans
    where public.farm_plans.id = public.farm_plan_items.farm_plan_id
      and public.farm_plans.user_id = auth.uid()
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
    where public.farm_plans.id = public.farm_plan_items.farm_plan_id
      and public.farm_plans.user_id = auth.uid()
  )
);
