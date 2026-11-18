import { NextResponse } from "next/server";
import { storage } from "@/lib/documents";
import { createClient } from "@/lib/supabase/server";

/**
 * Pièce jointe d'un devoir ou d'un contenu de séance : la RLS de public.class_attachments décide si la personne la voit ;
 * si oui, le serveur la redirige vers un lien temporaire (60 s) du compartiment privé.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.redirect(new URL("/connexion", req.url));
  const { data: pj } = await supabase.from("class_attachments").select("name, storage_path, uploaded_at").eq("id", id).maybeSingle();
  const store = storage();
  if (!pj?.uploaded_at || !store) return new NextResponse("Pièce jointe introuvable.", { status: 404 });
  const { data } = await store.createSignedUrl(pj.storage_path, 60, { download: pj.name });
  if (!data?.signedUrl) return new NextResponse("Pièce jointe indisponible pour le moment.", { status: 503 });
  return NextResponse.redirect(data.signedUrl);
}
