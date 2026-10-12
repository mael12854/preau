-- Préau — personnes et structure de l'établissement (Collège Jean-Moulin)
-- Comptes, profils, élèves, responsables, classes, matières, enseignements.
-- Aucune donnée de démonstration (cours, devoirs, évaluations…) : elles ont été supprimées.
-- ⚠️ Remplacez « A-REMPLACER-mot-de-passe-provisoire » avant de lancer ce fichier, puis faites changer les mots de passe.
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
  extensions.crypt('A-REMPLACER-mot-de-passe-provisoire', extensions.gen_salt('bf')), now(),
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

commit;
