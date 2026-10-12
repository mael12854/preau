import next from "eslint-config-next";

export default [
  { ignores: [".next/**", "node_modules/**", "design_handoff_preau/**", "next-env.d.ts"] },
  ...next,
];
