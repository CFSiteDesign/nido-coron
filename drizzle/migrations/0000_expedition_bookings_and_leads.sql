-- Palawan Expedition: bookings with timed seat holds, and "get the dates" leads.
-- Both tables are server-only: RLS on with no policies, so the browser (anon /
-- authenticated) can neither read nor write them. The site's server functions
-- use the service role.

create table public.expedition_bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  departure_id text not null check (char_length(departure_id) between 1 and 40),
  direction text not null check (direction in ('elnido-coron', 'coron-elnido')),
  departure_date date not null,
  guests integer not null check (guests between 1 and 20),
  full_name text not null check (char_length(full_name) between 2 and 80),
  email text not null check (char_length(email) between 3 and 200),
  whatsapp text null check (whatsapp is null or char_length(whatsapp) <= 32),
  amount_php integer not null check (amount_php >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'expired', 'cancelled', 'refunded')),
  hold_expires_at timestamptz not null,
  stripe_session_id text null unique,
  stripe_payment_intent_id text null,
  paid_at timestamptz null
);

create index expedition_bookings_departure_status_idx
  on public.expedition_bookings (departure_id, status);
create index expedition_bookings_payment_intent_idx
  on public.expedition_bookings (stripe_payment_intent_id);

alter table public.expedition_bookings enable row level security;
revoke all on public.expedition_bookings from anon, authenticated;
grant all on public.expedition_bookings to service_role;

create or replace function public.expedition_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger expedition_bookings_touch_updated_at
  before update on public.expedition_bookings
  for each row execute function public.expedition_touch_updated_at();

create table public.expedition_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text null check (email is null or char_length(email) between 3 and 200),
  whatsapp text null check (whatsapp is null or char_length(whatsapp) <= 32),
  interest text not null default 'either'
    check (interest in ('either', 'elnido-coron', 'coron-elnido')),
  constraint expedition_leads_has_contact check (email is not null or whatsapp is not null)
);

create unique index expedition_leads_email_key
  on public.expedition_leads (lower(email)) where email is not null;

alter table public.expedition_leads enable row level security;
revoke all on public.expedition_leads from anon, authenticated;
grant all on public.expedition_leads to service_role;

-- Holds p_guests seats on a departure and returns the new booking id, or null
-- when the departure can't fit them. Paid bookings and unexpired pending holds
-- count as taken. A per-departure advisory lock serialises concurrent
-- checkouts, so the last seats can never be sold twice.
create or replace function public.reserve_expedition_seats(
  p_departure_id text,
  p_direction text,
  p_departure_date date,
  p_guests integer,
  p_capacity integer,
  p_full_name text,
  p_email text,
  p_whatsapp text,
  p_amount_php integer,
  p_hold_until timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_taken integer;
  v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('expedition:' || p_departure_id));

  select coalesce(sum(guests), 0) into v_taken
  from public.expedition_bookings
  where departure_id = p_departure_id
    and (status = 'paid' or (status = 'pending' and hold_expires_at > now()));

  if v_taken + p_guests > p_capacity then
    return null;
  end if;

  insert into public.expedition_bookings (
    departure_id, direction, departure_date, guests, full_name, email,
    whatsapp, amount_php, hold_expires_at
  )
  values (
    p_departure_id, p_direction, p_departure_date, p_guests, p_full_name, p_email,
    nullif(btrim(p_whatsapp), ''), p_amount_php, p_hold_until
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.reserve_expedition_seats(
  text, text, date, integer, integer, text, text, text, integer, timestamptz
) from public, anon, authenticated;
grant execute on function public.reserve_expedition_seats(
  text, text, date, integer, integer, text, text, text, integer, timestamptz
) to service_role;