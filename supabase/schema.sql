-- Run this once in the Supabase SQL Editor for the project configured in this app.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  interview_type text not null check (
    interview_type in ('Technical Interview', 'HR Interview', 'Behavioral Interview', 'General Interview')
  ),
  role text not null,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  score integer check (score between 0 and 100),
  strengths text[] not null default '{}',
  improvements text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews (id) on delete cascade,
  question text not null,
  answer text not null default '',
  feedback text,
  score integer check (score between 0 and 100),
  position integer not null check (position >= 0),
  unique (interview_id, position)
);

create index if not exists interviews_user_created_idx
  on public.interviews (user_id, created_at desc);
create index if not exists interview_questions_interview_position_idx
  on public.interview_questions (interview_id, position);

alter table public.profiles enable row level security;
alter table public.interviews enable row level security;
alter table public.interview_questions enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "Users can read their own interviews" on public.interviews;
create policy "Users can read their own interviews"
  on public.interviews for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can create their own interviews" on public.interviews;
create policy "Users can create their own interviews"
  on public.interviews for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can update their own interviews" on public.interviews;
create policy "Users can update their own interviews"
  on public.interviews for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their own interviews" on public.interviews;
create policy "Users can delete their own interviews"
  on public.interviews for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can read their own interview questions" on public.interview_questions;
create policy "Users can read their own interview questions"
  on public.interview_questions for select to authenticated
  using (
    exists (
      select 1 from public.interviews i
      where i.id = interview_id and i.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can create their own interview questions" on public.interview_questions;
create policy "Users can create their own interview questions"
  on public.interview_questions for insert to authenticated
  with check (
    exists (
      select 1 from public.interviews i
      where i.id = interview_id and i.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can update their own interview questions" on public.interview_questions;
create policy "Users can update their own interview questions"
  on public.interview_questions for update to authenticated
  using (
    exists (
      select 1 from public.interviews i
      where i.id = interview_id and i.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.interviews i
      where i.id = interview_id and i.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can delete their own interview questions" on public.interview_questions;
create policy "Users can delete their own interview questions"
  on public.interview_questions for delete to authenticated
  using (
    exists (
      select 1 from public.interviews i
      where i.id = interview_id and i.user_id = (select auth.uid())
    )
  );

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.interviews to authenticated;
grant select, insert, update, delete on public.interview_questions to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
