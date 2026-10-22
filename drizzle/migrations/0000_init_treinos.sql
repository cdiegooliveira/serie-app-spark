create type public.app_role as enum ('admin','user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) = 'diego.oliv1025@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_created_role after insert on auth.users
for each row execute function public.handle_new_user_role();

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  exercise text not null,
  weight_kg numeric, reps int,
  speed numeric, incline numeric, duration_min numeric,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.workout_sets to authenticated;
grant all on public.workout_sets to service_role;
alter table public.workout_sets enable row level security;
create policy "own select" on public.workout_sets for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own insert" on public.workout_sets for insert to authenticated with check (user_id = auth.uid());
create policy "own delete" on public.workout_sets for delete to authenticated using (user_id = auth.uid());

create table public.premium_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  email text,
  created_at timestamptz not null default now()
);
grant select, insert on public.premium_leads to authenticated;
grant all on public.premium_leads to service_role;
alter table public.premium_leads enable row level security;
create policy "insert own lead" on public.premium_leads for insert to authenticated with check (user_id = auth.uid());
create policy "admin read leads" on public.premium_leads for select to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.exercise_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  email text,
  suggestion text not null check (char_length(suggestion) between 1 and 200),
  created_at timestamptz not null default now()
);
grant select, insert on public.exercise_suggestions to authenticated;
grant all on public.exercise_suggestions to service_role;
alter table public.exercise_suggestions enable row level security;
create policy "insert own suggestion" on public.exercise_suggestions for insert to authenticated with check (user_id = auth.uid());
create policy "admin read suggestions" on public.exercise_suggestions for select to authenticated using (public.has_role(auth.uid(),'admin'));