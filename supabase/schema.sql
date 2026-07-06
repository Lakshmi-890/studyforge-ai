-- =====================================================
-- StudyForge AI — Full Database Schema
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================================================
-- PROFILES
-- =====================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  membership_tier text not null default 'free' check (membership_tier in ('free', 'pro', 'premium')),
  streak_count int not null default 0,
  total_focus_mins int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  -- Create free membership
  insert into public.memberships (user_id, tier) values (new.id, 'free');
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================
-- MEMBERSHIPS
-- =====================================================
create table if not exists public.memberships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'pro', 'premium')),
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);
alter table public.memberships enable row level security;
create policy "Users can view own membership" on public.memberships for select using (auth.uid() = user_id);
create policy "Users can update own membership" on public.memberships for update using (auth.uid() = user_id);

-- =====================================================
-- STUDY PLANS
-- =====================================================
create table if not exists public.study_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  subjects text,
  exam_date text,
  study_hours text,
  target_score text,
  weak_topics text,
  plan_json jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.study_plans enable row level security;
create policy "Users can manage own study plans" on public.study_plans for all using (auth.uid() = user_id);

-- =====================================================
-- STUDY SESSIONS (Pomodoro + Scheduled)
-- =====================================================
create table if not exists public.study_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.study_plans(id) on delete set null,
  title text not null,
  subject text,
  session_type text default 'pomodoro' check (session_type in ('pomodoro', 'planned', 'free')),
  duration_mins int not null default 25,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.study_sessions enable row level security;
create policy "Users can manage own sessions" on public.study_sessions for all using (auth.uid() = user_id);

-- =====================================================
-- TASKS
-- =====================================================
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  subject text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  due_date date,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tasks enable row level security;
create policy "Users can manage own tasks" on public.tasks for all using (auth.uid() = user_id);

-- =====================================================
-- MATERIALS (Uploaded files)
-- =====================================================
create table if not exists public.materials (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  file_size_bytes bigint,
  mime_type text,
  extracted_text text,
  summary text,
  processing_status text default 'pending' check (processing_status in ('pending', 'processing', 'done', 'error')),
  created_at timestamptz not null default now()
);
alter table public.materials enable row level security;
create policy "Users can manage own materials" on public.materials for all using (auth.uid() = user_id);

-- =====================================================
-- FLASHCARDS
-- =====================================================
create table if not exists public.flashcards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid references public.materials(id) on delete cascade,
  question text not null,
  answer text not null,
  difficulty text default 'medium',
  last_reviewed timestamptz,
  created_at timestamptz not null default now()
);
alter table public.flashcards enable row level security;
create policy "Users can manage own flashcards" on public.flashcards for all using (auth.uid() = user_id);

-- =====================================================
-- QUIZZES
-- =====================================================
create table if not exists public.quizzes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid references public.materials(id) on delete cascade,
  title text not null,
  questions_json jsonb not null default '[]',
  created_at timestamptz not null default now()
);
alter table public.quizzes enable row level security;
create policy "Users can manage own quizzes" on public.quizzes for all using (auth.uid() = user_id);

-- =====================================================
-- ANALYTICS (One row per user per day)
-- =====================================================
create table if not exists public.analytics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  study_hours numeric(4,2) not null default 0,
  focus_mins int not null default 0,
  tasks_completed int not null default 0,
  sessions_completed int not null default 0,
  productivity_score int not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);
alter table public.analytics enable row level security;
create policy "Users can manage own analytics" on public.analytics for all using (auth.uid() = user_id);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'warning', 'success', 'reminder')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "Users can manage own notifications" on public.notifications for all using (auth.uid() = user_id);

-- =====================================================
-- CHAT HISTORY (AI Tutor)
-- =====================================================
create table if not exists public.chat_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  messages_json jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);
alter table public.chat_history enable row level security;
create policy "Users can manage own chat history" on public.chat_history for all using (auth.uid() = user_id);

-- =====================================================
-- STORAGE BUCKET for Materials
-- =====================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materials',
  'materials',
  false,
  52428800, -- 50MB max
  array['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) on conflict (id) do nothing;

-- RLS for storage
create policy "Users can upload own materials" on storage.objects
  for insert with check (bucket_id = 'materials' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own materials" on storage.objects
  for select using (bucket_id = 'materials' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own materials" on storage.objects
  for delete using (bucket_id = 'materials' and auth.uid()::text = (storage.foldername(name))[1]);
