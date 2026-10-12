-- Préau — données de démonstration (Collège Jean-Moulin, semaine du 12 octobre 2026)
-- Reprend les noms et les textes du prototype (design_handoff_preau).
-- ⚠️ Comptes de démonstration, mot de passe commun « preau-demo-2026 » :
--    à supprimer avant toute utilisation réelle.
-- Les adresses utilisent le domaine réservé .example : aucun e-mail ne peut partir.

begin;

-- Identifiants fixes, lisibles : école 0…1, classes …c…, comptes …a…, personnel …b…, élèves 4e D …d…
create temporary table ids (k text primary key, id uuid) on commit drop;
insert into ids values
  ('school', '00000000-0000-4000-8000-000000000001'),
  ('4eB', '00000000-0000-4000-8000-0000000c0001'), ('4eD', '00000000-0000-4000-8000-0000000c0002'),
  ('3eA', '00000000-0000-4000-8000-0000000c0003'), ('6eC', '00000000-0000-4000-8000-0000000c0004'),
  ('1re3', '00000000-0000-4000-8000-0000000c0005'),
  ('lea', '00000000-0000-4000-8000-0000000a0001'), ('hugo', '00000000-0000-4000-8000-0000000a0002'),
  ('sophie', '00000000-0000-4000-8000-0000000a0003'), ('durand', '00000000-0000-4000-8000-0000000a0004'),
  ('kader', '00000000-0000-4000-8000-0000000a0005'), ('lefevre', '00000000-0000-4000-8000-0000000a0006'),
  ('roux', '00000000-0000-4000-8000-0000000a0007'),
  ('petit', '00000000-0000-4000-8000-0000000b0001'), ('garnier', '00000000-0000-4000-8000-0000000b0002'),
  ('colin', '00000000-0000-4000-8000-0000000b0003'), ('ndiaye', '00000000-0000-4000-8000-0000000b0004'),
  ('roche', '00000000-0000-4000-8000-0000000b0005'), ('faure', '00000000-0000-4000-8000-0000000b0006'),
  ('ortiz', '00000000-0000-4000-8000-0000000b0007'), ('clarke', '00000000-0000-4000-8000-0000000b0008'),
  ('blanc', '00000000-0000-4000-8000-0000000b0009'), ('lemoine', '00000000-0000-4000-8000-0000000b0010'),
  ('vidal', '00000000-0000-4000-8000-0000000b0013'),
  ('viesco', '00000000-0000-4000-8000-0000000b0011'), ('secretariat-svc', '00000000-0000-4000-8000-0000000b0012');
create function pg_temp.id(k text) returns uuid language sql as $$ select id from ids where ids.k = $1 $$;

-- ── Comptes de connexion (email + mot de passe) ──
create temporary table accounts (k text, email text) on commit drop;
insert into accounts values
  ('lea', 'lea.martin@jean-moulin.example'), ('hugo', 'hugo.benali@jean-moulin.example'),
  ('sophie', 'sophie.martin@famille.example'), ('durand', 'marc.durand@jean-moulin.example'),
  ('kader', 'nadia.kader@jean-moulin.example'), ('lefevre', 'principal@jean-moulin.example'),
  ('roux', 'secretariat@jean-moulin.example');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token)
select '00000000-0000-0000-0000-000000000000', pg_temp.id(a.k), 'authenticated', 'authenticated', a.email,
  extensions.crypt('preau-demo-2026', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), '', '', '', '', '', ''
from accounts a
on conflict (id) do nothing;

