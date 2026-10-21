-- Outils : quiz en direct (les résultats peuvent devenir une évaluation) et cartes de vocabulaire.

-- ===== Quiz =====
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  school_id uuid not null references public.schools(id),
  title text not null check (char_length(title) between 1 and 120),
  removed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id),
  position smallint not null,
  prompt text not null check (char_length(prompt) between 1 and 300),
  choices text[] not null check (cardinality(choices) between 2 and 4),
  correct smallint not null,
  seconds smallint not null default 20 check (seconds between 5 and 120),
  removed boolean not null default false
);
create table if not exists public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id),
  class_id uuid not null references public.classes(id),
  host_id uuid not null references public.profiles(id),
  status text not null default 'lobby' check (status in ('lobby', 'question', 'reveal', 'ended')),
  current smallint not null default 0,
  question_started_at timestamptz,
  assessment_id uuid references public.assessments(id),
  created_at timestamptz not null default now()
);
create table if not exists public.quiz_answers (
  session_id uuid not null references public.quiz_sessions(id),
  question_id uuid not null references public.quiz_questions(id),
  student_id uuid not null references public.profiles(id),
  choice smallint not null,
  correct boolean not null,
  ms integer not null,
  answered_at timestamptz not null default now(),
  primary key (session_id, question_id, student_id)
);
create index if not exists quiz_sessions_class_idx on public.quiz_sessions (class_id, status);

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.quiz_answers enable row level security;
-- Le professeur lit ses quiz et leurs questions ; les élèves passent par quiz_state (sans la bonne réponse).
create policy "quiz : propriétaire" on public.quizzes for select to authenticated using (owner_id = (select private.me()));
create policy "questions : propriétaire" on public.quiz_questions for select to authenticated
  using (exists (select 1 from public.quizzes q where q.id = quiz_id and q.owner_id = (select private.me())));
create policy "sessions : hôte ou classe" on public.quiz_sessions for select to authenticated
  using (host_id = (select private.me()) or (select private.in_class(private.me(), class_id)));
revoke all on public.quizzes, public.quiz_questions, public.quiz_sessions, public.quiz_answers from anon;
revoke insert, update on public.quizzes, public.quiz_questions, public.quiz_sessions, public.quiz_answers from authenticated;

-- Créer ou modifier un quiz avec ses questions : [{prompt, choices[], correct, seconds}].
create or replace function public.save_quiz(p_id uuid, p_title text, p_questions jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_me uuid := private.me(); v_id uuid := p_id; q jsonb; i int := 0; v_choices text[];
begin
  if v_me is null or private.my_kind() not in ('prof', 'direction', 'cpe') then
    raise exception 'Réservé aux professeurs' using errcode = '42501';
  end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'Donnez un titre au quiz.'; end if;
  if jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) = 0 then raise exception 'Ajoutez au moins une question.'; end if;
  if jsonb_array_length(p_questions) > 50 then raise exception '50 questions au plus.'; end if;
  if v_id is null then
    insert into public.quizzes (owner_id, school_id, title) values (v_me, private.my_school(), left(trim(p_title), 120)) returning id into v_id;
  else
    update public.quizzes set title = left(trim(p_title), 120), updated_at = now()
     where id = v_id and owner_id = v_me and not removed;
    if not found then raise exception 'Quiz introuvable' using errcode = '42501'; end if;
    update public.quiz_questions set removed = true where quiz_id = v_id;
  end if;
  for q in select * from jsonb_array_elements(p_questions) loop
    i := i + 1;
    select coalesce(array_agg(left(trim(x), 120)), '{}') into v_choices
      from jsonb_array_elements_text(q -> 'choices') x where trim(x) <> '';
    if coalesce(trim(q ->> 'prompt'), '') = '' then raise exception 'Question % : écrivez la question.', i; end if;
    if cardinality(v_choices) < 2 then raise exception 'Question % : au moins deux réponses.', i; end if;
    if cardinality(v_choices) > 4 then raise exception 'Question % : quatre réponses au plus.', i; end if;
    if coalesce((q ->> 'correct')::int, -1) not between 0 and cardinality(v_choices) - 1 then
      raise exception 'Question % : choisissez la bonne réponse.', i;
    end if;
    insert into public.quiz_questions (quiz_id, position, prompt, choices, correct, seconds)
    values (v_id, i, left(trim(q ->> 'prompt'), 300), v_choices, (q ->> 'correct')::smallint,
            least(greatest(coalesce((q ->> 'seconds')::int, 20), 5), 120));
  end loop;
  return v_id;
