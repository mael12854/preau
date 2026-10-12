import { NextResponse } from "next/server";
import { storage } from "@/lib/documents";
import { createClient } from "@/lib/supabase/server";

/**
 * Téléchargement d'un document : la RLS de public.documents décide si la personne le voit ;
 * si oui, le serveur la redirige vers un lien temporaire (60 s) du compartiment privé.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.redirect(new URL("/connexion", _req.url));
  const { data: doc } = await supabase.from("documents").select("title, storage_path, uploaded_at").eq("id", id).maybeSingle();
  const store = storage();
  if (!doc?.storage_path || !doc.uploaded_at || !store) return new NextResponse("Document introuvable.", { status: 404 });
  const ext = doc.storage_path.match(/\.[a-z0-9]{1,6}$/)?.[0] ?? "";
  const { data } = await store.createSignedUrl(doc.storage_path, 60, { download: `${doc.title}${ext}` });
  if (!data?.signedUrl) return new NextResponse("Document indisponible pour le moment.", { status: 503 });
  return NextResponse.redirect(data.signedUrl);
}
