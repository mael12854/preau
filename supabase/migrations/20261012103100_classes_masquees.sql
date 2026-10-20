-- Classe masquée : elle n'apparaît plus dans les listes ni dans les emplois du temps (aucun élève pour l'instant).
alter table public.classes add column hidden boolean not null default false;
