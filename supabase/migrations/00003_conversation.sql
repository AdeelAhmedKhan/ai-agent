-- Conversation management — normalized messages + per-call summary
-- Industry-agnostic; no domain-specific columns.

-- Messages ---------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls (id) on delete cascade,
  role text not null,
  content text not null default '',
  intent text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists messages_call_id_idx on public.messages (call_id);
create index if not exists messages_occurred_at_idx on public.messages (occurred_at);
create index if not exists messages_call_id_occurred_at_idx on public.messages (call_id, occurred_at);

-- Call summary (one row per call) ----------------------------------------
create table if not exists public.call_summary (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null unique references public.calls (id) on delete cascade,
  summary text not null,
  intent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists call_summary_call_id_idx on public.call_summary (call_id);

drop trigger if exists call_summary_set_updated_at on public.call_summary;
create trigger call_summary_set_updated_at
  before update on public.call_summary
  for each row execute function public.set_updated_at();

-- RLS (defense-in-depth; server uses service role) -----------------------
alter table public.messages enable row level security;
alter table public.call_summary enable row level security;
