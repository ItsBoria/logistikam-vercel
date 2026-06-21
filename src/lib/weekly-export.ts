// One-page weekly mission plan export — modeled after the printed work-plan form.
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";
import bidiFactory from "bidi-js";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  PageOrientation,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import { attachHeebo } from "./pdf-fonts";
import type { DayNoteRow, MissionRow, WeekRow } from "./missions.functions";
import {
  WORK_DAYS,
  formatWorkDate,
  isoWeekToWorkweekRange,
  workdayDate,
  type Workday,
} from "./workweek";

const bidi = bidiFactory();
const DAY_NAMES = ["יום א׳", "יום ב׳", "יום ג׳", "יום ד׳", "יום ה׳"] as const;

export const isoWeekToRange = isoWeekToWorkweekRange;

function groupMissions(missions: MissionRow[]) {
  const grouped: Record<number, MissionRow[]> = {};
  for (const mission of missions) {
    if (mission.day_of_week >= 0 && mission.day_of_week <= 4) {
      (grouped[mission.day_of_week] ??= []).push(mission);
    }
  }
  return grouped;
}

function groupNotes(dayNotes: DayNoteRow[]) {
  const notes: Record<number, string> = {};
  for (const note of dayNotes) {
    if (note.day_of_week >= 0 && note.day_of_week <= 4) notes[note.day_of_week] = note.influencers;
  }
  return notes;
}

function formatSlashDate(date: Date) {
  return formatWorkDate(date).replaceAll(".", "/");
}

/**
 * Protect every Latin/numeric token with Unicode LTR isolation before applying
 * the Unicode bidi algorithm. This keeps 09:00–10:30, 22/06/2026, ₪1,250,
 * phone numbers and identifiers in their logical order inside Hebrew text.
 */
function toPdfVisualOrder(text: string): string {
  if (!text) return text;
  const protectedText = text.replace(
    /(?:\d{1,2}:\d{2}(?:[–-]\d{1,2}:\d{2})?|\d{1,2}[./]\d{1,2}[./]\d{2,4}|₪\s?\d[\d,]*(?:\.\d+)?|\+?\d[\d-]{6,}\d|[A-Za-z]+(?:[-/ ][A-Za-z0-9]+)*|[A-Z]{2,}-\d+|\d[\d,.-]*\d)/gu,
    (token) => `\u2066${token}\u2069`,
  );
  return protectedText
    .split("\n")
    .map((line) =>
      line ? bidi.getReorderedString(line, bidi.getEmbeddingLevels(line, "rtl")) : line,
    )
    .join("\n")
    .replace(/[\u2066-\u2069]/g, "");
}

function rtlOptions(align: "left" | "center" | "right" = "right") {
  return {
    align,
    isInputVisual: true,
    isInputRtl: true,
    isOutputVisual: true,
    isOutputRtl: true,
    isSymmetricSwapping: true,
  } as any;
}

