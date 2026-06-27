-- Supabase/PostgREST security hardening.
-- Prisma db push does not manage row level security, so run this SQL when setting up a new database.

alter table public."Event" enable row level security;
alter table public."User" enable row level security;
alter table public."Volunteer" enable row level security;
alter table public."VolunteerRequest" enable row level security;