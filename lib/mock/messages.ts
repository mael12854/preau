export type Message = {
  initials: string;
  from: string;
  role: string;
  subject: string;
  date: string;
  body: string;
  unread: boolean;
};

export const MESSAGES: Message[] = [
  {
    initials: "MP", from: "Mme Petit", role: "Professeure de français", subject: "Sortie théâtre du 22 novembre", date: "il y a 2 h", unread: true,
    body: "Bonjour,\n\nLa classe de 4e B assistera à une représentation du Petit Prince le dimanche 22 novembre à 15 h, au théâtre municipal.\n\nL'autorisation de sortie est disponible dans Documents. Merci de la signer avant le 6 novembre.\n\nBien cordialement,\nMme Petit",
  },
  { initials: "VS", from: "Vie scolaire", role: "Collège Jean-Moulin", subject: "Rappel : photo de classe jeudi", date: "hier", unread: true, body: "La photo de classe de 4e B aura lieu jeudi 15 octobre à 9 h dans le préau." },
  { initials: "MD", from: "M. Durand", role: "Professeur de mathématiques", subject: "Contrôle sur les fractions", date: "lun. 12 oct.", unread: true, body: "Les évaluations du contrôle sont en ligne. Le corrigé est joint dans Documents." },
  { initials: "SE", from: "Secrétariat", role: "Collège Jean-Moulin", subject: "Facture sortie Futuroscope", date: "ven. 9 oct.", unread: false, body: "La facture de la sortie est disponible dans Paiements." },
  { initials: "MC", from: "M. Colin", role: "Professeur d'EPS", subject: "Tenue pour le cross", date: "mar. 6 oct.", unread: false, body: "Prévoir une tenue de sport et une bouteille d'eau." },
  { initials: "PL", from: "M. Lefèvre", role: "Principal", subject: "Bienvenue sur Préau", date: "1 sept.", unread: false, body: "Préau remplace l'ancien espace numérique à partir de cette rentrée." },
];

export const FOLDERS = [
  { key: "recus", label: "Reçus", count: 3 },
  { key: "envoyes", label: "Envoyés" },
  { key: "brouillons", label: "Brouillons" },
  { key: "archives", label: "Archivés" },
] as const;
