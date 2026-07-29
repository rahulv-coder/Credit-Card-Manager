-- ============================================================
-- SPLIT GROUPS (Splitwise-like feature)
-- Run this in your Supabase SQL Editor to enable Split Groups
-- ============================================================

-- ── Tables ───────────────────────────────────────────────────

create table if not exists public.split_groups (
  id           uuid          primary key default gen_random_uuid(),
  name         text          not null,
  description  text          not null default '',
  invite_code  text          unique not null,
  created_by   uuid          not null references auth.users(id) on delete cascade,
  created_at   bigint        not null,
  is_archived  boolean       not null default false
);

create table if not exists public.split_group_members (
  id           uuid   primary key default gen_random_uuid(),
  group_id     uuid   not null references public.split_groups(id) on delete cascade,
  user_id      uuid   not null references auth.users(id) on delete cascade,
  display_name text   not null,
  role         text   not null default 'member',
  joined_at    bigint not null,
  unique(group_id, user_id)
);

create table if not exists public.split_expenses (
  id                uuid          primary key default gen_random_uuid(),
  group_id          uuid          not null references public.split_groups(id) on delete cascade,
  paid_by_member_id uuid          not null references public.split_group_members(id) on delete cascade,
  paid_by_name      text          not null,
  description       text          not null,
  amount            decimal(12,2) not null,
  category          text          not null default 'Other',
  date              bigint        not null,
  split_type        text          not null default 'equal',
  created_at        bigint        not null
);

create table if not exists public.split_expense_splits (
  id          uuid          primary key default gen_random_uuid(),
  expense_id  uuid          not null references public.split_expenses(id) on delete cascade,
  group_id    uuid          not null references public.split_groups(id) on delete cascade,
  member_id   uuid          not null references public.split_group_members(id) on delete cascade,
  member_name text          not null,
  amount      decimal(12,2) not null,
  is_settled  boolean       not null default false
);

create table if not exists public.split_settlements (
  id             uuid          primary key default gen_random_uuid(),
  group_id       uuid          not null references public.split_groups(id) on delete cascade,
  from_member_id uuid          not null references public.split_group_members(id),
  from_name      text          not null,
  to_member_id   uuid          not null references public.split_group_members(id),
  to_name        text          not null,
  amount         decimal(12,2) not null,
  date           bigint        not null,
  notes          text          not null default '',
  created_at     bigint        not null
);

-- ── Row Level Security ────────────────────────────────────────

alter table public.split_groups         enable row level security;
alter table public.split_group_members  enable row level security;
alter table public.split_expenses       enable row level security;
alter table public.split_expense_splits enable row level security;
alter table public.split_settlements    enable row level security;

-- split_groups: any authenticated user can read (needed for invite-code join + member reads)
create policy "auth_read_groups"     on public.split_groups for select using (auth.uid() is not null);
create policy "auth_insert_group"    on public.split_groups for insert with check (auth.uid() = created_by);
create policy "creator_update_group" on public.split_groups for update using (auth.uid() = created_by);
create policy "creator_delete_group" on public.split_groups for delete using (auth.uid() = created_by);

-- split_group_members: simple non-recursive SELECT (avoids infinite-loop RLS bug)
create policy "members_view_members" on public.split_group_members for select using (auth.uid() is not null);
create policy "users_join_group"     on public.split_group_members for insert with check (auth.uid() = user_id);
create policy "users_leave_group"    on public.split_group_members for delete using (auth.uid() = user_id);

-- split_expenses
create policy "members_view_expenses"   on public.split_expenses for select using (exists (select 1 from public.split_group_members where group_id = split_expenses.group_id   and user_id = auth.uid()));
create policy "members_add_expenses"    on public.split_expenses for insert with check (exists (select 1 from public.split_group_members where group_id = split_expenses.group_id   and user_id = auth.uid()));
create policy "members_delete_expenses" on public.split_expenses for delete using (exists (select 1 from public.split_group_members m where m.id = split_expenses.paid_by_member_id and m.user_id = auth.uid()));

-- split_expense_splits
create policy "members_view_splits"   on public.split_expense_splits for select using (exists (select 1 from public.split_group_members where group_id = split_expense_splits.group_id and user_id = auth.uid()));
create policy "members_add_splits"    on public.split_expense_splits for insert with check (exists (select 1 from public.split_group_members where group_id = split_expense_splits.group_id and user_id = auth.uid()));
create policy "members_delete_splits" on public.split_expense_splits for delete using (exists (select 1 from public.split_group_members where group_id = split_expense_splits.group_id and user_id = auth.uid()));

-- split_settlements
create policy "members_view_settlements"   on public.split_settlements for select using (exists (select 1 from public.split_group_members where group_id = split_settlements.group_id and user_id = auth.uid()));
create policy "members_add_settlements"    on public.split_settlements for insert with check (exists (select 1 from public.split_group_members where group_id = split_settlements.group_id and user_id = auth.uid()));
create policy "members_delete_settlements" on public.split_settlements for delete using (from_member_id in (select id from public.split_group_members where user_id = auth.uid()));