end $$;

create or replace function public.remove_quiz(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.quizzes set removed = true where id = p_id and owner_id = private.me();
  if not found then raise exception 'Quiz introuvable' using errcode = '42501'; end if;
end $$;

-- Lancer une partie pour une classe (le professeur enseigne dans la classe, ou administration).
create or replace function public.start_quiz_session(p_quiz uuid, p_class uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not exists (select 1 from public.quizzes where id = p_quiz and owner_id = private.me() and not removed) then
    raise exception 'Quiz introuvable' using errcode = '42501';
  end if;
  if not (private.teaches_class(p_class) or (private.is_admin_staff() and exists (
            select 1 from public.classes c where c.id = p_class and c.school_id = private.my_school()))) then
    raise exception 'Vous n''êtes pas professeur de cette classe' using errcode = '42501';
  end if;
  update public.quiz_sessions set status = 'ended' where host_id = private.me() and status <> 'ended';
  insert into public.quiz_sessions (quiz_id, class_id, host_id) values (p_quiz, p_class, private.me()) returning id into v_id;
  return v_id;
end $$;

-- L'hôte fait avancer la partie : 'next' (question suivante, ou fin), 'reveal' (afficher la réponse), 'end'.
create or replace function public.quiz_step(p_session uuid, p_action text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_s public.quiz_sessions; v_total int;
begin
  select * into v_s from public.quiz_sessions where id = p_session and host_id = private.me();
  if v_s.id is null then raise exception 'Partie introuvable' using errcode = '42501'; end if;
  select count(*) into v_total from public.quiz_questions where quiz_id = v_s.quiz_id and not removed;
  if p_action = 'reveal' and v_s.status = 'question' then
    update public.quiz_sessions set status = 'reveal' where id = p_session;
  elsif p_action = 'next' and v_s.status in ('lobby', 'reveal') then
    if v_s.current >= v_total then
      update public.quiz_sessions set status = 'ended' where id = p_session;
    else
      update public.quiz_sessions set status = 'question', current = v_s.current + 1, question_started_at = now() where id = p_session;
    end if;
  elsif p_action = 'end' then
    update public.quiz_sessions set status = 'ended' where id = p_session;
  end if;
end $$;

-- Répondre à la question en cours (élève de la classe, une seule fois, dans le temps imparti).
create or replace function public.answer_quiz(p_session uuid, p_choice smallint)
returns void language plpgsql security definer set search_path = '' as $$
declare v_me uuid := private.me(); v_s public.quiz_sessions; v_q public.quiz_questions;
begin
  select * into v_s from public.quiz_sessions where id = p_session;
  if v_s.id is null or v_me is null or not private.in_class(v_me, v_s.class_id) then
    raise exception 'Partie introuvable' using errcode = '42501';
  end if;
  if v_s.status <> 'question' then raise exception 'Les réponses sont fermées.'; end if;
  select * into v_q from public.quiz_questions where quiz_id = v_s.quiz_id and position = v_s.current and not removed;
  if now() > v_s.question_started_at + make_interval(secs => v_q.seconds + 2) then raise exception 'Temps écoulé.'; end if;
  if p_choice not between 0 and cardinality(v_q.choices) - 1 then raise exception 'Réponse invalide.'; end if;
  insert into public.quiz_answers (session_id, question_id, student_id, choice, correct, ms)
  values (p_session, v_q.id, v_me, p_choice, p_choice = v_q.correct,
          greatest(0, (extract(epoch from now() - v_s.question_started_at) * 1000)::int))
  on conflict do nothing;
end $$;

-- État de la partie pour l'hôte ou un élève de la classe. La bonne réponse n'apparaît qu'une fois révélée.
create or replace function public.quiz_state(p_session uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := private.me(); v_s public.quiz_sessions; v_q public.quiz_questions; v_host boolean; v_total int;
  v_title text; v_out jsonb;
begin
  select * into v_s from public.quiz_sessions where id = p_session;
  if v_s.id is null then raise exception 'Partie introuvable' using errcode = '42501'; end if;
  v_host := v_s.host_id = v_me;
  if not v_host and not private.in_class(v_me, v_s.class_id) then raise exception 'Partie introuvable' using errcode = '42501'; end if;
  select title into v_title from public.quizzes where id = v_s.quiz_id;
  select count(*) into v_total from public.quiz_questions where quiz_id = v_s.quiz_id and not removed;
  select * into v_q from public.quiz_questions where quiz_id = v_s.quiz_id and position = v_s.current and not removed;
  v_out := jsonb_build_object(
    'id', v_s.id, 'title', v_title, 'status', v_s.status, 'current', v_s.current, 'total', v_total,
    'host', v_host, 'classId', v_s.class_id, 'assessmentId', v_s.assessment_id,
    'remainingMs', case when v_s.status = 'question' and v_q.id is not null
      then greatest(0, (extract(epoch from (v_s.question_started_at + make_interval(secs => v_q.seconds)) - now()) * 1000)::int) end,
    'question', case when v_q.id is not null and v_s.status in ('question', 'reveal') then jsonb_build_object(
      'prompt', v_q.prompt, 'choices', to_jsonb(v_q.choices), 'seconds', v_q.seconds,
      'correct', case when v_s.status = 'reveal' then v_q.correct end,
      'counts', case when v_host or v_s.status = 'reveal' then (
        select jsonb_agg((select count(*) from public.quiz_answers a where a.session_id = v_s.id and a.question_id = v_q.id and a.choice = c.i - 1) order by c.i)
          from generate_series(1, cardinality(v_q.choices)) c(i)) end,
      'answered', (select count(*) from public.quiz_answers a where a.session_id = v_s.id and a.question_id = v_q.id),
      'mine', (select a.choice from public.quiz_answers a where a.session_id = v_s.id and a.question_id = v_q.id and a.student_id = v_me)
    ) end,
    'players', (select count(*) from (
        select s.profile_id from public.students s where s.class_id = v_s.class_id
        union select m.student_id from public.class_members m where m.class_id = v_s.class_id) x),
    -- Pas de classement : le professeur voit les résultats par ordre alphabétique, l'élève ne voit que les siens.
    'results', case when v_s.status in ('reveal', 'ended') then (
      select coalesce(jsonb_agg(r order by r.name), '[]') from (
        select p.display_name as name, a.student_id = v_me as me,
               count(*) filter (where a.correct) as points, count(*) as answered
          from public.quiz_answers a join public.profiles p on p.id = a.student_id
         where a.session_id = v_s.id and (v_host or a.student_id = v_me)
         group by p.display_name, a.student_id) r) end
  );
  return v_out;
end $$;

-- Fin de partie : les résultats deviennent une évaluation (non publiée) de la classe, dans une matière du professeur.
-- Compétences : une pastille selon le % de bonnes réponses. Notes sur 20 : le % ramené sur 20, au demi-point.
create or replace function public.quiz_to_assessment(p_session uuid, p_subject text, p_skill text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_s public.quiz_sessions; v_title text; v_total int; v_grading text; v_id uuid;
begin
  select * into v_s from public.quiz_sessions where id = p_session and host_id = private.me();
  if v_s.id is null then raise exception 'Partie introuvable' using errcode = '42501'; end if;
  if v_s.assessment_id is not null then raise exception 'Les résultats sont déjà dans une évaluation.'; end if;
  select title into v_title from public.quizzes where id = v_s.quiz_id;
  select count(*) into v_total from public.quiz_questions where quiz_id = v_s.quiz_id and not removed;
  select s.grading::text into v_grading from public.classes c join public.schools s on s.id = c.school_id where c.id = v_s.class_id;
  v_id := public.create_assessment(v_s.class_id, p_subject, 'Quiz · ' || v_title, current_date,
            (case when extract(month from current_date) >= 9 then 1 when extract(month from current_date) <= 3 then 2 else 3 end)::smallint,
            array[coalesce(nullif(trim(p_skill), ''), v_title)]);
  insert into public.assessment_results (assessment_id, student_id, level, score, skill_levels)
  select v_id, r.student_id,
         case when v_grading = 'note20' then 'NE'::public.eval_value else 'NE'::public.eval_value end,
         case when v_grading = 'note20' then round(r.pct * 40) / 2 end,
         case when v_grading = 'note20' then '{}'::public.eval_value[] else array[
           case when r.pct >= 0.9 then 'TB' when r.pct >= 0.7 then 'MS' when r.pct >= 0.4 then 'MF' else 'MI' end::public.eval_value] end
    from (select st.id as student_id,
                 coalesce((select count(*) filter (where a.correct) from public.quiz_answers a
                            where a.session_id = v_s.id and a.student_id = st.id), 0)::numeric / greatest(v_total, 1) as pct
            from (select s.profile_id as id from public.students s where s.class_id = v_s.class_id
                  union select m.student_id from public.class_members m where m.class_id = v_s.class_id) st
           where exists (select 1 from public.quiz_answers a where a.session_id = v_s.id and a.student_id = st.id)) r;
  update public.quiz_sessions set assessment_id = v_id where id = p_session;
  return v_id;
end $$;

-- ===== Cartes de vocabulaire =====
create table if not exists public.vocab_decks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  class_id uuid not null references public.classes(id),
  title text not null check (char_length(title) between 1 and 120),
  removed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.vocab_cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.vocab_decks(id),
  position smallint not null,
  front text not null check (char_length(front) between 1 and 200),
  back text not null check (char_length(back) between 1 and 200),
  removed boolean not null default false
);
create table if not exists public.vocab_progress (
  student_id uuid not null references public.profiles(id),
  card_id uuid not null references public.vocab_cards(id),
  box smallint not null default 1 check (box between 1 and 5),
  due date not null default current_date,
  reviews integer not null default 0,
  last_seen timestamptz not null default now(),
  primary key (student_id, card_id)
);
alter table public.vocab_decks enable row level security;
alter table public.vocab_cards enable row level security;
alter table public.vocab_progress enable row level security;
create policy "listes : classe ou propriétaire" on public.vocab_decks for select to authenticated
  using (not removed and (owner_id = (select private.me()) or (select private.can_see_class(class_id))));
create policy "cartes : classe ou propriétaire" on public.vocab_cards for select to authenticated
  using (not removed and exists (select 1 from public.vocab_decks d where d.id = deck_id and not d.removed
    and (d.owner_id = (select private.me()) or (select private.can_see_class(d.class_id)))));
create policy "progression : soi" on public.vocab_progress for select to authenticated using (student_id = (select private.me()));
revoke all on public.vocab_decks, public.vocab_cards, public.vocab_progress from anon;
revoke insert, update on public.vocab_decks, public.vocab_cards, public.vocab_progress from authenticated;

-- Créer ou modifier une liste : [{front, back}] (au plus 200 cartes). Les cartes inchangées gardent la progression.
create or replace function public.save_vocab_deck(p_id uuid, p_class uuid, p_title text, p_cards jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_me uuid := private.me(); v_id uuid := p_id; c jsonb; i int := 0; v_card uuid;
begin
  if v_me is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if v_id is not null then
    select class_id into p_class from public.vocab_decks where id = v_id and owner_id = v_me and not removed;
    if p_class is null then raise exception 'Liste introuvable' using errcode = '42501'; end if;
  end if;
  if not (private.teaches_class(p_class) or (private.is_admin_staff() and exists (
            select 1 from public.classes k where k.id = p_class and k.school_id = private.my_school()))) then
    raise exception 'Vous n''êtes pas professeur de cette classe' using errcode = '42501';
  end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'Donnez un titre à la liste.'; end if;
  if jsonb_typeof(p_cards) <> 'array' or jsonb_array_length(p_cards) = 0 then raise exception 'Ajoutez au moins une carte.'; end if;
  if jsonb_array_length(p_cards) > 200 then raise exception '200 cartes au plus.'; end if;
  if v_id is null then
    insert into public.vocab_decks (owner_id, class_id, title) values (v_me, p_class, left(trim(p_title), 120)) returning id into v_id;
  else
    update public.vocab_decks set title = left(trim(p_title), 120), updated_at = now() where id = v_id;
  end if;
  update public.vocab_cards set removed = true where deck_id = v_id;
  for c in select * from jsonb_array_elements(p_cards) loop
    if coalesce(trim(c ->> 'front'), '') = '' or coalesce(trim(c ->> 'back'), '') = '' then continue; end if;
    i := i + 1;
    select id into v_card from public.vocab_cards
     where deck_id = v_id and front = left(trim(c ->> 'front'), 200) and back = left(trim(c ->> 'back'), 200) limit 1;
    if v_card is null then
      insert into public.vocab_cards (deck_id, position, front, back)
      values (v_id, i, left(trim(c ->> 'front'), 200), left(trim(c ->> 'back'), 200));
    else
      update public.vocab_cards set removed = false, position = i where id = v_card;
    end if;
  end loop;
  if i = 0 then raise exception 'Ajoutez au moins une carte.'; end if;
  return v_id;
end $$;

create or replace function public.remove_vocab_deck(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.vocab_decks set removed = true where id = p_id and owner_id = private.me();
  if not found then raise exception 'Liste introuvable' using errcode = '42501'; end if;
end $$;

-- Révision (méthode des boîtes) : su → boîte suivante, revue plus tard ; à revoir → boîte 1, revue aujourd'hui.
create or replace function public.review_vocab_card(p_card uuid, p_known boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_me uuid := private.me(); v_class uuid; v_box smallint;
begin
  select d.class_id into v_class from public.vocab_cards c join public.vocab_decks d on d.id = c.deck_id
   where c.id = p_card and not c.removed and not d.removed;
  if v_class is null or v_me is null or not private.in_class(v_me, v_class) then
    raise exception 'Carte introuvable' using errcode = '42501';
  end if;
  select box into v_box from public.vocab_progress where student_id = v_me and card_id = p_card;
  v_box := case when p_known then least(coalesce(v_box, 1) + 1, 5) else 1 end;
  insert into public.vocab_progress (student_id, card_id, box, due, reviews, last_seen)
  values (v_me, p_card, v_box, current_date + (array[0, 1, 3, 7, 14])[v_box], 1, now())
  on conflict (student_id, card_id) do update
    set box = excluded.box, due = excluded.due, reviews = public.vocab_progress.reviews + 1, last_seen = now();
end $$;

-- Suivi pour le professeur : par élève de la classe, cartes sues (boîte 4 ou 5), révisées, dernière révision.
create or replace function public.vocab_deck_stats(p_deck uuid)
returns table (student_id uuid, name text, known int, seen int, total int, last_seen timestamptz)
language plpgsql stable security definer set search_path = '' as $$
declare v_d public.vocab_decks;
begin
  select * into v_d from public.vocab_decks where id = p_deck and not removed;
  if v_d.id is null or not (v_d.owner_id = private.me() or private.teaches_class(v_d.class_id) or private.is_admin_staff()) then
    raise exception 'Liste introuvable' using errcode = '42501';
  end if;
  return query
  select st.id, p.display_name,
         count(*) filter (where vp.box >= 4)::int,
         count(vp.card_id)::int,
         (select count(*) from public.vocab_cards c where c.deck_id = p_deck and not c.removed)::int,
         max(vp.last_seen)
    from (select s.profile_id as id from public.students s where s.class_id = v_d.class_id
          union select m.student_id from public.class_members m where m.class_id = v_d.class_id) st
    join public.profiles p on p.id = st.id
    left join public.vocab_progress vp on vp.student_id = st.id
         and vp.card_id in (select c.id from public.vocab_cards c where c.deck_id = p_deck and not c.removed)
   group by st.id, p.display_name order by p.display_name;
end $$;

do $$ declare f text; begin
  foreach f in array array[
    'save_quiz(uuid, text, jsonb)', 'remove_quiz(uuid)', 'start_quiz_session(uuid, uuid)', 'quiz_step(uuid, text)',
    'answer_quiz(uuid, smallint)', 'quiz_state(uuid)', 'quiz_to_assessment(uuid, text, text)',
    'save_vocab_deck(uuid, uuid, text, jsonb)', 'remove_vocab_deck(uuid)', 'review_vocab_card(uuid, boolean)', 'vocab_deck_stats(uuid)']
  loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