function fitLines(pdf: jsPDF, text: string, width: number, maxLines: number) {
  const lines = (pdf.splitTextToSize(text, width) as string[]).slice(0, maxLines);
  if ((pdf.splitTextToSize(text, width) as string[]).length > maxLines && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1]}…`;
  }
  return lines;
}

function drawRtl(
  pdf: jsPDF,
  text: string,
  right: number,
  top: number,
  width: number,
  lineHeight: number,
  maxLines: number,
  align: "left" | "center" | "right" = "right",
) {
  const lines = fitLines(pdf, text, width, maxLines);
  lines.forEach((line, index) => {
    const x = align === "center" ? right - width / 2 : align === "left" ? right - width : right;
    pdf.text(toPdfVisualOrder(line), x, top + index * lineHeight, rtlOptions(align));
  });
}

type GridGeometry = {
  pageW: number;
  pageH: number;
  margin: number;
  gridTop: number;
  gridBottom: number;
  gridLeft: number;
  gridRight: number;
  labelW: number;
  dayW: number;
  execW: number;
  planW: number;
};

function geometry(pdf: jsPDF): GridGeometry {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 22;
  const labelW = 56;
  const gridLeft = margin;
  const gridRight = pageW - margin;
  const dayW = (gridRight - gridLeft - labelW) / 5;
  const execW = 28;
  return {
    pageW,
    pageH,
    margin,
    gridTop: 91,
    gridBottom: pageH - 63,
    gridLeft,
    gridRight,
    labelW,
    dayW,
    execW,
    planW: dayW - execW,
  };
}

function dayRight(g: GridGeometry, day: Workday) {
  return g.gridRight - g.labelW - day * g.dayW;
}

function drawHeader(pdf: jsPDF, week: WeekRow, brandName: string, g: GridGeometry) {
  const range = isoWeekToRange(week.year, week.week);
  pdf.setTextColor(24, 24, 27);
  pdf.setFont("Heebo", "bold");
  pdf.setFontSize(19);
  pdf.text(toPdfVisualOrder(brandName), g.pageW / 2, 34, rtlOptions("center"));

  pdf.setFontSize(10.5);
  const numericLine = `W${String(week.week).padStart(2, "0")} · ${formatSlashDate(range.start)}–${formatSlashDate(range.end)} · ${week.year}`;
  pdf.text(numericLine, g.pageW / 2, 51, { align: "center" });

  if (week.notes?.trim()) {
    pdf.setFont("Heebo", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(82, 82, 91);
    drawRtl(pdf, week.notes, g.gridRight, 68, g.gridRight - g.gridLeft, 8.5, 1);
  }

  pdf.setDrawColor(63, 63, 70);
  pdf.setLineWidth(0.8);
  pdf.line(g.gridLeft, 79, g.gridRight, 79);
}

function drawColumnHeaders(pdf: jsPDF, week: WeekRow, g: GridGeometry) {
  const range = isoWeekToRange(week.year, week.week);
  const dayHeaderH = 24;
  const subHeaderH = 19;
  const y = g.gridTop;

  pdf.setFillColor(244, 244, 245);
  pdf.setDrawColor(82, 82, 91);
  pdf.setLineWidth(0.6);
  pdf.rect(g.gridLeft, y, g.gridRight - g.gridLeft, dayHeaderH + subHeaderH, "FD");

  for (const day of WORK_DAYS) {
    const right = dayRight(g, day);
    const left = right - g.dayW;
    const date = formatSlashDate(workdayDate(range, day));
    pdf.line(left, y, left, y + dayHeaderH + subHeaderH);
    pdf.line(right - g.execW, y + dayHeaderH, right - g.execW, y + dayHeaderH + subHeaderH);
    pdf.line(left, y + dayHeaderH, right, y + dayHeaderH);

    pdf.setFont("Heebo", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(24, 24, 27);
    pdf.text(toPdfVisualOrder(DAY_NAMES[day]), right - 7, y + 14, rtlOptions());
    pdf.setFont("Heebo", "normal");
    pdf.setFontSize(8);
    pdf.text(date, left + 7, y + 14, { align: "left" });

    pdf.setFont("Heebo", "bold");
    pdf.setFontSize(7.5);
    pdf.text(
      toPdfVisualOrder("תכנון"),
      right - g.execW - g.planW / 2,
      y + 37,
      rtlOptions("center"),
    );
    pdf.text(toPdfVisualOrder("ביצוע"), right - g.execW / 2, y + 37, rtlOptions("center"));
  }

  const labelLeft = g.gridRight - g.labelW;
  pdf.line(labelLeft, y, labelLeft, y + dayHeaderH + subHeaderH);
}

function drawInfluencers(
  pdf: jsPDF,
  notes: Record<number, string>,
  g: GridGeometry,
  y: number,
  height: number,
) {
  pdf.setDrawColor(113, 113, 122);
  pdf.setFillColor(250, 250, 250);
  pdf.rect(g.gridLeft, y, g.gridRight - g.gridLeft, height, "FD");

  for (const day of WORK_DAYS) {
    const right = dayRight(g, day);
    const left = right - g.dayW;
    pdf.line(left, y, left, y + height);
    pdf.line(right - g.execW, y, right - g.execW, y + height);
    pdf.setFont("Heebo", "normal");
    pdf.setFontSize(6.8);
    pdf.setTextColor(39, 39, 42);
    drawRtl(pdf, notes[day] ?? "", right - g.execW - 4, y + 12, g.planW - 8, 8, 4);
  }

  const labelLeft = g.gridRight - g.labelW;
  pdf.setFillColor(228, 228, 231);
  pdf.rect(labelLeft, y, g.labelW, height, "FD");
  pdf.setFont("Heebo", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(39, 39, 42);
  drawRtl(pdf, "גורמים\nמשפיעים", g.gridRight - 7, y + height / 2 - 3, g.labelW - 14, 10, 2);
}

function missionText(mission: MissionRow, includeDetails: boolean) {
  const title = mission.title.trim();
  if (!includeDetails || !mission.details?.trim()) return title;
  return `${title}\n${mission.details.trim()}`;
}

function drawMissionRows(
  pdf: jsPDF,
  grouped: Record<number, MissionRow[]>,
  g: GridGeometry,
  y: number,
  height: number,
) {
  const missionCount = Math.max(1, ...WORK_DAYS.map((day) => (grouped[day] ?? []).length));
  const rowCount = Math.max(6, missionCount);
  const rowH = height / rowCount;
  const fontSize =
    missionCount >= 18 ? 5.4 : missionCount >= 13 ? 6 : missionCount >= 9 ? 6.7 : 7.4;
  const lineHeight = fontSize + 1.2;
  const includeDetails = missionCount <= 10;
  const maxLines = Math.max(
    1,
    Math.min(includeDetails ? 3 : 2, Math.floor((rowH - 4) / lineHeight)),
  );

  pdf.setDrawColor(113, 113, 122);
  pdf.setFillColor(255, 255, 255);
  pdf.rect(g.gridLeft, y, g.gridRight - g.gridLeft, height, "FD");

  for (let row = 0; row < rowCount; row += 1) {
    const rowY = y + row * rowH;
    if (row > 0) pdf.line(g.gridLeft, rowY, g.gridRight, rowY);

    for (const day of WORK_DAYS) {
      const right = dayRight(g, day);
      const left = right - g.dayW;
      const mission = grouped[day]?.[row];
      pdf.line(left, rowY, left, rowY + rowH);
      pdf.line(right - g.execW, rowY, right - g.execW, rowY + rowH);
      if (!mission) continue;

      if (mission.done) {
        pdf.setFont("Heebo", "bold");
        pdf.setFontSize(Math.max(7, fontSize));
        pdf.setTextColor(22, 101, 52);
        pdf.text("✓", right - g.execW / 2, rowY + rowH / 2 + 2.5, { align: "center" });
      }

      const planRight = right - g.execW - 4;
      if (mission.due_time) {
        pdf.setFont("Heebo", "bold");
        pdf.setFontSize(fontSize);
        pdf.setTextColor(30, 64, 175);
        pdf.text(mission.due_time.slice(0, 5), left + 4, rowY + fontSize + 2, { align: "left" });
      }

      pdf.setFont("Heebo", mission.done ? "normal" : "bold");
      pdf.setFontSize(fontSize);
      pdf.setTextColor(24, 24, 27);
      drawRtl(
        pdf,
        missionText(mission, includeDetails),
        planRight,
        rowY + fontSize + 2,
        g.planW - 10,
        lineHeight,
        maxLines,
      );
    }
  }

  const labelLeft = g.gridRight - g.labelW;
  pdf.setFillColor(228, 228, 231);
  pdf.rect(labelLeft, y, g.labelW, height, "FD");
  pdf.setFont("Heebo", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(39, 39, 42);
  pdf.text(
    toPdfVisualOrder("משימות"),
    g.gridRight - g.labelW / 2,
    y + height / 2,
    rtlOptions("center"),
  );
}

function drawSignatures(pdf: jsPDF, week: WeekRow, g: GridGeometry) {
  const y = g.gridBottom + 17;
  pdf.setFont("Heebo", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(39, 39, 42);

  const author = `חתימת מנהל עבודה: ${week.author_signature_name ?? "________________"}`;
  const approver = `חתימת מנהל אתר אחסון: ${week.approver_signature_name ?? "________________"}`;
  pdf.text(toPdfVisualOrder(author), g.gridLeft, y, rtlOptions("left"));
  pdf.text(toPdfVisualOrder(approver), g.gridRight, y, rtlOptions());
}

export async function buildWeeklyPDF(
  week: WeekRow,
  missions: MissionRow[],
  dayNotes: DayNoteRow[] = [],
  brandName = "תוכנית עבודה שבועית",
) {
  const pdf = new jsPDF({
    unit: "pt",
    format: "a4",
    orientation: "landscape",
    putOnlyUsedFonts: true,
  });
  await attachHeebo(pdf);
  pdf.setFont("Heebo", "normal");

  const g = geometry(pdf);
  const grouped = groupMissions(missions);
  const notes = groupNotes(dayNotes);
  const headerRowsH = 43;
  const influencersH = 56;
  const missionTop = g.gridTop + headerRowsH + influencersH;

  drawHeader(pdf, week, brandName, g);
  drawColumnHeaders(pdf, week, g);
  drawInfluencers(pdf, notes, g, g.gridTop + headerRowsH, influencersH);
  drawMissionRows(pdf, grouped, g, missionTop, g.gridBottom - missionTop);
  drawSignatures(pdf, week, g);
  return pdf;
}

export async function downloadWeeklyPDF(
  week: WeekRow,
  missions: MissionRow[],
  dayNotes: DayNoteRow[] = [],
  brandName = "תוכנית עבודה שבועית",
) {
  const pdf = await buildWeeklyPDF(week, missions, dayNotes, brandName);
  pdf.save(`weekly-${week.year}-w${String(week.week).padStart(2, "0")}.pdf`);
}

// ---------------- DOCX: the same one-page grid ----------------
const DOCX_FONT = "Arial";
const PAGE_W = 16838;
const PAGE_H = 11906;
const MARGIN = 360;
const CONTENT_W = PAGE_W - MARGIN * 2;
const LABEL_W = 920;
const DAY_W = Math.floor((CONTENT_W - LABEL_W) / 5);
const EXEC_W = 430;
const PLAN_W = DAY_W - EXEC_W;
const border = { style: BorderStyle.SINGLE, size: 6, color: "52525B" };
const borders = { top: border, bottom: border, left: border, right: border };

function rtlParagraph(
  text: string,
  size = 16,
  bold = false,
  align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.RIGHT,
) {
  return new Paragraph({
    bidirectional: true,
    alignment: align,
    spacing: { before: 0, after: 0, line: Math.max(160, size * 11) },
    children: [
      new TextRun({
        text,
        size,
        bold,
        font: DOCX_FONT,
        rightToLeft: true,
      }),
    ],
  });
}

function ltrParagraph(
  text: string,
  size = 15,
  bold = false,
  align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT,
) {
  return new Paragraph({
    alignment: align,
    spacing: { before: 0, after: 0, line: Math.max(160, size * 11) },
    children: [new TextRun({ text, size, bold, font: DOCX_FONT, rightToLeft: false })],
  });
}

function cell(children: Paragraph[], width: number, fill = "FFFFFF", columnSpan?: number) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    columnSpan,
    verticalAlign: VerticalAlign.CENTER,
    borders,
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 40, bottom: 40, left: 55, right: 55 },
    children: children.length ? children : [rtlParagraph("")],
  });
}

function compactMissionParagraph(mission: MissionRow, fontSize: number, includeDetails: boolean) {
  const children: TextRun[] = [];
  if (mission.due_time) {
    children.push(
      new TextRun({
        text: `${mission.due_time.slice(0, 5)}  `,
        size: fontSize,
        bold: true,
        font: DOCX_FONT,
        rightToLeft: false,
      }),
    );
  }
  children.push(
    new TextRun({
      text: mission.title,
      size: fontSize,
      bold: !mission.done,
      font: DOCX_FONT,
      rightToLeft: true,
    }),
  );
  if (includeDetails && mission.details?.trim()) {
    children.push(new TextRun({ break: 1, text: "" }));
    children.push(
      new TextRun({
        text: mission.details.trim(),
        size: Math.max(11, fontSize - 1),
        font: DOCX_FONT,
        color: "52525B",
        rightToLeft: true,
      }),
    );
  }
  return new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    spacing: { before: 0, after: 0, line: Math.max(150, fontSize * 10) },
    children,
  });
}

export async function buildWeeklyDOCXBlob(
  week: WeekRow,
  missions: MissionRow[],
  dayNotes: DayNoteRow[] = [],
  brandName = "תוכנית עבודה שבועית",
) {
  const grouped = groupMissions(missions);
  const notes = groupNotes(dayNotes);
  const range = isoWeekToRange(week.year, week.week);
  const missionCount = Math.max(1, ...WORK_DAYS.map((day) => (grouped[day] ?? []).length));
  const rowCount = Math.max(6, missionCount);
  const missionFont =
    missionCount >= 18 ? 11 : missionCount >= 13 ? 12 : missionCount >= 9 ? 13 : 15;
  const includeDetails = missionCount <= 10;
  const missionRowHeight = Math.max(210, Math.floor(5200 / rowCount));

  const header1 = new TableRow({
    height: { value: 390, rule: HeightRule.EXACT },
    children: [
      cell([rtlParagraph("")], LABEL_W, "F4F4F5"),
      ...WORK_DAYS.flatMap((day) => [
        cell(
          [
            rtlParagraph(DAY_NAMES[day], 17, true, AlignmentType.CENTER),
            ltrParagraph(formatSlashDate(workdayDate(range, day)), 14, false, AlignmentType.CENTER),
          ],
          DAY_W,
          "F4F4F5",
          2,
        ),
      ]),
    ],
  });

  const header2 = new TableRow({
    height: { value: 280, rule: HeightRule.EXACT },
    children: [
      cell([rtlParagraph("")], LABEL_W, "F4F4F5"),
      ...WORK_DAYS.flatMap(() => [
        cell([rtlParagraph("תכנון", 14, true, AlignmentType.CENTER)], PLAN_W, "F4F4F5"),
        cell([rtlParagraph("ביצוע", 13, true, AlignmentType.CENTER)], EXEC_W, "F4F4F5"),
      ]),
    ],
  });

  const influencers = new TableRow({
    cantSplit: true,
    height: { value: 920, rule: HeightRule.EXACT },
    children: [
      cell([rtlParagraph("גורמים\nמשפיעים", 14, true, AlignmentType.CENTER)], LABEL_W, "E4E4E7"),
      ...WORK_DAYS.flatMap((day) => [
        cell([rtlParagraph(notes[day] ?? "", 12)], PLAN_W, "FAFAFA"),
        cell([rtlParagraph("")], EXEC_W, "FAFAFA"),
      ]),
    ],
  });

  const missionRows = Array.from({ length: rowCount }, (_, index) => {
    return new TableRow({
      cantSplit: true,
      height: { value: missionRowHeight, rule: HeightRule.EXACT },
      children: [
        cell(
          index === Math.floor(rowCount / 2)
            ? [rtlParagraph("משימות", 15, true, AlignmentType.CENTER)]
            : [],
          LABEL_W,
          "E4E4E7",
        ),
        ...WORK_DAYS.flatMap((day) => {
          const mission = grouped[day]?.[index];
          return [
            cell(
              mission ? [compactMissionParagraph(mission, missionFont, includeDetails)] : [],
              PLAN_W,
            ),
            cell(mission?.done ? [rtlParagraph("✓", 15, true, AlignmentType.CENTER)] : [], EXEC_W),
          ];
        }),
      ],
    });
  });

  const table = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [LABEL_W, ...WORK_DAYS.flatMap(() => [PLAN_W, EXEC_W])],
    layout: TableLayoutType.FIXED,
    visuallyRightToLeft: true,
    rows: [header1, header2, influencers, ...missionRows],
  });

  const numericHeader = `W${String(week.week).padStart(2, "0")} · ${formatSlashDate(range.start)}–${formatSlashDate(range.end)} · ${week.year}`;
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: DOCX_FONT, size: 15 },
          paragraph: { spacing: { before: 0, after: 0 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_W, height: PAGE_H, orientation: PageOrientation.LANDSCAPE },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        children: [
          rtlParagraph(brandName, 34, true, AlignmentType.CENTER),
          ltrParagraph(numericHeader, 18, true, AlignmentType.CENTER),
          ...(week.notes?.trim()
            ? [rtlParagraph(week.notes, 12, false, AlignmentType.CENTER)]
            : []),
          new Paragraph({ spacing: { after: 80 }, children: [] }),
          table,
          new Paragraph({ spacing: { before: 80 }, children: [] }),
          new Table({
            width: { size: CONTENT_W, type: WidthType.DXA },
            columnWidths: [Math.floor(CONTENT_W / 2), Math.floor(CONTENT_W / 2)],
            layout: TableLayoutType.FIXED,
            rows: [
              new TableRow({
                children: [
                  cell(
                    [
                      rtlParagraph(
                        `חתימת מנהל עבודה: ${week.author_signature_name ?? "________________"}`,
                        13,
                        true,
                      ),
                    ],
                    Math.floor(CONTENT_W / 2),
                  ),
                  cell(
                    [
                      rtlParagraph(
                        `חתימת מנהל אתר אחסון: ${week.approver_signature_name ?? "________________"}`,
                        13,
                        true,
                      ),
                    ],
                    Math.floor(CONTENT_W / 2),
                  ),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });
  return Packer.toBlob(doc);
}

export async function downloadWeeklyDOCX(
  week: WeekRow,
  missions: MissionRow[],
  dayNotes: DayNoteRow[] = [],
  brandName = "תוכנית עבודה שבועית",
) {
  const blob = await buildWeeklyDOCXBlob(week, missions, dayNotes, brandName);
  saveAs(blob, `weekly-${week.year}-w${String(week.week).padStart(2, "0")}.docx`);
}
