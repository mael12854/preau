/**
 * Préférences d'affichage, appliquées sur <html> par des attributs data-*.
 * Stockées dans localStorage et réappliquées avant le premier rendu (voir THEME_SCRIPT).
 */
export type ThemePref = "system" | "light" | "dark";
export type TextSize = "100" | "115" | "130";

export type Preferences = {
  theme: ThemePref;
  sigles: boolean;
  contrast: boolean;
  textSize: TextSize;
};

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  sigles: false,
  contrast: false,
  textSize: "100",
};

export const PREFERENCES_KEY = "preau-preferences";

/** Script inline exécuté dans <head> : évite le flash de thème au chargement. */
export const THEME_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  PREFERENCES_KEY,
)})||"{}");var d=document.documentElement;if(p.theme==="light"||p.theme==="dark")d.dataset.theme=p.theme;if(p.sigles)d.dataset.sigles="on";if(p.contrast)d.dataset.contrast="more";if(p.textSize==="115"||p.textSize==="130")d.dataset.textSize=p.textSize;}catch(e){}})();`;

export function applyPreferences(p: Preferences) {
  const d = document.documentElement;
  if (p.theme === "system") delete d.dataset.theme;
  else d.dataset.theme = p.theme;
  if (p.sigles) d.dataset.sigles = "on";
  else delete d.dataset.sigles;
  if (p.contrast) d.dataset.contrast = "more";
  else delete d.dataset.contrast;
  if (p.textSize === "100") delete d.dataset.textSize;
  else d.dataset.textSize = p.textSize;
}

export function readPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    return { ...DEFAULT_PREFERENCES, ...(raw ? (JSON.parse(raw) as Partial<Preferences>) : {}) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function writePreferences(p: Preferences) {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(p));
  } catch {
    /* stockage indisponible : la préférence ne vaut que pour cette page */
  }
  applyPreferences(p);
}
