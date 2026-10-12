import next from "eslint-config-next";

const config = [
  { ignores: [".next/**", "node_modules/**", "design_handoff_preau/**", "next-env.d.ts"] },
  ...next,
  {
    rules: {
      // Le texte français utilise l'apostrophe partout : seuls > et } restent interdits.
      "react/no-unescaped-entities": ["error", { forbid: [">", "}"] }],
    },
  },
];

export default config;
