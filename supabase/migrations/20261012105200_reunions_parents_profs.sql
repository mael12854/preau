-- Réunions parents-profs : une réunion (jour, plage, classes), des créneaux par professeur, des réservations des familles.
-- Contraintes en base : un créneau = une réservation ; un seul créneau par professeur et par enfant ;
-- jamais deux créneaux qui se chevauchent pour un même parent ni pour un même professeur.
create extension if not exists btree_gist with schema extensions;

create table public.parent_meetings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id),
  title text not null check (char_length(title) between 1 and 120),
  day date not null,
  starts time not null,
  ends time not null check (ends > starts),
  slot_minutes smallint not null default 10 check (slot_minutes between 5 and 60),
  cancel_hours smallint not null default 24 check (cancel_hours between 0 and 168),
  open boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.parent_meeting_classes (
  meeting_id uuid not null references public.parent_meetings (id),
  class_id uuid not null references public.classes (id),
  primary key (meeting_id, class_id)
);

create table public.meeting_slots (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.parent_meetings (id),
  teacher_id uuid not null references public.profiles (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  place text check (place is null or char_length(place) <= 80),
  visio_url text check (visio_url is null or visio_url ~ '^https://'),
  removed boolean not null default false,
  constraint meeting_slots_no_overlap exclude using gist (teacher_id with =, tstzrange(starts_at, ends_at) with &&) where (not removed)
);
create index on public.meeting_slots (meeting_id, teacher_id);

create table public.meeting_bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.meeting_slots (id),
  meeting_id uuid not null references public.parent_meetings (id),
  teacher_id uuid not null references public.profiles (id),
  student_id uuid not null references public.students (profile_id),
  parent_id uuid not null references public.profiles (id),
  during tstzrange not null,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles (id),
  constraint meeting_bookings_parent_no_overlap exclude using gist (parent_id with =, during with &&) where (cancelled_at is null)
);
create unique index meeting_bookings_slot_active on public.meeting_bookings (slot_id) where cancelled_at is null;
create unique index meeting_bookings_teacher_student on public.meeting_bookings (meeting_id, teacher_id, student_id) where cancelled_at is null;
create index on public.meeting_bookings (parent_id);

-- ── Qui voit quoi ─────────────────────────────────────────────────
-- Enfants suivis par la personne connectée (responsable).
create or replace function private.my_children() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select g.student_id from public.guardians g where g.guardian_id = private.me()
$$;

-- La famille a un enfant dans une classe de la réunion.
create or replace function private.meeting_family(p_meeting uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.my_children() c(id) join public.parent_meeting_classes mc on mc.meeting_id = p_meeting
                 where private.in_class(c.id, mc.class_id))
$$;

-- Le professeur a cet élève (une de ses classes, ou titulaire).
create or replace function private.teacher_has_student(p_teacher uuid, p_student uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.teachings t where t.teacher_id = p_teacher and private.in_class(p_student, t.class_id))
      or exists (select 1 from public.classes c where c.teacher_id = p_teacher and private.in_class(p_student, c.id))
      or exists (select 1 from public.lessons l where l.teacher_id = p_teacher and private.in_class(p_student, l.class_id))
$$;

create or replace function private.meeting_staff(p_meeting uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.parent_meetings m where m.id = p_meeting and m.school_id = private.my_school()
                 and private.my_kind() in ('prof', 'cpe', 'direction', 'secretariat'))
$$;

alter table public.parent_meetings enable row level security;
alter table public.parent_meeting_classes enable row level security;
alter table public.meeting_slots enable row level security;
alter table public.meeting_bookings enable row level security;
create policy "réunions : personnel de l'école et familles concernées" on public.parent_meetings for select to authenticated
  using ((select private.meeting_staff(id)) or (select private.meeting_family(id)));
create policy "classes de la réunion : comme la réunion" on public.parent_meeting_classes for select to authenticated
  using ((select private.meeting_staff(meeting_id)) or (select private.meeting_family(meeting_id)));
