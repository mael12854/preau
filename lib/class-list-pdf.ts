import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { fit } from "@/lib/edt-pdf";
import { formatDateLong } from "@/lib/format";

export type ClassListRow = { lastName: string; firstName: string; groups: string; guardians: string };

/** Liste de classe en PDF (A4 portrait) : n°, nom, prénom, groupes, responsables ; plusieurs pages si besoin. */
export async function renderClassListPdf(input: {
  className: string;
  school: string;
  year: string;
  reference: Date;
  rows: ClassListRow[];
}) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Liste de classe · ${input.className}`);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.11, 0.14, 0.13);
  const muted = rgb(0.37, 0.42, 0.4);
  const line = rgb(0.86, 0.85, 0.81);
  const band = rgb(0.96, 0.95, 0.92);
  const W = 595;
  const H = 842;
  const m = 36;
  // Colonnes : n°, nom, prénom, groupes, responsables.
  const cols = [
    { title: "N°", w: 28 },
    { title: "Nom", w: 120 },
    { title: "Prénom", w: 105 },
    { title: "Groupes", w: 110 },
    { title: "Responsables légaux", w: W - 2 * m - 28 - 120 - 105 - 110 },
  ];
  const rowH = 22;

  let page = pdf.addPage([W, H]);
  let y = H - m;
  const header = (first: boolean) => {
    if (first) {
      page.drawText(fit(`Liste de classe · ${input.className}`, bold, 16, W - 2 * m), { x: m, y: y - 14, size: 16, font: bold, color: ink });
      page.drawText(fit(`${input.school} · ${input.year}`, font, 10, W - 2 * m), { x: m, y: y - 32, size: 10, font, color: muted });
      page.drawText(
        fit(`${input.rows.length} élève${input.rows.length > 1 ? "s" : ""} · liste du ${formatDateLong(input.reference)}`, font, 10, W - 2 * m),
        { x: m, y: y - 46, size: 10, font, color: muted },
      );
      y -= 66;
    }
    page.drawRectangle({ x: m, y: y - rowH, width: W - 2 * m, height: rowH, color: band });
    let x = m;
    for (const c of cols) {
      page.drawText(fit(c.title, bold, 9, c.w - 8), { x: x + 4, y: y - 15, size: 9, font: bold, color: ink });
      x += c.w;
    }
    y -= rowH;
  };
  header(true);

  input.rows.forEach((r, i) => {
    if (y - rowH < m + 20) {
      page = pdf.addPage([W, H]);
      y = H - m;
      header(false);
    }
    const cells = [String(i + 1), r.lastName.toUpperCase(), r.firstName, r.groups || "—", r.guardians || "—"];
    let x = m;
    cells.forEach((text, k) => {
      const f = k === 1 ? bold : font;
      page.drawText(fit(text, f, 9.5, cols[k].w - 8), { x: x + 4, y: y - 15, size: 9.5, font: f, color: k === 0 || text === "—" ? muted : ink });
      x += cols[k].w;
    });
    page.drawLine({ start: { x: m, y: y - rowH }, end: { x: W - m, y: y - rowH }, thickness: 0.6, color: line });
    y -= rowH;
  });
  if (!input.rows.length) page.drawText("Aucun élève dans cette classe.", { x: m, y: y - 20, size: 10, font, color: muted });

  // Pied de page : pagination.
  const pages = pdf.getPages();
  pages.forEach((p, i) =>
    p.drawText(`${input.className} · page ${i + 1}/${pages.length}`, { x: m, y: m - 14, size: 8, font, color: muted }),
  );
  return pdf.save();
}
