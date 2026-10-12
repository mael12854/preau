import type { Tone } from "@/lib/tone";

export type Bill = { label: string; date: string; amount: number; status: string; tone: Tone; payable?: boolean };

export const CANTEEN = {
  child: "Léa",
  balance: 23.4,
  mealsLeft: "Environ 5 repas restants",
  topUps: [20, 40, 60],
  /** Montant mis en avant parmi les recharges. */
  suggested: 40,
  menuDay: "mardi",
  menu: ["Carottes râpées", "Hachis parmentier · option végétarienne", "Yaourt fermier, pomme"],
};

export const BILLS: Bill[] = [
  { label: "Sortie Futuroscope", date: "à régler avant le 14 oct.", amount: 32, status: "À payer", tone: "danger", payable: true },
  { label: "Rechargement cantine", date: "1 oct. · carte bancaire", amount: 40, status: "Crédité", tone: "info" },
  { label: "Cantine — septembre", date: "payée le 2 oct.", amount: 78, status: "Payée", tone: "ok" },
  { label: "Cotisation foyer socio-éducatif", date: "payée le 8 sept.", amount: 15, status: "Payée", tone: "ok" },
];