create policy "créneaux : professeur, administration, familles concernées" on public.meeting_slots for select to authenticated
  using (teacher_id = (select private.me())
      or ((select private.is_admin_staff()) and (select private.meeting_staff(meeting_id)))
      or (not removed and exists (select 1 from private.my_children() c(id) join public.parent_meeting_classes mc on mc.meeting_id = meeting_slots.meeting_id
                                  where private.in_class(c.id, mc.class_id) and private.teacher_has_student(meeting_slots.teacher_id, c.id))));
create policy "réservations : professeur, administration, famille de l'élève" on public.meeting_bookings for select to authenticated
  using (teacher_id = (select private.me())
      or ((select private.is_admin_staff()) and (select private.meeting_staff(meeting_id)))
      or (select private.is_family_of(student_id)));
revoke all on public.parent_meetings, public.parent_meeting_classes, public.meeting_slots, public.meeting_bookings from anon;
revoke insert, update on public.parent_meetings, public.parent_meeting_classes, public.meeting_slots, public.meeting_bookings from authenticated;

-- ── Notifications (messages Préau + e-mail via la file d'envoi existante) ─
create or replace function private.notify_meeting(p_booking uuid, p_cancelled boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare b record; v_when text; v_id uuid; v_actor uuid := private.me();
begin
  select mb.*, m.school_id, m.title, st.display_name as student_name, t.display_name as teacher_name,
         par.display_name as parent_name, s.place, s.visio_url, s.starts_at
    into b
    from public.meeting_bookings mb join public.parent_meetings m on m.id = mb.meeting_id
    join public.meeting_slots s on s.id = mb.slot_id
    join public.profiles st on st.id = mb.student_id join public.profiles t on t.id = mb.teacher_id
    join public.profiles par on par.id = mb.parent_id
   where mb.id = p_booking;
  v_when := to_char(b.starts_at at time zone 'Europe/Paris', 'DD/MM à HH24"h"MI')
            || coalesce(' · ' || b.place, '') || coalesce(' · visio : ' || b.visio_url, '');
  -- Au professeur.
  if b.teacher_id <> v_actor then
    insert into public.messages (school_id, sender_id, subject, body)
    values (b.school_id, coalesce(v_actor, b.parent_id),
      case when p_cancelled then 'Rendez-vous annulé · ' else 'Rendez-vous réservé · ' end || b.student_name,
      'Bonjour,' || E'\n\n' || case when p_cancelled then 'Le rendez-vous suivant est annulé : ' else 'Nouveau rendez-vous : ' end
      || b.title || ', le ' || v_when || ', avec ' || b.parent_name || ' pour ' || b.student_name || '.')
    returning id into v_id;
    insert into public.message_recipients (message_id, recipient_id) values (v_id, b.teacher_id);
  end if;
  -- Aux responsables de l'élève.
  insert into public.messages (school_id, sender_id, subject, body)
  values (b.school_id, b.teacher_id,
    case when p_cancelled then 'Rendez-vous annulé · ' else 'Rendez-vous confirmé · ' end || b.teacher_name,
    'Bonjour,' || E'\n\n' || case when p_cancelled then 'Le rendez-vous suivant est annulé : ' else 'Votre rendez-vous est confirmé : ' end
    || b.title || ', le ' || v_when || ', avec ' || b.teacher_name || ' pour ' || b.student_name || '.'
    || case when p_cancelled then '' else E'\n\n' || 'Retrouvez votre parcours dans Préau : Réunions parents-profs.' end)
  returning id into v_id;
  insert into public.message_recipients (message_id, recipient_id)
  select v_id, g.guardian_id from public.guardians g where g.student_id = b.student_id and g.guardian_id <> b.teacher_id
  on conflict do nothing;
end $$;

-- ── Fonctions ─────────────────────────────────────────────────────
-- Créer une réunion : administration, ou professeur pour des classes où il enseigne.
create or replace function public.create_parent_meeting(
  p_title text, p_day date, p_starts time, p_ends time, p_slot_minutes smallint, p_cancel_hours smallint, p_classes uuid[])
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if private.me() is null or private.my_kind() not in ('prof', 'cpe', 'direction', 'secretariat') then
    raise exception 'Réservé au personnel' using errcode = '42501';
  end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'Donnez un titre à la réunion.'; end if;
  if p_day is null or p_starts is null or p_ends is null or p_ends <= p_starts then raise exception 'Indiquez le jour et la plage horaire.'; end if;
  if p_day < current_date then raise exception 'La réunion ne peut pas être dans le passé.'; end if;
  if coalesce(cardinality(p_classes), 0) = 0 then raise exception 'Choisissez au moins une classe.'; end if;
  if exists (select 1 from unnest(p_classes) c(id) left join public.classes k on k.id = c.id
             where k.id is null or k.school_id <> private.my_school()
                or (not private.is_admin_staff() and not private.teaches_class(c.id))) then
    raise exception 'Classe introuvable, ou que vous n''enseignez pas.' using errcode = '42501';
  end if;
  insert into public.parent_meetings (school_id, title, day, starts, ends, slot_minutes, cancel_hours, created_by)
  values (private.my_school(), left(trim(p_title), 120), p_day, p_starts, p_ends,
          coalesce(p_slot_minutes, 10), coalesce(p_cancel_hours, 24), private.me())
  returning id into v_id;
  insert into public.parent_meeting_classes (meeting_id, class_id) select distinct v_id, c from unnest(p_classes) c;
  return v_id;
end $$;

create or replace function public.set_parent_meeting_open(p_meeting uuid, p_open boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.parent_meetings set open = coalesce(p_open, false)
   where id = p_meeting and school_id = private.my_school() and (private.is_admin_staff() or created_by = private.me());
  if not found then raise exception 'Réunion introuvable' using errcode = '42501'; end if;
end $$;

-- Ouvrir ses créneaux : la plage choisie (dans celle de la réunion) découpée en créneaux de la durée de la réunion.
-- Les créneaux qui chevaucheraient un créneau existant du professeur sont sautés.
create or replace function public.open_meeting_slots(p_meeting uuid, p_from time, p_to time, p_place text, p_visio_url text)
returns integer language plpgsql security definer set search_path = '' as $$
declare m public.parent_meetings; t time; v_n integer := 0; v_visio text := nullif(trim(coalesce(p_visio_url, '')), '');
begin
  select * into m from public.parent_meetings where id = p_meeting;
  if m.id is null or m.school_id <> private.my_school() or private.my_kind() <> 'prof' then
    raise exception 'Réunion introuvable' using errcode = '42501';
  end if;
  if not exists (select 1 from public.parent_meeting_classes mc where mc.meeting_id = p_meeting and private.teaches_class(mc.class_id)) then
    raise exception 'Vous n''enseignez dans aucune classe de cette réunion.' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_to <= p_from or p_from < m.starts or p_to > m.ends then
    raise exception 'Choisissez une plage comprise entre % et %.', to_char(m.starts, 'HH24:MI'), to_char(m.ends, 'HH24:MI');
  end if;
  if v_visio is not null and v_visio !~ '^https://' then raise exception 'Le lien de visio doit commencer par https://'; end if;
  t := p_from;
  while t + make_interval(mins => m.slot_minutes) <= p_to loop
    begin
      insert into public.meeting_slots (meeting_id, teacher_id, starts_at, ends_at, place, visio_url)
      values (p_meeting, private.me(), (m.day + t) at time zone 'Europe/Paris',
              (m.day + t + make_interval(mins => m.slot_minutes)) at time zone 'Europe/Paris',
              nullif(left(trim(coalesce(p_place, '')), 80), ''), v_visio);
      v_n := v_n + 1;
    exception when exclusion_violation then null;
    end;
    t := t + make_interval(mins => m.slot_minutes);
  end loop;
  return v_n;
end $$;

-- Retirer un créneau (le professeur) : la réservation éventuelle est annulée et la famille prévenue.
create or replace function public.close_meeting_slot(p_slot uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_b uuid;
begin
  if not exists (select 1 from public.meeting_slots where id = p_slot and teacher_id = private.me() and not removed) then
    raise exception 'Créneau introuvable' using errcode = '42501';
  end if;
  update public.meeting_bookings set cancelled_at = now(), cancelled_by = private.me()
   where slot_id = p_slot and cancelled_at is null returning id into v_b;
  if v_b is not null then perform private.notify_meeting(v_b, true); end if;
  update public.meeting_slots set removed = true where id = p_slot;
end $$;

-- Réserver (responsable de l'élève). Les doublons et chevauchements sont refusés par les contraintes de la table.
create or replace function public.book_meeting_slot(p_slot uuid, p_student uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare s public.meeting_slots; m public.parent_meetings; v_id uuid;
begin
  if private.me() is null or not exists (select 1 from public.guardians g where g.guardian_id = private.me() and g.student_id = p_student) then
    raise exception 'Seul un responsable de l''élève peut réserver.' using errcode = '42501';
  end if;
  select * into s from public.meeting_slots where id = p_slot and not removed;
  select * into m from public.parent_meetings where id = s.meeting_id;
  if s.id is null or m.id is null then raise exception 'Créneau introuvable' using errcode = '42501'; end if;
  if not m.open then raise exception 'Les réservations sont fermées pour cette réunion.'; end if;
  if s.starts_at <= now() then raise exception 'Ce créneau est passé.'; end if;
  if not exists (select 1 from public.parent_meeting_classes mc where mc.meeting_id = m.id and private.in_class(p_student, mc.class_id)) then
    raise exception 'Cette réunion ne concerne pas la classe de votre enfant.';
  end if;
  if not private.teacher_has_student(s.teacher_id, p_student) then
    raise exception 'Ce professeur n''enseigne pas à votre enfant.';
  end if;
  begin
    insert into public.meeting_bookings (slot_id, meeting_id, teacher_id, student_id, parent_id, during)
    values (s.id, m.id, s.teacher_id, p_student, private.me(), tstzrange(s.starts_at, s.ends_at))
    returning id into v_id;
  exception
    when unique_violation then
      if exists (select 1 from public.meeting_bookings where slot_id = s.id and cancelled_at is null) then
        raise exception 'Ce créneau vient d''être réservé par une autre famille.';
      end if;
      raise exception 'Vous avez déjà un rendez-vous avec ce professeur pour cet enfant.';
    when exclusion_violation then
      raise exception 'Vous avez déjà un rendez-vous à cette heure-là.';
  end;
  perform private.notify_meeting(v_id, false);
  return v_id;
end $$;

-- Annuler : un responsable de l'élève jusqu'au délai de la réunion ; le professeur ou l'administration à tout moment.
create or replace function public.cancel_meeting_booking(p_booking uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare b public.meeting_bookings; m public.parent_meetings; v_family boolean;
begin
  select * into b from public.meeting_bookings where id = p_booking and cancelled_at is null;
  select * into m from public.parent_meetings where id = b.meeting_id;
  if b.id is null then raise exception 'Rendez-vous introuvable' using errcode = '42501'; end if;
  v_family := exists (select 1 from public.guardians g where g.guardian_id = private.me() and g.student_id = b.student_id);
  if not (v_family or b.teacher_id = private.me() or (private.is_admin_staff() and m.school_id = private.my_school())) then
    raise exception 'Rendez-vous introuvable' using errcode = '42501';
  end if;
  if v_family and b.teacher_id <> private.me() and now() > lower(b.during) - make_interval(hours => m.cancel_hours) then
    raise exception 'Trop tard pour annuler en ligne (moins de % h avant) : prévenez le professeur par message.', m.cancel_hours;
  end if;
  update public.meeting_bookings set cancelled_at = now(), cancelled_by = private.me() where id = p_booking;
  perform private.notify_meeting(p_booking, true);
end $$;

-- Tableau d'une réunion pour la personne connectée : créneaux libres / pris / à moi (familles), planning (professeur).
create or replace function public.meeting_board(p_meeting uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare m public.parent_meetings;
begin
  select * into m from public.parent_meetings where id = p_meeting;
  if m.id is null or not (private.meeting_staff(p_meeting) or private.meeting_family(p_meeting)) then
    raise exception 'Réunion introuvable' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'meeting', jsonb_build_object('id', m.id, 'title', m.title, 'day', m.day, 'starts', to_char(m.starts, 'HH24:MI'),
      'ends', to_char(m.ends, 'HH24:MI'), 'slot_minutes', m.slot_minutes, 'cancel_hours', m.cancel_hours, 'open', m.open,
      'mine', m.created_by = private.me(),
      'classes', (select jsonb_agg(c.name order by c.name) from public.parent_meeting_classes mc join public.classes c on c.id = mc.class_id where mc.meeting_id = m.id)),
    -- Professeur : ses créneaux et qui vient.
    'my_slots', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', s.id, 'starts_at', s.starts_at, 'ends_at', s.ends_at, 'place', s.place, 'visio_url', s.visio_url,
        'booking', (select jsonb_build_object('id', b.id, 'student', st.display_name, 'parent', pa.display_name)
                    from public.meeting_bookings b join public.profiles st on st.id = b.student_id join public.profiles pa on pa.id = b.parent_id
                    where b.slot_id = s.id and b.cancelled_at is null))
        order by s.starts_at), '[]')
      from public.meeting_slots s where s.meeting_id = m.id and s.teacher_id = private.me() and not s.removed),
    -- Familles : pour chaque enfant concerné, ses professeurs et leurs créneaux.
    'children', (select coalesce(jsonb_agg(jsonb_build_object(
        'student_id', ch.id, 'name', sp.display_name,
        'teachers', (select coalesce(jsonb_agg(jsonb_build_object(
            'teacher_id', tp.id, 'name', tp.display_name,
            'slots', (select coalesce(jsonb_agg(jsonb_build_object(
                'id', s.id, 'starts_at', s.starts_at, 'ends_at', s.ends_at, 'place', s.place, 'visio_url', s.visio_url,
                'state', case when exists (select 1 from public.meeting_bookings b where b.slot_id = s.id and b.cancelled_at is null and b.student_id = ch.id) then 'mine'
                              when exists (select 1 from public.meeting_bookings b where b.slot_id = s.id and b.cancelled_at is null) then 'taken'
                              else 'free' end) order by s.starts_at), '[]')
              from public.meeting_slots s where s.meeting_id = m.id and s.teacher_id = tp.id and not s.removed)
          ) order by tp.display_name), '[]')
          from public.profiles tp
          where tp.id in (select s.teacher_id from public.meeting_slots s where s.meeting_id = m.id and not s.removed)
            and private.teacher_has_student(tp.id, ch.id))
      ) order by sp.display_name), '[]')
      from private.my_children() ch(id) join public.profiles sp on sp.id = ch.id
      where exists (select 1 from public.parent_meeting_classes mc where mc.meeting_id = m.id and private.in_class(ch.id, mc.class_id))),
    -- Parcours de la famille (ses enfants), trié par heure.
    'my_bookings', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', b.id, 'starts_at', s.starts_at, 'ends_at', s.ends_at, 'place', s.place, 'visio_url', s.visio_url,
        'teacher', t.display_name, 'student', st.display_name,
        'can_cancel', now() <= s.starts_at - make_interval(hours => m.cancel_hours)) order by s.starts_at), '[]')
      from public.meeting_bookings b join public.meeting_slots s on s.id = b.slot_id
      join public.profiles t on t.id = b.teacher_id join public.profiles st on st.id = b.student_id
      where b.meeting_id = m.id and b.cancelled_at is null and b.student_id in (select private.my_children()))
  );
end $$;

do $$ declare f text; begin
  foreach f in array array[
    'create_parent_meeting(text, date, time, time, smallint, smallint, uuid[])', 'set_parent_meeting_open(uuid, boolean)',
    'open_meeting_slots(uuid, time, time, text, text)', 'close_meeting_slot(uuid)',
    'book_meeting_slot(uuid, uuid)', 'cancel_meeting_booking(uuid)', 'meeting_board(uuid)']
  loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
grant execute on function private.my_children() to authenticated;
grant execute on function private.meeting_family(uuid) to authenticated;
grant execute on function private.teacher_has_student(uuid, uuid) to authenticated;
grant execute on function private.meeting_staff(uuid) to authenticated;
revoke all on function private.notify_meeting(uuid, boolean) from public, anon, authenticated;
