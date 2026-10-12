-- Stockage des documents (Supabase Storage, compartiment privé « documents »).
-- Aucune règle d'accès sur storage.objects : seul le serveur (clé service_role) lit et écrit les fichiers.
-- Il délivre un lien temporaire uniquement si la personne voit la ligne de public.documents (RLS),
-- et un lien d'envoi uniquement après create_document, qui vérifie les droits.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 10485760, array[
  'application/pdf', 'image/png', 'image/jpeg', 'image/webp',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.spreadsheet', 'text/plain'
])
on conflict (id) do nothing;

alter table public.documents add column created_by uuid references public.profiles (id) on delete set null;
alter table public.documents add column mime_type text;
alter table public.documents add column uploaded_at timestamptz;

-- Ajouter un document : administration (tout l'établissement ou une classe),
-- professeur (une de ses classes, catégorie pédagogique). Renvoie le chemin du fichier à envoyer.
create or replace function public.create_document(
  p_title text, p_category public.doc_category, p_class uuid, p_requires_signature boolean,
  p_file_name text, p_size_bytes integer, p_mime_type text
) returns table (id uuid, storage_path text) language plpgsql security definer set search_path = '' as $$
declare v_id uuid := gen_random_uuid(); v_path text; v_kind public.person_kind := private.my_kind();
  v_name text := regexp_replace(lower(coalesce(p_file_name, 'document')), '[^a-z0-9._-]+', '-', 'g');
begin
  if coalesce(trim(p_title), '') = '' or length(p_title) > 200 then raise exception 'Indiquez un titre (200 caractères au plus).'; end if;
  if p_size_bytes is null or p_size_bytes <= 0 or p_size_bytes > 10485760 then raise exception 'Le fichier doit faire 10 Mo au plus.'; end if;
  if p_class is not null and not exists (select 1 from public.classes c where c.id = p_class and c.school_id = private.my_school()) then
    raise exception 'Classe introuvable' using errcode = '42501';
  end if;
  if v_kind in ('cpe', 'direction', 'secretariat') then
    null;
  elsif v_kind = 'prof' then
    if p_class is null or not private.teaches_class(p_class) or p_category <> 'pedagogique' then
      raise exception 'Un professeur publie des documents pédagogiques pour ses classes.' using errcode = '42501';
    end if;
  else
    raise exception 'Seul le personnel peut ajouter des documents.' using errcode = '42501';
  end if;
  v_path := private.my_school()::text || '/' || v_id::text || '/' || left(v_name, 120);
  insert into public.documents (id, school_id, class_id, title, category, icon, size_bytes, storage_path, requires_signature, created_by, mime_type)
  values (v_id, private.my_school(), p_class, trim(p_title), p_category,
          case when p_mime_type like 'image/%' then 'image' when p_mime_type = 'application/pdf' then 'picture_as_pdf' else 'description' end,
          p_size_bytes, v_path, coalesce(p_requires_signature, false), private.me(), p_mime_type);
  return query select v_id, v_path;
end $$;

-- Retirer un document : son auteur, ou la direction et le secrétariat de l'établissement.
-- Renvoie le chemin du fichier, que le serveur supprime ensuite du stockage.
create or replace function public.delete_document(p_document uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_d public.documents;
begin
  if private.me() is null then raise exception 'Compte non rattaché à un établissement' using errcode = '42501'; end if;
  select * into v_d from public.documents where id = p_document;
  -- « is distinct from » et coalesce : une valeur nulle ne doit jamais laisser passer.
  if v_d.id is null or v_d.school_id is distinct from private.my_school()
     or not coalesce(v_d.created_by = private.me() or private.my_kind() in ('direction', 'secretariat'), false) then
    raise exception 'Document introuvable' using errcode = '42501';
  end if;
  delete from public.documents where id = p_document;
  return v_d.storage_path;
end $$;

revoke all on function public.create_document(text, public.doc_category, uuid, boolean, text, integer, text) from public, anon;
revoke all on function public.delete_document(uuid) from public, anon;
grant execute on function public.create_document(text, public.doc_category, uuid, boolean, text, integer, text) to authenticated;
grant execute on function public.delete_document(uuid) to authenticated;
