-- Run this in the Supabase SQL editor
-- Note: If you already have the cards table, run the migration below:
-- ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS billing_cycle_day integer NOT NULL DEFAULT 1;
-- ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS payment_due_days integer NOT NULL DEFAULT 20;

create table if not exists public.cards (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  card_number text not null,
  card_holder text not null,
  expiry_date text not null,
  issuer text not null,
  custom_bank_name text,
  credit_limit numeric not null,
  current_balance numeric not null default 0,
  color text not null,
  billing_cycle_day integer not null default 1,
  payment_due_days integer not null default 20,
  created_at bigint not null
);

create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null references public.cards(id) on delete cascade,
  amount numeric not null,
  description text not null,
  category text not null,
  date bigint not null,
  type text not null check (type in ('debit', 'credit'))
);

create table if not exists public.loans (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  principal numeric not null,
  current_amount numeric not null,
  interest_rate numeric not null,
  tenure_months integer not null,
  start_date bigint not null,
  end_date bigint not null,
  created_at bigint not null
);

create table if not exists public.emis (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  loan_id text not null references public.loans(id) on delete cascade,
  emi_amount numeric not null,
  due_date bigint not null,
  is_paid boolean not null default false,
  paid_date bigint,
  created_at bigint not null
);

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  gender text not null check (gender in ('male', 'female')),
  mobile text not null,
  created_at bigint not null,
  updated_at bigint not null
);

create table if not exists public.monthly_budgets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly_salary numeric not null default 0,
  updated_at bigint not null
);

create table if not exists public.lendings (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  person_name text not null,
  phone text not null default '',
  original_amount numeric not null,
  remaining_amount numeric not null,
  purpose text not null default '',
  lent_date bigint not null,
  due_date bigint,
  repayment_type text not null check (repayment_type in ('full', 'installment')),
  monthly_amount numeric,
  monthly_due_day integer,
  notes text not null default '',
  created_at bigint not null
);

create table if not exists public.lending_payments (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  lending_id text not null references public.lendings(id) on delete cascade,
  amount numeric not null,
  date bigint not null,
  notes text not null default '',
  created_at bigint not null
);

create index if not exists idx_cards_user_id on public.cards(user_id);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_loans_user_id on public.loans(user_id);
create index if not exists idx_emis_user_id on public.emis(user_id);
create index if not exists idx_user_profiles_email on public.user_profiles(email);
create index if not exists idx_lendings_user_id on public.lendings(user_id);
create index if not exists idx_lending_payments_user_id on public.lending_payments(user_id);
create index if not exists idx_lending_payments_lending_id on public.lending_payments(lending_id);

alter table public.cards enable row level security;
alter table public.transactions enable row level security;
alter table public.loans enable row level security;
alter table public.emis enable row level security;
alter table public.user_profiles enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.lendings enable row level security;
alter table public.lending_payments enable row level security;

drop policy if exists "cards_owner_all" on public.cards;
create policy "cards_owner_all" on public.cards for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "transactions_owner_all" on public.transactions;
create policy "transactions_owner_all" on public.transactions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "loans_owner_all" on public.loans;
create policy "loans_owner_all" on public.loans for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "emis_owner_all" on public.emis;
create policy "emis_owner_all" on public.emis for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_profiles_owner_all" on public.user_profiles;
create policy "user_profiles_owner_all" on public.user_profiles for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "monthly_budgets_owner_all" on public.monthly_budgets;
create policy "monthly_budgets_owner_all" on public.monthly_budgets for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "lendings_owner_all" on public.lendings;
create policy "lendings_owner_all" on public.lendings for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "lending_payments_owner_all" on public.lending_payments;
create policy "lending_payments_owner_all" on public.lending_payments for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
