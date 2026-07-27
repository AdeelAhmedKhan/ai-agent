-- Attach placeholder business tools to the default agent (idempotent).
insert into public.agent_tools (agent_id, tool_name, config)
select a.id, t.tool_name, '{}'::jsonb
from public.agents a
cross join (
  values
    ('echo'),
    ('health'),
    ('get_business_hours'),
    ('lookup_knowledge'),
    ('create_ticket'),
    ('schedule_appointment'),
    ('cancel_appointment'),
    ('transfer_to_human'),
    ('save_lead')
) as t(tool_name)
where a.slug = 'default'
on conflict (agent_id, tool_name) do nothing;
