-- Préau — structure des établissements : matières, écoles et classes.
-- Aucun compte ni aucune personne : les comptes sont créés par l'établissement.
-- Rejouable sans risque (aucun doublon).

-- ── Matières (communes à tous les établissements) ──
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
  ('ap', 'Arts plastiques', 0, array['Expérimenter', 'Représenter', 'S''exprimer'])
on conflict (id) do nothing;


-- ── Établissements ──
-- EWK : École du Weekend (primaire), CWK : Collège du Weekend, +VK : lycée et post-bac.
insert into public.schools (name, domain, year_label, grading) values
  ('École du Weekend', 'ecole-du-weekend.preau.fr', 'Année 2026–2027', 'competences'),
  ('Collège du Weekend', 'college-du-weekend.preau.fr', 'Année 2026–2027', 'note20'),
  ('+VK', 'vk.preau.fr', 'Année 2026–2027', 'note20')
on conflict (domain) do nothing;

-- ── Classes ──
-- EWK : IE0 = PS ou avant, IE1 = MS, IE2 = GS, IE3 = CP, IE4 = CE1, IE5 = CE2 et après (propre à l'EWK).
insert into public.classes (school_id, name, level)
select s.id, c.name, c.level::public.school_level
from (values
  ('ecole-du-weekend.preau.fr', 'IE0', 'primaire'), ('ecole-du-weekend.preau.fr', 'IE1', 'primaire'),
  ('ecole-du-weekend.preau.fr', 'IE2', 'primaire'), ('ecole-du-weekend.preau.fr', 'IE3', 'primaire'),
  ('ecole-du-weekend.preau.fr', 'IE4', 'primaire'), ('ecole-du-weekend.preau.fr', 'IE5', 'primaire'),
  ('college-du-weekend.preau.fr', '6e', 'college'), ('college-du-weekend.preau.fr', '5e', 'college'),
  ('college-du-weekend.preau.fr', '4e', 'college'), ('college-du-weekend.preau.fr', '3e', 'college'),
  ('vk.preau.fr', '2de', 'lycee'), ('vk.preau.fr', '1re', 'lycee'),
  ('vk.preau.fr', 'Tle', 'lycee'), ('vk.preau.fr', 'Post-bac', 'lycee')
) c(domain, name, level)
join public.schools s on s.domain = c.domain
on conflict (school_id, name) do nothing;
