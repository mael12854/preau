-- Primaire : un seul enseignant (le titulaire) pour toutes les matières de la classe.

alter table public.classes add column teacher_id uuid references public.profiles (id) on delete set null;
comment on column public.classes.teacher_id is 'Primaire : enseignant titulaire, qui fait toutes les matières de la classe.';

-- Matières enseignées au primaire.
create table public.primary_subjects (subject_id text primary key references public.subjects (id));
alter table public.primary_subjects enable row level security;
revoke all on public.primary_subjects from anon;
revoke insert, update, delete, truncate on public.primary_subjects from authenticated;
grant select on public.primary_subjects to authenticated;
create policy "matières du primaire" on public.primary_subjects for select to authenticated using (true);
insert into public.primary_subjects values ('fr'), ('ma'), ('qlm'), ('en'), ('eps'), ('ap'), ('mu') on conflict do nothing;

-- Une affectation dans une classe de primaire doit être celle du titulaire.
create or replace function private.check_primary_teaching() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_class public.classes;
begin
  select * into v_class from public.classes where id = new.class_id;
  if v_class.level = 'primaire' and v_class.teacher_id is not null and new.teacher_id <> v_class.teacher_id then
    raise exception 'En primaire, le même enseignant fait toutes les matières de la classe.';
  end if;
  return new;
end $$;
create trigger teachings_primary_teacher before insert or update on public.teachings
  for each row execute function private.check_primary_teaching();

-- Nommer le titulaire rattache toutes les matières du primaire à cet enseignant.
create or replace function private.sync_primary_teacher() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.level = 'primaire' and new.teacher_id is not null then
    insert into public.teachings (class_id, subject_id, teacher_id, is_head_teacher)
    select new.id, ps.subject_id, new.teacher_id, true from public.primary_subjects ps
    on conflict (class_id, subject_id) do update set teacher_id = excluded.teacher_id, is_head_teacher = true;
  end if;
  return new;
end $$;
create trigger classes_primary_teacher after insert or update of teacher_id, level on public.classes
  for each row execute function private.sync_primary_teacher();

-- Le titulaire enseigne dans sa classe (droits de lecture et d'écriture correspondants).
create or replace function private.teaches_class(p_class uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.teachings t where t.class_id = p_class and t.teacher_id = private.me())
      or exists (select 1 from public.lessons l where l.class_id = p_class and l.teacher_id = private.me())
      or exists (select 1 from public.classes c where c.id = p_class and c.teacher_id = private.me())
$$;
