-- Reference schema for the future live market; NOT used by the D1 demo.
-- Apply in a dedicated Supabase project and verify policies before enabling.
create table public.profiles (
 id uuid primary key references auth.users(id),
 role text not null default 'PRODUCER' check(role in ('PRODUCER','BUYER','ADMIN')),
 active boolean not null default true,
 name text not null, city text not null
);
create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from profiles where id=auth.uid() and role='ADMIN' and active);
$$;
create function public.active_role(wanted text) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from profiles where id=auth.uid() and role=wanted and active);
$$;
create table public.harvests (
 id uuid primary key default gen_random_uuid(), owner uuid not null references profiles(id),
 product text not null, variety text not null default '', total numeric not null check(total>0),
 available numeric not null check(available>0 and available<=total), cost numeric not null check(cost>=0),
 minimum_price numeric not null check(minimum_price>0), start_date date not null, end_date date not null,
 active boolean not null default true, check(end_date>=start_date)
);
create table public.demands (
 id uuid primary key default gen_random_uuid(), owner uuid not null references profiles(id),
 product text not null, variety text not null default '', quantity numeric not null check(quantity>0),
 price numeric not null check(price>0), partial boolean not null,
 start_date date not null,end_date date not null,expires date not null,active boolean not null default true,
 check(end_date>=start_date)
);
create table public.price_bands(product text primary key,minimum_price numeric not null check(minimum_price>0),maximum_price numeric not null check(maximum_price>=minimum_price));
-- Eligibility must be produced by a trusted server using current commercial and route data.
create table public.authorized_matches(id uuid primary key default gen_random_uuid(),harvest uuid references harvests(id),demand uuid references demands(id),producer uuid references profiles(id),buyer uuid references profiles(id),valid_until timestamptz not null);
create table public.interests(id uuid primary key default gen_random_uuid(),match_id uuid not null references authorized_matches(id),producer uuid not null references profiles(id),created_at timestamptz default now(),unique(match_id,producer));
create table public.private_contacts(owner uuid primary key references profiles(id),contact text not null,exact_address text not null);
alter table profiles enable row level security;
alter table harvests enable row level security;
alter table demands enable row level security;
alter table price_bands enable row level security;
alter table authorized_matches enable row level security;
alter table interests enable row level security;
alter table private_contacts enable row level security;
create policy own_profile on profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy signup_no_admin on profiles for insert to authenticated with check(id=auth.uid() and role in ('PRODUCER','BUYER') and active=true);
-- Self updates are limited by column grants; roles and suspension are server-managed.
revoke update on profiles from authenticated;
grant update(name,city) on profiles to authenticated;
create policy update_profile on profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy own_harvests on harvests for all to authenticated using(owner=auth.uid() and public.active_role('PRODUCER') or public.is_admin()) with check(owner=auth.uid() and public.active_role('PRODUCER') or public.is_admin());
create policy own_demands on demands for all to authenticated using(owner=auth.uid() and public.active_role('BUYER') or public.is_admin()) with check(owner=auth.uid() and public.active_role('BUYER') or public.is_admin());
create policy active_demands on demands for select to authenticated using(active and expires>=current_date and public.active_role('PRODUCER'));
create policy bands_read on price_bands for select to authenticated using(true);
create policy bands_admin on price_bands for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy matches_read on authorized_matches for select to authenticated using(producer=auth.uid() or buyer=auth.uid() or public.is_admin());
-- Only service role may create matches; browsers cannot declare themselves eligible.
create policy interest_read on interests for select to authenticated using(producer=auth.uid() or exists(select 1 from authorized_matches m where m.id=match_id and m.buyer=auth.uid()) or public.is_admin());
create policy interest_insert on interests for insert to authenticated with check(producer=auth.uid() and public.active_role('PRODUCER') and exists(select 1 from authorized_matches m where m.id=match_id and m.producer=auth.uid() and m.valid_until>now()));
create policy contacts_own on private_contacts for all to authenticated using(owner=auth.uid()) with check(owner=auth.uid());
create policy contacts_authorized on private_contacts for select to authenticated using(public.is_admin() or exists(select 1 from authorized_matches m join interests i on i.match_id=m.id where m.buyer=owner and m.producer=auth.uid() and m.valid_until>now()));
