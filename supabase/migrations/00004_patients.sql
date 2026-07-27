-- Patient registration demographics (synthetic data only — not real PHI)

create table if not exists public.patients (
  patient_id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  sex text not null,
  phone_number text not null,
  email text,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text not null,
  zip_code text not null,
  insurance_provider text,
  insurance_member_id text,
  preferred_language text not null default 'English',
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  constraint patients_first_name_len check (char_length(first_name) between 1 and 50),
  constraint patients_last_name_len check (char_length(last_name) between 1 and 50),
  constraint patients_dob_not_future check (date_of_birth <= (timezone('utc', now()))::date),
  constraint patients_sex_check check (
    sex in ('Male', 'Female', 'Other', 'Decline to Answer')
  ),
  constraint patients_phone_digits check (phone_number ~ '^[0-9]{10}$'),
  constraint patients_city_len check (char_length(city) between 1 and 100),
  constraint patients_state_check check (
    state in (
      'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
      'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
      'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
      'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
      'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
    )
  ),
  constraint patients_zip_check check (zip_code ~ '^[0-9]{5}(-[0-9]{4})?$'),
  constraint patients_emergency_phone_digits check (
    emergency_contact_phone is null or emergency_contact_phone ~ '^[0-9]{10}$'
  )
);

create unique index if not exists patients_active_phone_uidx
  on public.patients (phone_number)
  where deleted_at is null;

create index if not exists patients_last_name_idx on public.patients (last_name);
create index if not exists patients_dob_idx on public.patients (date_of_birth);
create index if not exists patients_phone_idx on public.patients (phone_number);
create index if not exists patients_deleted_at_idx on public.patients (deleted_at);

drop trigger if exists patients_set_updated_at on public.patients;
create trigger patients_set_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();

alter table public.patients enable row level security;

-- Seed synthetic demo patients (idempotent by phone)
insert into public.patients (
  first_name, last_name, date_of_birth, sex, phone_number, email,
  address_line_1, address_line_2, city, state, zip_code,
  insurance_provider, insurance_member_id, preferred_language,
  emergency_contact_name, emergency_contact_phone
)
select *
from (
  values
    (
      'Jane', 'Doe', '1990-05-15'::date, 'Female', '4155550101', 'jane.doe@example.com',
      '123 Market St', 'Apt 4B', 'San Francisco', 'CA', '94105',
      'Example Health', 'MEM12345', 'English',
      'John Doe', '4155550199'
    ),
    (
      'John', 'Smith', '1985-11-02'::date, 'Male', '2125550142', null::text,
      '456 Broadway', null::text, 'New York', 'NY', '10013-1234',
      null::text, null::text, 'English',
      null::text, null::text
    )
) as v(
  first_name, last_name, date_of_birth, sex, phone_number, email,
  address_line_1, address_line_2, city, state, zip_code,
  insurance_provider, insurance_member_id, preferred_language,
  emergency_contact_name, emergency_contact_phone
)
where not exists (
  select 1 from public.patients p
  where p.phone_number = v.phone_number and p.deleted_at is null
);

-- Pivot default agent to patient registration tools + prompt
update public.agents
set
  name = 'Patient Registration Agent',
  system_prompt_key = 'system/patient-registration',
  metadata = jsonb_set(
    coalesce(metadata, '{}'::jsonb),
    '{description}',
    '"Voice intake agent for U.S. patient demographic registration"'::jsonb
  )
where slug = 'default';

delete from public.agent_tools
where agent_id in (select id from public.agents where slug = 'default');

insert into public.agent_tools (agent_id, tool_name, config)
select a.id, t.tool_name, '{}'::jsonb
from public.agents a
cross join (
  values
    ('lookup_patient_by_phone'),
    ('register_patient'),
    ('update_patient'),
    ('schedule_appointment')
) as t(tool_name)
where a.slug = 'default'
on conflict (agent_id, tool_name) do nothing;
