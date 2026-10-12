/** Lien d'évitement, premier élément focalisable de chaque page. */
export function SkipLink({ target = "contenu" }: { target?: string }) {
  return (
    <a
      href={`#${target}`}
      className="fixed top-2 left-2 z-[200] -translate-y-24 rounded-control bg-brand px-4 py-3 font-bold text-on-brand no-underline focus:translate-y-0"
    >
      Aller au contenu
    </a>
  );
}
