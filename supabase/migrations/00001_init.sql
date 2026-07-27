-- Voice AI Agent — industry-agnostic schema
-- Enable useful extensions
create extension if not exists "pgcrypto";

-- Agents -----------------------------------------------------------------
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  system_prompt_key text not null default 'system/default',
  model text,
  voice_config jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agents_is_active_idx on public.agents (is_active);

-- Agent ↔ tool mappings --------------------------------------------------
create table if not exists public.agent_tools (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents (id) on delete cascade,
  tool_name text not null,
  config jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (agent_id, tool_name)
);

create index if not exists agent_tools_agent_id_idx on public.agent_tools (agent_id);

-- Calls ------------------------------------------------------------------
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  vapi_call_id text not null unique,
  agent_id uuid references public.agents (id) on delete set null,
  status text not null default 'queued',
  direction text,
  phone_number text,
  customer_number text,
  started_at timestamptz,
  ended_at timestamptz,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calls_agent_id_idx on public.calls (agent_id);
create index if not exists calls_status_idx on public.calls (status);

-- Call events (append-only) ---------------------------------------------
create table if not exists public.call_events (
  id uuid primary key default gen_random_uuid(),
  call_id uuid references public.calls (id) on delete cascade,
  vapi_call_id text,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists call_events_call_id_idx on public.call_events (call_id);
create index if not exists call_events_vapi_call_id_idx on public.call_events (vapi_call_id);
create index if not exists call_events_type_idx on public.call_events (event_type);

-- Tool invocations -------------------------------------------------------
create table if not exists public.tool_invocations (
  id uuid primary key default gen_random_uuid(),
  call_id uuid references public.calls (id) on delete set null,
  vapi_call_id text,
  tool_name text not null,
  tool_call_id text,
  args jsonb not null default '{}'::jsonb,
  result jsonb,
  status text not null default 'pending',
  latency_ms integer,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists tool_invocations_call_id_idx on public.tool_invocations (call_id);
create index if not exists tool_invocations_tool_name_idx on public.tool_invocations (tool_name);

-- updated_at trigger -----------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists agents_set_updated_at on public.agents;
create trigger agents_set_updated_at
  before update on public.agents
  for each row execute function public.set_updated_at();

drop trigger if exists calls_set_updated_at on public.calls;
create trigger calls_set_updated_at
  before update on public.calls
  for each row execute function public.set_updated_at();

-- RLS (defense-in-depth; server uses service role) -----------------------
alter table public.agents enable row level security;
alter table public.agent_tools enable row level security;
alter table public.calls enable row level security;
alter table public.call_events enable row level security;
alter table public.tool_invocations enable row level security;

-- Seed default agent -----------------------------------------------------
insert into public.agents (slug, name, system_prompt_key, metadata)
values (
  'default',
  'Default Voice Agent',
  'system/default',
  '{"description":"Industry-agnostic default agent"}'::jsonb
)
on conflict (slug) do nothing;

insert into public.agent_tools (agent_id, tool_name, config)
select a.id, t.tool_name, '{}'::jsonb
from public.agents a
cross join (values ('echo'), ('health')) as t(tool_name)
where a.slug = 'default'
on conflict (agent_id, tool_name) do nothing;
