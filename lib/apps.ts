/** Catalogue « Mes applis » : outils pédagogiques gratuits ou courants, ouverts dans un nouvel onglet. */
export type AppCategory = "Quiz et jeux" | "Langues" | "Créer et collaborer" | "Sciences et maths" | "Savoirs" | "Classe à distance";

export type CatalogApp = {
  key: string;
  name: string;
  description: string;
  category: AppCategory;
  url: string;
  /** Page de connexion, si elle diffère de l'accueil. */
  loginUrl?: string;
  /** Connexion avec un compte Google ou Microsoft proposée par l'appli. */
  sso?: "Google" | "Google ou Microsoft";
  /** Ce qu'on retient pour se connecter (affiché dans la case identifiant). */
  loginHint: string;
};

export const CATALOG: CatalogApp[] = [
  { key: "kahoot", name: "Kahoot!", description: "Quiz en direct : entrez le code PIN donné en classe.", category: "Quiz et jeux", url: "https://kahoot.it", loginUrl: "https://create.kahoot.it/auth/login", sso: "Google ou Microsoft", loginHint: "Nom d'utilisateur ou e-mail" },
  { key: "quizlet", name: "Quizlet", description: "Cartes mémoire et jeux pour réviser son vocabulaire et ses leçons.", category: "Quiz et jeux", url: "https://quizlet.com", loginUrl: "https://quizlet.com/login", sso: "Google", loginHint: "Nom d'utilisateur ou e-mail" },
  { key: "wooclap", name: "Wooclap", description: "Questions et sondages en cours, depuis son téléphone.", category: "Quiz et jeux", url: "https://www.wooclap.com", loginUrl: "https://app.wooclap.com/auth/login", sso: "Google ou Microsoft", loginHint: "E-mail" },
  { key: "learningapps", name: "LearningApps", description: "Petits exercices interactifs, classés par matière.", category: "Quiz et jeux", url: "https://learningapps.org", loginHint: "Nom d'utilisateur" },
  { key: "duolingo", name: "Duolingo", description: "Apprendre une langue quelques minutes par jour.", category: "Langues", url: "https://www.duolingo.com", sso: "Google", loginHint: "Nom d'utilisateur ou e-mail" },
  { key: "wordreference", name: "WordReference", description: "Dictionnaire bilingue avec forum de traduction.", category: "Langues", url: "https://www.wordreference.com", loginHint: "Nom d'utilisateur" },
  { key: "canva", name: "Canva", description: "Affiches, exposés et présentations à partir de modèles.", category: "Créer et collaborer", url: "https://www.canva.com", loginUrl: "https://www.canva.com/login", sso: "Google ou Microsoft", loginHint: "E-mail" },
  { key: "padlet", name: "Padlet", description: "Mur collaboratif pour partager idées, liens et images.", category: "Créer et collaborer", url: "https://padlet.com", loginUrl: "https://padlet.com/auth/login", sso: "Google ou Microsoft", loginHint: "E-mail" },
  { key: "genially", name: "Genially", description: "Présentations et jeux interactifs.", category: "Créer et collaborer", url: "https://genially.com", loginUrl: "https://auth.genially.com/fr/login", sso: "Google ou Microsoft", loginHint: "E-mail" },
  { key: "digipad", name: "Digipad", description: "Murs collaboratifs, outil libre de La Digitale.", category: "Créer et collaborer", url: "https://digipad.app", loginHint: "Identifiant" },
  { key: "scratch", name: "Scratch", description: "Programmer des jeux et des animations avec des blocs.", category: "Sciences et maths", url: "https://scratch.mit.edu", loginHint: "Nom d'utilisateur" },
  { key: "geogebra", name: "GeoGebra", description: "Géométrie, graphiques et calcul, en ligne.", category: "Sciences et maths", url: "https://www.geogebra.org", sso: "Google ou Microsoft", loginHint: "Nom d'utilisateur ou e-mail" },
  { key: "khan", name: "Khan Academy", description: "Cours et exercices de maths et de sciences, en français.", category: "Sciences et maths", url: "https://fr.khanacademy.org", loginUrl: "https://fr.khanacademy.org/login", sso: "Google ou Microsoft", loginHint: "Nom d'utilisateur ou e-mail" },
  { key: "phet", name: "PhET", description: "Simulations interactives de physique, chimie et maths.", category: "Sciences et maths", url: "https://phet.colorado.edu/fr/", loginHint: "E-mail" },
  { key: "lumni", name: "Lumni", description: "Vidéos et contenus éducatifs du service public.", category: "Savoirs", url: "https://www.lumni.fr", loginHint: "E-mail" },
  { key: "vikidia", name: "Vikidia", description: "Encyclopédie pour les 8–13 ans.", category: "Savoirs", url: "https://fr.vikidia.org", loginHint: "Nom d'utilisateur" },
  { key: "wikipedia", name: "Wikipédia", description: "Encyclopédie libre.", category: "Savoirs", url: "https://fr.wikipedia.org", loginHint: "Nom d'utilisateur" },
  { key: "pix", name: "Pix", description: "Tester et certifier ses compétences numériques.", category: "Savoirs", url: "https://pix.fr", loginUrl: "https://app.pix.fr/connexion", loginHint: "Identifiant ou e-mail" },
  { key: "meet", name: "Google Meet", description: "Visioconférence (le lien de chaque classe est dans « Mes classes en ligne »).", category: "Classe à distance", url: "https://meet.google.com", sso: "Google", loginHint: "Adresse Google" },
  { key: "classroom", name: "Google Classroom", description: "Classe en ligne : devoirs et documents partagés.", category: "Classe à distance", url: "https://classroom.google.com", sso: "Google", loginHint: "Adresse Google" },
];

export const CATEGORIES: AppCategory[] = [
  "Quiz et jeux",
  "Langues",
  "Créer et collaborer",
  "Sciences et maths",
  "Savoirs",
  "Classe à distance",
];
