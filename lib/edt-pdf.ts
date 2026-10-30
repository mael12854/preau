import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { LessonView } from "@/lib/data/types";
import { formatDateShort, formatTimeGrid, isoDay } from "@/lib/format";

/** Teinte de matière → couleur pdf-lib (fond clair, bord et texte foncés), comme à l'écran. */
function hsl(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgb(f(0), f(8), f(4));
}

/** Texte encodable par les polices standard (WinAnsi), coupé avec « … » pour tenir dans la largeur. */
export function fit(text: string, font: PDFFont, size: number, width: number) {
  const safe = [...text.replace(/[’‘]/g, "'").replace(/[“”]/g, '"')]
    .map((c) => {
      try {
        font.encodeText(c);
        return c;
      } catch {
        return "?";
      }
    })
    .join("");
  if (font.widthOfTextAtSize(safe, size) <= width) return safe;
  let s = safe;
  while (s.length > 1 && font.widthOfTextAtSize(`${s}…`, size) > width) s = s.slice(0, -1);
  return `${s}…`;
}

export type EdtPdfInput = {
  who: string;
  school: string;
  week: { days: string[]; todayIndex: number; lessons: LessonView[]; monday: string };
  reference: Date;
  /** Afficher la classe de chaque cours (enseignant, administration). */
  showClass: boolean;
};

/** Emploi du temps d'une semaine en PDF (A4 paysage), couleurs des matières, cours simultanés côte à côte. */
export async function renderEdtPdf({ who, school, week, reference, showClass }: EdtPdfInput) {
  // Mise en page : A4 paysage, une colonne par jour, une ligne par heure.
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Emploi du temps · ${who}`);
  const page = pdf.addPage([842, 595]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.11, 0.14, 0.13);
  const muted = rgb(0.37, 0.42, 0.4);
  const line = rgb(0.86, 0.85, 0.81);
  const margin = 28;

  page.drawText(fit(`Emploi du temps · ${who}`, bold, 15, 842 - 2 * margin), { x: margin, y: 595 - margin - 12, size: 15, font: bold, color: ink });
  page.drawText(fit(`${school} · Semaine du ${formatDateShort(week.monday)}`, font, 10, 842 - 2 * margin), {
    x: margin, y: 595 - margin - 28, size: 10, font, color: muted,
  });

  const weekend = week.lessons.some((l) => l.day >= 5);
  const days = week.days.slice(0, weekend ? 7 : 5);
  const start = Math.min(8, ...week.lessons.map((l) => Math.floor(l.start)));
  const end = Math.max(17, ...week.lessons.map((l) => Math.ceil(l.end)));
  const top = 595 - margin - 44;
  const bottom = margin + 16;
  const left = margin + 34;
  const colW = (842 - margin - left) / days.length;
  const headH = 18;
  const hourH = (top - headH - bottom) / (end - start);
  const yOf = (h: number) => top - headH - (h - start) * hourH;

  // En-têtes des jours, lignes des heures.
  days.forEach((d, i) => {
    const x = left + i * colW;
    page.drawRectangle({ x, y: top - headH, width: colW, height: headH, color: i === week.todayIndex ? rgb(0.12, 0.36, 0.29) : rgb(0.96, 0.95, 0.93) });
    page.drawText(fit(d, bold, 9, colW - 8), { x: x + 4, y: top - 13, size: 9, font: bold, color: i === week.todayIndex ? rgb(1, 1, 1) : ink });
    page.drawLine({ start: { x, y: top }, end: { x, y: bottom }, thickness: 0.5, color: line });
  });
  for (let h = start; h <= end; h++) {
    const y = yOf(h);
    page.drawLine({ start: { x: left, y }, end: { x: 842 - margin, y }, thickness: 0.4, color: line });
    if (h < end) page.drawText(formatTimeGrid(h), { x: margin, y: y - 9, size: 7.5, font, color: muted });
  }

  // Cours : bloc coloré par matière, cours simultanés côte à côte.
  days.forEach((_, di) => {
    const dayLessons = week.lessons.filter((l) => l.day === di).sort((a, b) => a.start - b.start);
    const lanes: number[] = [];
    const lane = new Map<string, number>();
    for (const l of dayLessons) {
      let i = lanes.findIndex((e) => e <= l.start);
      if (i < 0) i = lanes.push(l.end) - 1;
      else lanes[i] = l.end;
      lane.set(l.id, i);
    }
    for (const l of dayLessons) {
      const n = Math.max(1, dayLessons.filter((o) => o.start < l.end && l.start < o.end).length);
      const w = (colW - 4) / n;
      const x = left + di * colW + 2 + Math.min(lane.get(l.id) ?? 0, n - 1) * w;
      const y1 = yOf(l.end) + 1;
      const h = (l.end - l.start) * hourH - 2;
      page.drawRectangle({
        x, y: y1, width: w - 2, height: h,
        color: hsl(l.subject.hue, 55, 92), borderColor: hsl(l.subject.hue, 45, 45), borderWidth: 0.8,
        opacity: l.cancelled ? 0.5 : 1,
      });
      const lines: [string, PDFFont, number][] = [
        [`${l.subject.name}${l.group ? ` (${l.group})` : ""}${l.cancelled ? " · Annulé" : ""}`, bold, 7.5],
        [`${formatTimeGrid(l.start)}–${formatTimeGrid(l.end)} · ${l.room}`, font, 6.5],
        ...(l.className && showClass ? [[l.className, font, 6.5] as [string, PDFFont, number]] : []),
      ];
      let ty = y1 + h - 9;
      for (const [text, f, size] of lines) {
        if (ty < y1 + 2) break;
        page.drawText(fit(text, f, size, w - 8), { x: x + 3, y: ty, size, font: f, color: ink });
        ty -= size + 2.5;
      }
    }
  });

  page.drawText(`Préau · édité le ${formatDateShort(isoDay(reference))}`, { x: margin, y: margin - 4, size: 7, font, color: muted });

  return pdf.save();
}
