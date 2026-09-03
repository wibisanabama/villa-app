create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

create type public.system_role as enum ('USER', 'SUPER_ADMIN');
create type public.booking_status as enum (
  'PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED',
  'EXPIRED', 'CANCELLATION_REQUESTED', 'CANCELLED', 'PAYMENT_REVIEW'
);
create type public.transaction_status as enum ('UNPAID', 'PAID', 'FAILED', 'EXPIRED', 'REVIEW');
create type public.transaction_kind as enum ('BOOKING', 'SUBSCRIPTION');
create type public.subscription_status as enum ('ACTIVE', 'GRACE', 'EXPIRED', 'CANCELLED');
create type public.invitation_status as enum ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
create type public.cancellation_status as enum ('REQUESTED', 'APPROVED', 'REJECTED', 'REFUNDED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone_number text,
  avatar_url text,
  system_role public.system_role not null default 'USER',
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  price bigint not null check (price >= 0),
  villa_limit integer check (villa_limit is null or villa_limit > 0),
  staff_limit integer check (staff_limit is null or staff_limit >= 0),
  features jsonb not null default '[]'::jsonb,
  is_popular boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.account_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status public.subscription_status not null default 'ACTIVE',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  grace_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index one_current_subscription_per_user on public.account_subscriptions(user_id)
  where status in ('ACTIVE', 'GRACE');

create table public.villas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  location text not null,
  price_per_night bigint not null check (price_per_night > 0),
  capacity integer not null default 2 check (capacity > 0),
  facilities jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index villas_owner_id_idx on public.villas(owner_id);
create index villas_public_search_idx on public.villas(is_active, location);

create table public.villa_memberships (
  id uuid primary key default gen_random_uuid(),
  villa_id uuid not null references public.villas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'STAFF' check (role = 'STAFF'),
  created_at timestamptz not null default now(),
  unique(villa_id, user_id)
);

create table public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  villa_id uuid not null references public.villas(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  status public.invitation_status not null default 'PENDING',
  created_by uuid not null references public.profiles(id),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  villa_id uuid not null references public.villas(id) on delete restrict,
  guest_id uuid not null references public.profiles(id) on delete restrict,
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  check_in_date date not null,
  check_out_date date not null,
  total_price bigint not null check (total_price > 0),
  status public.booking_status not null default 'PENDING_PAYMENT',
  hold_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out_date > check_in_date)
);
create index bookings_guest_idx on public.bookings(guest_id, created_at desc);
create index bookings_villa_idx on public.bookings(villa_id, check_in_date, check_out_date);
alter table public.bookings add constraint bookings_no_overlap
  exclude using gist (
    villa_id with =,
    daterange(check_in_date, check_out_date, '[)') with &&
  ) where (status in ('PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN'));

create table public.booking_cancellations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  reason text not null,
  status public.cancellation_status not null default 'REQUESTED',
  reviewed_by uuid references public.profiles(id),
  review_note text,
  refund_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index one_open_cancellation_per_booking on public.booking_cancellations(booking_id)
  where status in ('REQUESTED', 'APPROVED');

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  kind public.transaction_kind not null,
  user_id uuid not null references public.profiles(id) on delete restrict,
  booking_id uuid references public.bookings(id) on delete restrict,
  plan_id uuid references public.subscription_plans(id),
  amount bigint not null check (amount >= 0),
  mayar_invoice_id text unique,
  mayar_transaction_id text unique,
  payment_url text,
  status public.transaction_status not null default 'UNPAID',
  expires_at timestamptz,
  paid_at timestamptz,
  provider_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind = 'BOOKING' and booking_id is not null and plan_id is null)
      or (kind = 'SUBSCRIPTION' and booking_id is null and plan_id is not null))
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger plans_touch before update on public.subscription_plans for each row execute function public.touch_updated_at();
create trigger subscriptions_touch before update on public.account_subscriptions for each row execute function public.touch_updated_at();
create trigger villas_touch before update on public.villas for each row execute function public.touch_updated_at();
create trigger bookings_touch before update on public.bookings for each row execute function public.touch_updated_at();
create trigger cancellations_touch before update on public.booking_cancellations for each row execute function public.touch_updated_at();
create trigger transactions_touch before update on public.transactions for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare starter_id uuid;
begin
  insert into public.profiles(id, email, full_name)
  values(new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'Pengguna'), '@', 1)))
  on conflict (id) do nothing;
  select id into starter_id from public.subscription_plans where slug = 'starter';
  if starter_id is not null then
    insert into public.account_subscriptions(user_id, plan_id, status)
    values(new.id, starter_id, 'ACTIVE') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.create_booking_hold(
  p_villa_id uuid, p_guest_id uuid, p_guest_name text, p_guest_email text,
  p_guest_phone text, p_check_in date, p_check_out date
) returns public.bookings language plpgsql security definer set search_path = public as $$
declare selected_villa public.villas; created_booking public.bookings; nights integer;
begin
  update public.bookings set status = 'EXPIRED'
    where villa_id = p_villa_id and status = 'PENDING_PAYMENT' and hold_expires_at <= now();
  select * into selected_villa from public.villas where id = p_villa_id and is_active = true for share;
  if not found then raise exception 'VILLA_NOT_FOUND'; end if;
  nights := p_check_out - p_check_in;
  if nights <= 0 or p_check_in < current_date then raise exception 'INVALID_DATES'; end if;
  insert into public.bookings(villa_id, guest_id, guest_name, guest_email, guest_phone,
    check_in_date, check_out_date, total_price, status, hold_expires_at)
  values(p_villa_id, p_guest_id, p_guest_name, p_guest_email, p_guest_phone,
    p_check_in, p_check_out, nights * selected_villa.price_per_night,
    'PENDING_PAYMENT', now() + interval '30 minutes') returning * into created_booking;
  return created_booking;
exception when exclusion_violation then raise exception 'DATES_UNAVAILABLE';
end $$;

create or replace function public.reconcile_vilara() returns jsonb
language plpgsql security definer set search_path = public as $$
declare expired_holds integer; grace_started integer; subscriptions_expired integer;
begin
  update public.bookings set status = 'EXPIRED'
    where status = 'PENDING_PAYMENT' and hold_expires_at <= now();
  get diagnostics expired_holds = row_count;
  update public.account_subscriptions set status = 'GRACE'
    where status = 'ACTIVE' and expires_at is not null and expires_at <= now();
  get diagnostics grace_started = row_count;
  update public.account_subscriptions set status = 'EXPIRED'
    where status = 'GRACE' and grace_ends_at is not null and grace_ends_at <= now();
  get diagnostics subscriptions_expired = row_count;
  return jsonb_build_object('expired_holds', expired_holds, 'grace_started', grace_started,
    'subscriptions_expired', subscriptions_expired);
end $$;

alter table public.profiles enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.account_subscriptions enable row level security;
alter table public.villas enable row level security;
alter table public.villa_memberships enable row level security;
alter table public.staff_invitations enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_cancellations enable row level security;
alter table public.transactions enable row level security;
alter table public.audit_logs enable row level security;

create policy "plans are public" on public.subscription_plans for select using (is_active = true);
create policy "active villas are public" on public.villas for select using (is_active = true);
create policy "profiles read self" on public.profiles for select using (auth.uid() = id);
create policy "profiles update self" on public.profiles for update using (auth.uid() = id)
  with check (auth.uid() = id and system_role = (select p.system_role from public.profiles p where p.id = auth.uid()));

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp']),
  ('villa-images', 'villa-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

