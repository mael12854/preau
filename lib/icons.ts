/**
 * Icônes Material Symbols Rounded utilisées dans l'interface.
 * La police est chargée avec `icon_names` pour ne télécharger que ces glyphes :
 * ajoutez ici toute nouvelle icône avant de l'utiliser.
 */
export const ICON_NAMES = [
  "add",
  "arrow_forward",
  "article",
  "attach_file",
  "backpack",
  "badge",
  "calendar_view_week",
  "check",
  "check_circle",
  "chevron_left",
  "chevron_right",
  "close",
  "dark_mode",
  "description",
  "donut_large",
  "download",
  "draw",
  "edit",
  "edit_note",
  "error",
  "event",
  "event_busy",
  "expand_more",
  "fact_check",
  "folder",
  "gavel",
  "groups",
  "how_to_reg",
  "info",
  "light_mode",
  "lock",
  "logout",
  "mail",
  "menu",
  "menu_book",
  "notifications",
  "payments",
  "print",
  "report",
  "restaurant",
  "schedule",
  "search",
  "send",
  "settings",
  "space_dashboard",
  "sticky_note_2",
  "swap_horiz",
  "thumb_up",
  "warning",
  "workspace_premium",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export const ICON_FONT_URL =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400,0..1,0" +
  `&icon_names=${[...ICON_NAMES].sort().join(",")}&display=block`;
