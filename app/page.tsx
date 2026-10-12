import { redirect } from "next/navigation";

/** La racine mène au tableau de bord (le proxy envoie vers /connexion si besoin). */
export default function HomePage() {
  redirect("/accueil");
}
