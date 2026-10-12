-- Minutes de retard (« Retards · 24 min au total »)
alter table public.life_events add column minutes smallint check (minutes is null or minutes >= 0);