insert into auth.identities (user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select pg_temp.id(a.k), pg_temp.id(a.k)::text, 'email',
  jsonb_build_object('sub', pg_temp.id(a.k)::text, 'email', a.email, 'email_verified', true), now(), now(), now()
from accounts a
on conflict do nothing;

-- ── Établissement, classes ──
insert into public.schools (id, name, domain, year_label)
values (pg_temp.id('school'), 'Collège Jean-Moulin', 'jean-moulin.preau.fr', 'Année 2026–2027');

insert into public.classes (id, school_id, name, level) values
  (pg_temp.id('4eB'), pg_temp.id('school'), '4e B', 'college'),
  (pg_temp.id('4eD'), pg_temp.id('school'), '4e D', 'college'),
  (pg_temp.id('3eA'), pg_temp.id('school'), '3e A', 'college'),
  (pg_temp.id('6eC'), pg_temp.id('school'), '6e C', 'college'),
  (pg_temp.id('1re3'), pg_temp.id('school'), '1re 3', 'lycee');

-- ── Personnes ──
insert into public.profiles (id, user_id, school_id, kind, first_name, last_name, civility, display_name, initials, role_label, title, specialities)
select pg_temp.id(k), case when k in (select k from accounts) then pg_temp.id(k) end, pg_temp.id('school'),
       kind::public.person_kind, fn, ln, civ::public.civility, dn, ini, role_label, title, spe
from (values
  ('lea', 'eleve', 'Léa', 'Martin', null, 'Léa Martin', 'LM', null, 'Élève de 4e B', null),
  ('hugo', 'eleve', 'Hugo', 'Benali', null, 'Hugo Benali', 'HB', null, 'Élève de 1re 3', 'Spé. Maths, SES'),
  ('sophie', 'parent', 'Sophie', 'Martin', 'madame', 'Mme Martin', 'SM', null, 'Responsable de Léa Martin', null),
  ('durand', 'prof', 'Marc', 'Durand', 'monsieur', 'M. Durand', 'MD', 'Mathématiques', 'Professeur de mathématiques', null),
  ('kader', 'cpe', 'Nadia', 'Kader', 'madame', 'Mme Kader', 'NK', 'Conseillère principale d''éducation', 'Conseillère principale d''éducation', null),
  ('lefevre', 'direction', 'Paul', 'Lefèvre', 'monsieur', 'M. Lefèvre', 'PL', 'Principal', 'Principal', null),
  ('roux', 'secretariat', 'Claire', 'Roux', 'madame', 'Mme Roux', 'CR', 'Secrétariat de direction', 'Secrétariat de direction', null),
  ('petit', 'prof', 'Anne', 'Petit', 'madame', 'Mme Petit', 'MP', 'Français', 'Professeure de français', null),
  ('garnier', 'prof', 'Luc', 'Garnier', 'monsieur', 'M. Garnier', 'MG', 'Histoire-Géo', 'Professeur d''histoire-géographie', null),
  ('colin', 'prof', 'Marc', 'Colin', 'monsieur', 'M. Colin', 'MC', 'EPS', 'Professeur d''EPS', null),
  ('ndiaye', 'prof', 'Awa', 'Ndiaye', 'madame', 'Mme Ndiaye', 'MN', 'SVT', 'Professeure de SVT', null),
  ('roche', 'prof', 'Paul', 'Roche', 'monsieur', 'M. Roche', 'MR', 'Physique-Chimie', 'Professeur de physique-chimie', null),
  ('faure', 'prof', 'Julie', 'Faure', 'madame', 'Mme Faure', 'MF', 'Technologie', 'Professeure de technologie', null),
  ('ortiz', 'prof', 'Elena', 'Ortiz', 'madame', 'Mme Ortiz', 'MO', 'Espagnol', 'Professeure d''espagnol', null),
  ('clarke', 'prof', 'Emma', 'Clarke', 'madame', 'Mrs Clarke', 'EC', 'Anglais', 'Professeure d''anglais', null),
  ('blanc', 'prof', 'Hugo', 'Blanc', 'monsieur', 'M. Blanc', 'MB', 'Musique', 'Professeur de musique', null),
  ('lemoine', 'prof', 'Claire', 'Lemoine', 'madame', 'Mme Lemoine', 'ML', 'Arts plastiques', 'Professeure d''arts plastiques', null),
  ('vidal', 'prof', 'Sarah', 'Vidal', 'madame', 'Mme Vidal', 'SV', 'Mathématiques', 'Professeure de mathématiques', null),
  ('viesco', 'cpe', null, null, null, 'Vie scolaire', 'VS', null, 'Collège Jean-Moulin', null),
  ('secretariat-svc', 'secretariat', null, null, null, 'Secrétariat', 'SE', null, 'Collège Jean-Moulin', null)
) as v(k, kind, fn, ln, civ, dn, ini, role_label, title, spe);

-- Élèves de 4e D (sans compte), classe de M. Durand
insert into public.profiles (id, school_id, kind, first_name, last_name, display_name, initials)
select ('00000000-0000-4000-8000-0000000d' || lpad(n::text, 4, '0'))::uuid, pg_temp.id('school'), 'eleve',
       split_part(name, ' ', 1), split_part(name, ' ', 2), name,
       left(split_part(name, ' ', 1), 1) || left(split_part(name, ' ', 2), 1)
from unnest(array['Adam Bernard', 'Inès Chevalier', 'Noah Dupuis', 'Lina Faure', 'Gabriel Girard', 'Jade Henry',
                  'Louis Lambert', 'Léna Marchand', 'Rayan Mercier', 'Chloé Morel', 'Sacha Perrin', 'Zoé Robin'])
     with ordinality as t(name, n);

insert into public.students (profile_id, class_id) values
  (pg_temp.id('lea'), pg_temp.id('4eB')), (pg_temp.id('hugo'), pg_temp.id('1re3'));
insert into public.students (profile_id, class_id)
select id, pg_temp.id('4eD') from public.profiles where id::text like '00000000-0000-4000-8000-0000000d%';

insert into public.guardians (guardian_id, student_id) values (pg_temp.id('sophie'), pg_temp.id('lea'));

insert into public.profile_private (profile_id, email, phone)
select pg_temp.id(a.k), a.email, '06 12 34 56 78' from accounts a;

-- ── Matières ──
insert into public.subjects (id, name, hue, skills) values
  ('fr', 'Français', 30, array['Lire', 'Écrire', 'Étude de la langue']),
  ('hg', 'Histoire-Géo', 60, array['Se repérer', 'Raisonner', 'Analyser un document']),
  ('eps', 'EPS', 120, array['Performance', 'Coopérer', 'Méthodes']),
  ('svt', 'SVT', 150, array['Pratiquer une démarche', 'Modéliser', 'Communiquer']),
  ('pc', 'Physique-Chimie', 180, array['Mesurer', 'Modéliser', 'Communiquer']),
  ('techno', 'Technologie', 210, array['Concevoir', 'Réaliser', 'Communiquer']),
  ('ma', 'Mathématiques', 240, array['Calculer', 'Raisonner', 'Communiquer']),
  ('es', 'Espagnol', 270, array['Comprendre', 'S''exprimer à l''oral', 'Écrire']),
  ('en', 'Anglais', 300, array['Comprendre', 'S''exprimer à l''oral', 'Écrire']),
  ('mu', 'Musique', 330, array['Chanter', 'Écouter', 'Créer']),
  ('ap', 'Arts plastiques', 0, array['Expérimenter', 'Représenter', 'S''exprimer']);

-- Enseignants par matière (mêmes équipes en 4e B et en 1re 3 pour la démo)
create temporary table subject_teacher (subject_id text, teacher text) on commit drop;
insert into subject_teacher values ('fr', 'petit'), ('hg', 'garnier'), ('eps', 'colin'), ('svt', 'ndiaye'),
  ('pc', 'roche'), ('techno', 'faure'), ('ma', 'durand'), ('es', 'ortiz'), ('en', 'clarke'), ('mu', 'blanc'), ('ap', 'lemoine');

-- 4e B et 1re 3 ont les mêmes équipes, sauf en mathématiques (Mme Vidal en 1re 3).
create temporary table class_teacher (class_id uuid, subject_id text, teacher text) on commit drop;
insert into class_teacher
select c.id, st.subject_id, case when c.k = '1re3' and st.subject_id = 'ma' then 'vidal' else st.teacher end
from subject_teacher st cross join (values ('4eB', pg_temp.id('4eB')), ('1re3', pg_temp.id('1re3'))) c(k, id);

insert into public.teachings (class_id, subject_id, teacher_id, is_head_teacher)
select class_id, subject_id, pg_temp.id(teacher), subject_id = 'fr' from class_teacher;
insert into public.teachings (class_id, subject_id, teacher_id) values
  (pg_temp.id('4eD'), 'ma', pg_temp.id('durand')), (pg_temp.id('3eA'), 'ma', pg_temp.id('durand')),
  (pg_temp.id('6eC'), 'ma', pg_temp.id('durand'));

-- ── Emploi du temps, semaine du lundi 12 octobre 2026 (heures décimales, Europe/Paris) ──
create temporary table week (day int, h_start numeric, h_end numeric, subject_id text, room text, cancelled boolean) on commit drop;
insert into week values
  (0, 8, 9, 'ma', 'B12', false), (0, 9, 10, 'fr', 'A04', false), (0, 10.25, 11.25, 'en', 'A10', false),
  (0, 11.25, 12.25, 'hg', 'A04', false), (0, 13.5, 15.5, 'eps', 'Gymnase', false),
  (1, 8, 9, 'fr', 'A04', false), (1, 9, 10, 'ma', 'B12', false), (1, 10.25, 12.25, 'pc', 'Labo 2', false),
  (1, 13.5, 14.5, 'es', 'A12', false), (1, 14.5, 15.5, 'techno', 'C03', false),
  (2, 8, 9, 'en', 'A10', false), (2, 9, 10, 'hg', 'A04', false), (2, 10.25, 11.25, 'ma', 'B12', false),
  (2, 11.25, 12.25, 'mu', 'Salle de musique', false),
  (3, 8, 10, 'svt', 'Labo 1', false), (3, 10.25, 11.25, 'fr', 'A04', false), (3, 11.25, 12.25, 'es', 'A12', false),
  (3, 13.5, 15.5, 'ap', 'Arts', false), (3, 15.5, 16.5, 'en', 'A10', false),
  (4, 8, 9, 'ma', 'B12', false), (4, 9, 10, 'fr', 'A04', false), (4, 10.25, 11.25, 'hg', 'A04', false),
  (4, 11.25, 12.25, 'techno', 'C03', true), (4, 13.5, 14.5, 'pc', 'Labo 2', false), (4, 14.5, 16.5, 'eps', 'Gymnase', false);

create function pg_temp.at(day int, h numeric) returns timestamptz language sql as $$
  select (('2026-10-12'::date + day)::timestamp + make_interval(mins => round(h * 60)::int)) at time zone 'Europe/Paris'
$$;

insert into public.lessons (class_id, subject_id, teacher_id, room, starts_at, ends_at, cancelled, attendance_validated_at)
select ct.class_id, w.subject_id, pg_temp.id(ct.teacher), w.room, pg_temp.at(w.day, w.h_start), pg_temp.at(w.day, w.h_end), w.cancelled,
       case when pg_temp.at(w.day, w.h_start) < '2026-10-13 10:00+02' then pg_temp.at(w.day, w.h_start) + interval '5 minutes' end
from week w join class_teacher ct using (subject_id);

-- Autres cours de M. Durand le mardi 13 octobre
insert into public.lessons (class_id, subject_id, teacher_id, room, starts_at, ends_at, attendance_validated_at) values
  (pg_temp.id('3eA'), 'ma', pg_temp.id('durand'), 'B12', pg_temp.at(1, 8), pg_temp.at(1, 9), pg_temp.at(1, 8) + interval '5 minutes'),
  (pg_temp.id('4eD'), 'ma', pg_temp.id('durand'), 'B12', pg_temp.at(1, 10.25), pg_temp.at(1, 11.25), null),
  (pg_temp.id('6eC'), 'ma', pg_temp.id('durand'), 'B14', pg_temp.at(1, 14.5), pg_temp.at(1, 15.5), null);

-- Appel en cours de saisie pour la 4e D (non validé)
insert into public.attendance (lesson_id, student_id, status, recorded_by)
select l.id, s.profile_id,
       case p.display_name when 'Noah Dupuis' then 'absent' when 'Sacha Perrin' then 'late' else 'present' end::public.attendance_status,
       pg_temp.id('durand')
from public.lessons l join public.students s on s.class_id = l.class_id join public.profiles p on p.id = s.profile_id
where l.class_id = pg_temp.id('4eD');

-- ── Devoirs ──
insert into public.homework (id, class_id, subject_id, teacher_id, content, given_on, due_on, is_exam, attachment_name)
select gen_random_uuid(), ct.class_id, h.subject_id, pg_temp.id(ct.teacher), h.content, h.given_on, h.due_on, h.is_exam, h.file
from (values
  ('ma', 'Exercices 12 à 15 page 84, sur feuille double.', date '2026-10-12', date '2026-10-14', false, null),
  ('en', 'Apprendre le vocabulaire de l''unité 3.', date '2026-10-09', date '2026-10-14', false, null),
  ('hg', 'Relire la leçon sur la Révolution française.', date '2026-10-12', date '2026-10-14', false, null),
  ('svt', 'Compte rendu du TP microscope.', date '2026-10-07', date '2026-10-15', false, 'Fiche-TP-microscope.pdf'),
  ('fr', 'Lire les chapitres 4 et 5 du Petit Prince.', date '2026-10-06', date '2026-10-15', false, null),
  ('hg', 'La Révolution française, chapitre 2.', date '2026-10-05', date '2026-10-16', true, null)
) as h(subject_id, content, given_on, due_on, is_exam, file)
join class_teacher ct using (subject_id);

-- Léa a déjà fait l'exercice de mathématiques
insert into public.homework_done (homework_id, user_id)
select id, pg_temp.id('lea') from public.homework
where class_id = pg_temp.id('4eB') and subject_id = 'ma' and due_on = '2026-10-14';

-- ── Évaluations du trimestre 1 (publiées), résultats de Léa et Hugo ──
create temporary table evals (subject_id text, title text, held_on date, level public.eval_value) on commit drop;
insert into evals values
  ('fr', 'Dictée', '2026-09-18', 'MF'), ('fr', 'Rédaction — portrait', '2026-10-02', 'MS'), ('fr', 'Lecture analytique', '2026-10-09', 'MS'),
  ('ma', 'Calcul mental', '2026-09-15', 'TB'), ('ma', 'Nombres relatifs', '2026-09-25', 'MS'), ('ma', 'Contrôle — Fractions', '2026-10-09', 'TB'),
  ('hg', 'Repères chronologiques', '2026-09-22', 'MF'), ('hg', 'Croquis — la ville', '2026-10-06', 'MS'),
  ('en', 'Oral — present yourself', '2026-09-17', 'MS'), ('en', 'Compréhension écrite', '2026-10-05', 'TB'),
  ('es', 'Vocabulaire', '2026-09-24', 'MS'), ('es', 'Expression orale', '2026-10-08', 'MF'),
  ('svt', 'TP microscope', '2026-09-29', 'MI'), ('svt', 'Le vivant et son évolution', '2026-10-07', 'MF'),
  ('pc', 'Mesures et incertitudes', '2026-09-30', 'MS'),
  ('techno', 'Projet — cahier des charges', '2026-10-01', 'TB'),
  ('mu', 'Chant choral', '2026-09-21', 'TB'),
  ('eps', 'Demi-fond', '2026-09-28', 'MS'), ('eps', 'Badminton', '2026-10-12', 'MS'),
  ('ap', 'Autoportrait', '2026-09-23', 'MS');

insert into public.assessments (class_id, subject_id, teacher_id, title, held_on, term, skills, published_at)
select ct.class_id, e.subject_id, pg_temp.id(ct.teacher), e.title, e.held_on, 1, s.skills, e.held_on + interval '2 days'
from evals e join class_teacher ct using (subject_id) join public.subjects s on s.id = e.subject_id;

-- Niveau par compétence : la 2e compétence est décalée d'un niveau (règle du prototype).
-- Aucun calcul : chaque niveau est une saisie du professeur.
create function pg_temp.shift(l public.eval_value) returns public.eval_value language sql as $$
  select case l when 'MI' then 'MF' when 'MF' then 'MS' when 'MS' then 'TB' else 'MS' end::public.eval_value
$$;
insert into public.assessment_results (assessment_id, student_id, level, skill_levels, comment)
select a.id, s.profile_id, e.level, array[e.level, pg_temp.shift(e.level), e.level],
  case e.level
    when 'MI' then 'Notions à reprendre : venez me voir en fin de cours.'
    when 'MF' then 'Des bases présentes, à consolider avec les exercices du manuel.'
    when 'MS' then 'Bon travail, méthode bien appliquée.'
    else 'Excellent travail, raisonnement clair et rigoureux.' end
from public.assessments a
join evals e on e.subject_id = a.subject_id and e.title = a.title
join public.students s on s.class_id = a.class_id;

-- Contrôle de la 4e D, en cours de saisie par M. Durand (non publié)
insert into public.assessments (id, class_id, subject_id, teacher_id, title, held_on, term, skills)
values ('00000000-0000-4000-8000-0000000e0001', pg_temp.id('4eD'), 'ma', pg_temp.id('durand'), 'Contrôle — Fractions',
        '2026-10-09', 1, array['Calculer', 'Raisonner', 'Communiquer']);
insert into public.assessment_results (assessment_id, student_id, level, skill_levels)
select '00000000-0000-4000-8000-0000000e0001', p.id, 'NE',
  array[(array['MI','MF','MS','TB'])[((n - 1) * 3 + 1) % 4 + 1],
        (array['MI','MF','MS','TB'])[((n - 1) * 2 + 2) % 4 + 1],
        case when (n - 1) % 5 = 0 then 'NE' else (array['MI','MF','MS','TB'])[((n - 1) + 2) % 4 + 1] end]::public.eval_value[]
from (select id, row_number() over (order by last_name, first_name) as n
      from public.profiles where id::text like '00000000-0000-4000-8000-0000000d%') p;

-- ── Vie scolaire de Léa ──
insert into public.life_events (student_id, kind, occurred_at, whole_day, detail, status, minutes, created_by) values
  (pg_temp.id('lea'), 'absence', '2026-10-01 08:00+02', true, 'Motif non renseigné', 'a_justifier', null, pg_temp.id('kader')),
  (pg_temp.id('lea'), 'retard', '2026-10-12 08:12+02', false, 'Mathématiques · 12 min', 'justifie', 12, pg_temp.id('durand')),
  (pg_temp.id('lea'), 'retard', '2026-09-28 13:42+02', false, 'EPS · 12 min · transport scolaire', 'justifie', 12, pg_temp.id('colin')),
  (pg_temp.id('lea'), 'oubli', '2026-09-23 13:30+02', false, 'Arts plastiques · carnet de croquis', 'note', null, pg_temp.id('lemoine')),
  (pg_temp.id('lea'), 'encouragement', '2026-10-09 10:00+02', false, 'Mme Petit · participation remarquable', 'note', null, pg_temp.id('petit'));

-- ── Messagerie ──
insert into public.messages (id, school_id, sender_id, subject, body, sent_at) values
  ('00000000-0000-4000-8000-0000000f0001', pg_temp.id('school'), pg_temp.id('petit'), 'Sortie théâtre du 22 novembre',
   E'Bonjour,\n\nLa classe de 4e B assistera à une représentation du Petit Prince le dimanche 22 novembre à 15 h, au théâtre municipal.\n\nL''autorisation de sortie est disponible dans Documents. Merci de la signer avant le 6 novembre.\n\nBien cordialement,\nMme Petit',
   '2026-10-13 08:30+02'),
  ('00000000-0000-4000-8000-0000000f0002', pg_temp.id('school'), pg_temp.id('viesco'), 'Rappel : photo de classe jeudi',
   'La photo de classe de 4e B aura lieu jeudi 15 octobre à 9 h dans le préau.', '2026-10-12 16:10+02'),
  ('00000000-0000-4000-8000-0000000f0003', pg_temp.id('school'), pg_temp.id('durand'), 'Contrôle sur les fractions',
   'Les évaluations du contrôle sont en ligne. Le corrigé est joint dans Documents.', '2026-10-12 12:05+02'),
  ('00000000-0000-4000-8000-0000000f0004', pg_temp.id('school'), pg_temp.id('secretariat-svc'), 'Facture sortie Futuroscope',
   'La facture de la sortie est disponible dans Paiements.', '2026-10-09 11:00+02'),
  ('00000000-0000-4000-8000-0000000f0005', pg_temp.id('school'), pg_temp.id('colin'), 'Tenue pour le cross',
   'Prévoir une tenue de sport et une bouteille d''eau.', '2026-10-06 17:20+02'),
  ('00000000-0000-4000-8000-0000000f0006', pg_temp.id('school'), pg_temp.id('lefevre'), 'Bienvenue sur Préau',
   'Préau remplace l''ancien espace numérique à partir de cette rentrée.', '2026-09-01 08:00+02'),
  ('00000000-0000-4000-8000-0000000f0007', pg_temp.id('school'), pg_temp.id('sophie'), 'Question sur le contrôle de fractions',
   E'Bonjour Monsieur Durand,\n\nLéa aimerait refaire les exercices du contrôle. Pouvez-vous lui indiquer les pages du manuel à travailler ?\n\nMerci,\nSophie Martin',
   '2026-10-13 07:45+02'),
  ('00000000-0000-4000-8000-0000000f0008', pg_temp.id('school'), pg_temp.id('viesco'), 'Appels du créneau de 10 h 15',
   'Merci de faire l''appel dès le début du cours.', '2026-10-13 08:05+02');

-- Léa et sa mère reçoivent les six messages du prototype ; les trois premiers sont non lus.
insert into public.message_recipients (message_id, recipient_id, read_at)
select m.id, r.id, case when m.sent_at < '2026-10-12 00:00+02' then m.sent_at + interval '1 hour' end
from public.messages m cross join (values (pg_temp.id('lea')), (pg_temp.id('sophie'))) r(id)
where m.id::text between '00000000-0000-4000-8000-0000000f0001' and '00000000-0000-4000-8000-0000000f0006';
-- Message de bienvenue pour tous les autres comptes
insert into public.message_recipients (message_id, recipient_id)
select '00000000-0000-4000-8000-0000000f0006', pg_temp.id(k) from (values ('hugo'), ('durand'), ('kader'), ('roux')) v(k);
insert into public.message_recipients (message_id, recipient_id) values
  ('00000000-0000-4000-8000-0000000f0007', pg_temp.id('durand')),
  ('00000000-0000-4000-8000-0000000f0008', pg_temp.id('durand'));

-- ── Documents ──
insert into public.documents (school_id, class_id, student_id, title, category, icon, size_bytes, requires_signature, created_at) values
  (pg_temp.id('school'), pg_temp.id('4eB'), null, 'Autorisation — Sortie théâtre', 'administratif', 'draw', 86016, true, '2026-10-12 09:00+02'),
  (pg_temp.id('school'), pg_temp.id('4eB'), null, 'Corrigé — Contrôle fractions', 'pedagogique', 'description', 215040, false, '2026-10-12 12:00+02'),
  (pg_temp.id('school'), null, null, 'Menus d''octobre', 'cantine', 'restaurant', 1258291, false, '2026-10-01 08:00+02'),
  (pg_temp.id('school'), pg_temp.id('4eB'), null, 'Fiche méthode — Le croquis', 'pedagogique', 'description', 348160, false, '2026-09-28 08:00+02'),
  (pg_temp.id('school'), null, pg_temp.id('lea'), 'Certificat de scolarité 2026–2027', 'administratif', 'badge', 63488, false, '2026-09-03 08:00+02'),
  (pg_temp.id('school'), null, null, 'Règlement intérieur', 'administratif', 'gavel', 491520, false, '2026-09-01 08:00+02');

-- ── Agenda ──
insert into public.agenda_events (school_id, title, tone, starts_on, ends_on, is_holiday) values
  (pg_temp.id('school'), 'Photo de classe', 'info', '2026-10-02', null, false),
  (pg_temp.id('school'), 'Cross du collège', 'ok', '2026-10-08', null, false),
  (pg_temp.id('school'), 'Réunion parents-profs · 17 h 30', 'brand', '2026-10-13', null, false),
  (pg_temp.id('school'), 'Conseil pédagogique', 'neutral', '2026-10-15', null, false),
  (pg_temp.id('school'), 'Sortie Futuroscope', 'warn', '2026-10-16', null, false),
  (pg_temp.id('school'), 'Vacances de la Toussaint', 'neutral', '2026-10-17', '2026-11-01', true);

-- ── Cantine et factures de Léa ──
insert into public.canteen_accounts (student_id, balance_cents, meal_price_cents) values (pg_temp.id('lea'), 2340, 450);
insert into public.menus (school_id, served_on, items) values
  (pg_temp.id('school'), '2026-10-13', array['Carottes râpées', 'Hachis parmentier · option végétarienne', 'Yaourt fermier, pomme']);
insert into public.invoices (student_id, label, amount_cents, status, due_on, paid_on, method, created_at) values
  (pg_temp.id('lea'), 'Sortie Futuroscope', 3200, 'a_payer', '2026-10-14', null, null, '2026-10-09 11:00+02'),
  (pg_temp.id('lea'), 'Rechargement cantine', 4000, 'creditee', null, '2026-10-01', 'carte bancaire', '2026-10-01 09:00+02'),
  (pg_temp.id('lea'), 'Cantine — septembre', 7800, 'payee', '2026-10-05', '2026-10-02', 'prélèvement', '2026-09-30 09:00+02'),
  (pg_temp.id('lea'), 'Cotisation foyer socio-éducatif', 1500, 'payee', '2026-09-15', '2026-09-08', 'carte bancaire', '2026-09-02 09:00+02');

-- ── Bulletins de Léa ──
insert into public.report_cards (id, student_id, school_year, term, class_name, head_teacher, publish_on, council_mention, council_text) values
  ('00000000-0000-4000-8000-000000ca0001', pg_temp.id('lea'), '2026–2027', 1, '4e B', 'Mme Petit', '2026-12-11', null, null),
  ('00000000-0000-4000-8000-000000ca0002', pg_temp.id('lea'), '2025–2026', 3, '5e B', 'Mme Petit', '2026-07-02',
   'Félicitations du conseil de classe.', 'Année très solide, curiosité et sérieux constants.'),
  ('00000000-0000-4000-8000-000000ca0003', pg_temp.id('lea'), '2025–2026', 2, '5e B', 'Mme Petit', '2026-04-03',
   'Encouragements du conseil de classe.', 'Bon trimestre, efforts réguliers.');
insert into public.report_card_lines (report_card_id, subject_id, level, comment, position)
select rc, subject_id, level::public.eval_value, comment, pos
from (values
  ('fr', 'MS', 'Lectrice attentive, expression écrite en net progrès.', 1),
  ('ma', 'TB', 'Excellent trimestre, raisonnement rigoureux.', 2),
  ('hg', 'MS', 'Bon investissement, connaissances à consolider.', 3),
  ('en', 'TB', 'Très bon oral, participation constante.', 4),
  ('svt', 'MF', 'Démarche expérimentale à travailler.', 5),
  ('eps', 'MS', 'Engagée et volontaire.', 6)
) as l(subject_id, level, comment, pos)
cross join (values ('00000000-0000-4000-8000-000000ca0002'::uuid), ('00000000-0000-4000-8000-000000ca0003'::uuid)) r(rc);

commit;
