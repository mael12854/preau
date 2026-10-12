import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Compartiment privé des documents : seul le serveur y accède, avec la clé service_role. */
export const DOCUMENTS_BUCKET = "documents";

/** Les types de fichiers acceptés (mêmes que la configuration du compartiment). */
export const DOCUMENT_TYPES = [
  "application/pdf", "image/png", "image/jpeg", "image/webp",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.text", "application/vnd.oasis.opendocument.spreadsheet", "text/plain",
];

export function storage() {
  return createAdminClient()?.storage.from(DOCUMENTS_BUCKET) ?? null;
}
