/** Logos des établissements (fichiers dans /public/logos), par domaine. */
const LOGOS: Record<string, string> = {
  "vk.preau.fr": "/logos/vk.svg",
};

export const schoolLogo = (domain: string | null | undefined) => (domain ? (LOGOS[domain] ?? null) : null);
