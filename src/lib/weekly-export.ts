// Weekly mission plan export - polished A4 landscape PDF and DOCX.
import { jsPDF } from "jspdf";
import bidiFactory from "bidi-js";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  Packer,
  PageOrientation,
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
import type { DayNoteRow, MissionRow, WeekRow } from "./missions.functions";

const bidi = bidiFactory();

const WORK_DAYS = [0, 1, 2, 3, 4] as const;
const DAY_NAMES = ["יום א'", "יום ב'", "יום ג'", "יום ד'", "יום ה'"];
const HEB_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

const COLORS = {
  ink: "#18324A",
  muted: "#66788A",
  accent: "#2A9D8F",
  accentDark: "#207B70",
  accentSoft: "#E7F5F2",
  blueSoft: "#EBF3FA",
  violetSoft: "#F2EFFA",
  amberSoft: "#FFF5DE",
  roseSoft: "#FCEFF2",
  border: "#B8C8D6",
  borderStrong: "#7E94A6",
  surface: "#F8FAFC",
  completed: "#3D7C68",
  completedSoft: "#E4F3EC",
};

const DAY_FILLS = [
  COLORS.accentSoft,
  COLORS.blueSoft,
  COLORS.violetSoft,
  COLORS.amberSoft,
  COLORS.roseSoft,
];

function hexRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16),
  ];
}

function toVisual(str: string): string {
  if (!str) return str;
  return str.split("\n").map((line) => {
    if (!line) return line;
    const levels = bidi.getEmbeddingLevels(line, "rtl");
    return bidi.getReorderedString(line, levels);
  }).join("\n");
}

export function isoWeekToRange(year: number, week: number): { start: Date; end: Date } {
  const simple = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = simple.getUTCDay() || 7;
  const isoMon = new Date(simple);
  isoMon.setUTCDate(simple.getUTCDate() - (dayOfWeek - 1) + (week - 1) * 7);
  const start = new Date(isoMon);
  start.setUTCDate(isoMon.getUTCDate() - 1);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 4);
  return { start, end };
}

function fmtDate(date: Date): string {
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
}

function weekSubtitle(week: WeekRow): string {
  const { start, end } = isoWeekToRange(week.year, week.week);
  return `שבוע ${week.week} חודש ${HEB_MONTHS[start.getUTCMonth()]} - ${fmtDate(start)}-${fmtDate(end)} - ${week.year}`;
}

function weekSubtitleVisualSegments(week: WeekRow): string[] {
  const { start, end } = isoWeekToRange(week.year, week.week);
  return [
    String(week.year),
    " - ",
    fmtDate(end),
    "-",
    fmtDate(start),
    " - ",
    toVisual(HEB_MONTHS[start.getUTCMonth()]),
    toVisual(" חודש "),
    String(week.week),
    toVisual("שבוע "),
  ];
}

function groupMissions(missions: MissionRow[]): Record<number, MissionRow[]> {
  const grouped: Record<number, MissionRow[]> = {};
  for (const mission of missions) {
    if (!WORK_DAYS.includes(mission.day_of_week as (typeof WORK_DAYS)[number])) continue;
    (grouped[mission.day_of_week] ??= []).push(mission);
  }
  return grouped;
}

function dayContentScore(day: number, grouped: Record<number, MissionRow[]>, notes: Record<number, string>): number {
  const dayMissions = grouped[day] ?? [];
  const missionScore = dayMissions.reduce((score, mission) => (
    score
      + 34
      + Math.min(mission.title.length, 100) * 1.4
      + Math.min(mission.details?.length ?? 0, 180) * 0.55
      + (mission.due_time ? 12 : 0)
  ), 0);
  return 90 + missionScore + Math.min(notes[day]?.length ?? 0, 160) * 0.45;
}

function distributeWidths(scores: number[], total: number, min: number, max: number): number[] {
  const widths = Array(scores.length).fill(min);
  let remaining = total - min * scores.length;
  const active = new Set(scores.map((_, index) => index));

  while (remaining > 0.1 && active.size) {
    const activeScore = Array.from(active).reduce((sum, index) => sum + scores[index], 0) || active.size;
    let distributed = 0;
    for (const index of Array.from(active)) {
      const share = remaining * (scores[index] / activeScore);
      const capacity = max - widths[index];
      const amount = Math.min(share, capacity);
      widths[index] += amount;
      distributed += amount;
      if (capacity - amount < 0.1) active.delete(index);
    }
    if (distributed < 0.1) break;
    remaining -= distributed;
  }

  if (remaining > 0) {
    const add = remaining / widths.length;
    widths.forEach((_, index) => { widths[index] += add; });
  }
  const correction = total - widths.reduce((sum, width) => sum + width, 0);
  widths[widths.length - 1] += correction;
  return widths;
}

type Pdf = jsPDF;
const VISUAL_TEXT_OPTIONS = {
  isInputVisual: true,
  isOutputVisual: true,
  isInputRtl: true,
  isOutputRtl: true,
  isSymmetricSwapping: false,
};

function setPdfColor(pdf: Pdf, kind: "text" | "draw" | "fill", color: string) {
  const [r, g, b] = hexRgb(color);
  if (kind === "text") pdf.setTextColor(r, g, b);
  else if (kind === "draw") pdf.setDrawColor(r, g, b);
  else pdf.setFillColor(r, g, b);
}

function rtlText(
  pdf: Pdf,
  text: string,
  xRight: number,
  y: number,
  maxWidth?: number,
  options: { align?: "right" | "center"; lineHeight?: number } = {},
): number {
  if (!text) return 0;
  const lines = maxWidth ? pdf.splitTextToSize(text, maxWidth) as string[] : [text];
  const lineHeight = options.lineHeight ?? pdf.getLineHeight() / pdf.internal.scaleFactor;
  lines.forEach((line, index) => {
    pdf.text(toVisual(line), xRight, y + index * lineHeight, {
      align: options.align ?? "right",
      ...VISUAL_TEXT_OPTIONS,
    } as any);
  });
  return lines.length * lineHeight;
}

function wrappedLines(pdf: Pdf, text: string, width: number): string[] {
  if (!text) return [];
  return pdf.splitTextToSize(text, width) as string[];
}

function missionHeight(pdf: Pdf, mission: MissionRow | undefined, width: number): number {
  if (!mission) return 34;
  pdf.setFontSize(8.5);
  const titleLines = wrappedLines(pdf, mission.title, width - 12).length;
  pdf.setFontSize(7.4);
  const detailLines = mission.details ? wrappedLines(pdf, mission.details, width - 12).length : 0;
  return Math.max(38, 17 + titleLines * 10 + detailLines * 8 + (mission.details ? 4 : 0));
}

function drawHeader(pdf: Pdf, week: WeekRow, compact = false) {
  const pageW = pdf.internal.pageSize.getWidth();
  const top = compact ? 22 : 25;
  setPdfColor(pdf, "text", COLORS.ink);
  pdf.setFont("Heebo", "bold");
  pdf.setFontSize(compact ? 15 : 23);
  pdf.text(toVisual("תוכנית עבודה שבועית"), pageW / 2, top, {
    align: "center",
    ...VISUAL_TEXT_OPTIONS,
  } as any);

  pdf.setFont("Heebo", "normal");
  pdf.setFontSize(compact ? 8.5 : 10.5);
  setPdfColor(pdf, "text", COLORS.muted);
  const subtitleParts = weekSubtitleVisualSegments(week);
  const subtitleWidth = subtitleParts.reduce((sum, part) => sum + pdf.getTextWidth(part), 0);
  let subtitleX = pageW / 2 - subtitleWidth / 2;
  for (const part of subtitleParts) {
    pdf.text(part, subtitleX, top + (compact ? 15 : 20));
    subtitleX += pdf.getTextWidth(part);
  }

  setPdfColor(pdf, "draw", COLORS.accent);
  pdf.setLineWidth(2.2);
  pdf.line(pageW / 2 - 35, top + (compact ? 23 : 30), pageW / 2 + 35, top + (compact ? 23 : 30));
}

type PdfTableGeometry = {
  labelLeft: number;
  labelWidth: number;
  dayWidths: number[];
  dayLefts: number[];
  planWidths: number[];
};

function pdfGeometry(
  pdf: Pdf,
  grouped: Record<number, MissionRow[]>,
  noteMap: Record<number, string>,
): PdfTableGeometry {
  const margin = 25;
  const totalWidth = pdf.internal.pageSize.getWidth() - margin * 2;
  const labelWidth = 65;
  const dayTotal = totalWidth - labelWidth;
  const average = dayTotal / WORK_DAYS.length;
  const scores = WORK_DAYS.map((day) => dayContentScore(day, grouped, noteMap));
  const dayWidths = distributeWidths(scores, dayTotal, average * 0.84, average * 1.18);
  const labelLeft = pdf.internal.pageSize.getWidth() - margin - labelWidth;
  const dayLefts: number[] = [];
  const planWidths: number[] = [];
  let right = labelLeft;
  dayWidths.forEach((dayWidth, index) => {
    const left = right - dayWidth;
    dayLefts[index] = left;
    planWidths[index] = dayWidth * 0.78;
    right = left;
  });
  return { labelLeft, labelWidth, dayWidths, dayLefts, planWidths };
}

function drawTableHeader(pdf: Pdf, week: WeekRow, y: number, geometry: PdfTableGeometry): number {
  const { start } = isoWeekToRange(week.year, week.week);
  const headHeight = 35;
  const subHeight = 20;
  const tableLeft = geometry.dayLefts[WORK_DAYS.length - 1];
  const tableRight = geometry.labelLeft + geometry.labelWidth;

  setPdfColor(pdf, "fill", COLORS.ink);
  setPdfColor(pdf, "draw", COLORS.borderStrong);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(geometry.labelLeft, y, geometry.labelWidth, headHeight + subHeight, 3, 3, "FD");
  pdf.setFont("Heebo", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  rtlText(pdf, "קטגוריה", geometry.labelLeft + geometry.labelWidth / 2, y + 31, undefined, { align: "center" });

  WORK_DAYS.forEach((day, index) => {
    const left = geometry.dayLefts[index];
    const width = geometry.dayWidths[index];
    const planWidth = geometry.planWidths[index];
    const execWidth = width - planWidth;
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + day);

    setPdfColor(pdf, "fill", DAY_FILLS[index]);
    setPdfColor(pdf, "draw", COLORS.border);
    pdf.rect(left, y, width, headHeight, "FD");
    pdf.setFont("Heebo", "bold");
    pdf.setFontSize(9.2);
    setPdfColor(pdf, "text", COLORS.ink);
    rtlText(pdf, DAY_NAMES[index], left + width - 7, y + 14);
    pdf.setFont("Heebo", "normal");
    pdf.setFontSize(7.6);
    setPdfColor(pdf, "text", COLORS.muted);
    pdf.text(fmtDate(date), left + 7, y + 14);

    setPdfColor(pdf, "fill", COLORS.surface);
    setPdfColor(pdf, "draw", COLORS.border);
    pdf.rect(left, y + headHeight, planWidth, subHeight, "FD");
    pdf.rect(left + planWidth, y + headHeight, execWidth, subHeight, "FD");
    pdf.setFont("Heebo", "bold");
    pdf.setFontSize(7.6);
    setPdfColor(pdf, "text", COLORS.ink);
    rtlText(pdf, "תכנון", left + planWidth / 2, y + headHeight + 13, undefined, { align: "center" });
    rtlText(pdf, "ביצוע", left + planWidth + execWidth / 2, y + headHeight + 13, undefined, { align: "center" });
  });

  setPdfColor(pdf, "draw", COLORS.borderStrong);
  pdf.rect(tableLeft, y, tableRight - tableLeft, headHeight + subHeight);
  return y + headHeight + subHeight;
}

function drawSectionLabel(pdf: Pdf, text: string, y: number, height: number, geometry: PdfTableGeometry) {
  setPdfColor(pdf, "fill", COLORS.accentSoft);
  setPdfColor(pdf, "draw", COLORS.border);
  pdf.rect(geometry.labelLeft, y, geometry.labelWidth, height, "FD");
  pdf.setFont("Heebo", "bold");
  pdf.setFontSize(9);
  setPdfColor(pdf, "text", COLORS.accentDark);
  rtlText(pdf, text, geometry.labelLeft + geometry.labelWidth - 7, y + height / 2 + 3, geometry.labelWidth - 14);
}

function drawInfluencers(
  pdf: Pdf,
  y: number,
  geometry: PdfTableGeometry,
  noteMap: Record<number, string>,
): number {
  pdf.setFont("Heebo", "normal");
  pdf.setFontSize(8);
  const heights = WORK_DAYS.map((day, index) => (
    Math.max(52, wrappedLines(pdf, noteMap[day] ?? "", geometry.planWidths[index] - 12).length * 10 + 18)
  ));
  const height = Math.min(82, Math.max(...heights));
  drawSectionLabel(pdf, "גורמים\nמשפיעים", y, height, geometry);

  WORK_DAYS.forEach((day, index) => {
    const left = geometry.dayLefts[index];
    const width = geometry.dayWidths[index];
    const planWidth = geometry.planWidths[index];
    setPdfColor(pdf, "fill", "#FFFFFF");
    setPdfColor(pdf, "draw", COLORS.border);
    pdf.rect(left, y, planWidth, height, "FD");
    pdf.rect(left + planWidth, y, width - planWidth, height, "FD");
    pdf.setFont("Heebo", "normal");
    pdf.setFontSize(8);
    setPdfColor(pdf, "text", COLORS.ink);
    rtlText(pdf, noteMap[day] ?? "", left + planWidth - 6, y + 15, planWidth - 12, { lineHeight: 10 });
  });
  return y + height;
}

function drawMissionPlan(pdf: Pdf, mission: MissionRow, left: number, y: number, width: number) {
  const time = mission.due_time?.slice(0, 5);
  const indicator = mission.done ? "✓" : "□";
  pdf.setFont("Heebo", "bold");
  pdf.setFontSize(8);
  setPdfColor(pdf, "text", mission.done ? COLORS.completed : COLORS.accentDark);
  pdf.text(indicator, left + width - 7, y + 13, { align: "right" } as any);
  if (time) {
    pdf.setFont("Heebo", "normal");
    pdf.setFontSize(7.5);
    setPdfColor(pdf, "text", COLORS.muted);
    pdf.text(time, left + 6, y + 13);
  }

  pdf.setFont("Heebo", "bold");
  pdf.setFontSize(8.5);
  setPdfColor(pdf, "text", mission.done ? COLORS.completed : COLORS.ink);
  const titleY = y + 24;
  const titleHeight = rtlText(pdf, mission.title, left + width - 7, titleY, width - 14, { lineHeight: 10 });
  if (mission.done) {
    setPdfColor(pdf, "draw", COLORS.completed);
    pdf.setLineWidth(0.35);
    pdf.line(left + 7, titleY - 3, left + width - 7, titleY - 3);
  }
  if (mission.details) {
    pdf.setFont("Heebo", "normal");
    pdf.setFontSize(7.2);
    setPdfColor(pdf, "text", COLORS.muted);
    rtlText(pdf, mission.details, left + width - 7, titleY + titleHeight + 2, width - 14, { lineHeight: 8 });
  }
}

function drawMissionRow(
  pdf: Pdf,
  y: number,
  rowIndex: number,
  geometry: PdfTableGeometry,
  grouped: Record<number, MissionRow[]>,
): number {
  const rowHeight = Math.max(...WORK_DAYS.map((day, index) => (
    missionHeight(pdf, grouped[day]?.[rowIndex], geometry.planWidths[index])
  )));
  drawSectionLabel(pdf, rowIndex === 0 ? "משימות" : "", y, rowHeight, geometry);

  WORK_DAYS.forEach((day, index) => {
    const mission = grouped[day]?.[rowIndex];
    const left = geometry.dayLefts[index];
    const width = geometry.dayWidths[index];
    const planWidth = geometry.planWidths[index];
    const execWidth = width - planWidth;
    setPdfColor(pdf, "fill", mission?.done ? COLORS.completedSoft : "#FFFFFF");
    setPdfColor(pdf, "draw", COLORS.border);
    pdf.rect(left, y, planWidth, rowHeight, "FD");
    pdf.rect(left + planWidth, y, execWidth, rowHeight, "FD");
    if (!mission) return;
    drawMissionPlan(pdf, mission, left, y, planWidth);
    if (mission.done) {
      pdf.setFont("Heebo", "bold");
      pdf.setFontSize(7.2);
      setPdfColor(pdf, "text", COLORS.completed);
      rtlText(pdf, "הושלם", left + planWidth + execWidth / 2, y + rowHeight / 2 + 3, undefined, { align: "center" });
    } else {
      pdf.setFont("Heebo", "normal");
      pdf.setFontSize(10);
      setPdfColor(pdf, "text", COLORS.borderStrong);
      pdf.text("□", left + planWidth + execWidth / 2, y + rowHeight / 2 + 3, { align: "center" } as any);
    }
  });
  return rowHeight;
}

function drawSignatures(pdf: Pdf, week: WeekRow) {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 28;
  const y = pageH - 58;
  const blockWidth = 250;

  const signature = (left: number, label: string, name: string | null, signedAt: string | null) => {
    pdf.setFont("Heebo", "bold");
    pdf.setFontSize(8.5);
    setPdfColor(pdf, "text", COLORS.ink);
    rtlText(pdf, label, left + blockWidth, y);
    setPdfColor(pdf, "draw", COLORS.borderStrong);
    pdf.setLineWidth(0.6);
    pdf.line(left + 8, y + 18, left + blockWidth, y + 18);
    pdf.setFont("Heebo", "normal");
    pdf.setFontSize(7.4);
    setPdfColor(pdf, "text", COLORS.muted);
    const value = name
      ? `${name}${signedAt ? ` · ${new Date(signedAt).toLocaleDateString("he-IL")}` : ""}`
      : "שם, תאריך וחתימה";
    rtlText(pdf, value, left + blockWidth, y + 31);
  };

  signature(pageW - margin - blockWidth, "חתימת מנהל אתר אחסון:", week.author_signature_name, week.author_signed_at);
  signature(margin, "חתימת מנהל עבודה:", week.approver_signature_name, week.approver_signed_at);
}

export type WeeklyPdfOptions = {
  fontBase64?: string;
};

export async function createWeeklyPDF(
  week: WeekRow,
  missions: MissionRow[],
  dayNotes: DayNoteRow[] = [],
  options: WeeklyPdfOptions = {},
): Promise<jsPDF> {
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape", compress: true });
  if (options.fontBase64) {
    pdf.addFileToVFS("Heebo.ttf", options.fontBase64);
    pdf.addFont("Heebo.ttf", "Heebo", "normal");
    pdf.addFont("Heebo.ttf", "Heebo", "bold");
  } else {
    const { attachHeebo } = await import("./pdf-fonts");
    await attachHeebo(pdf);
  }
  pdf.setFont("Heebo", "normal");

  const grouped = groupMissions(missions);
  const noteMap: Record<number, string> = {};
  for (const note of dayNotes) {
    if (WORK_DAYS.includes(note.day_of_week as (typeof WORK_DAYS)[number])) {
      noteMap[note.day_of_week] = note.influencers;
    }
  }
  const geometry = pdfGeometry(pdf, grouped, noteMap);
  const maxMissionRows = Math.max(1, ...WORK_DAYS.map((day) => grouped[day]?.length ?? 0));
  const bottomLimit = pdf.internal.pageSize.getHeight() - 94;

  let rowIndex = 0;
  let page = 0;
  while (rowIndex < maxMissionRows || page === 0) {
    if (page > 0) pdf.addPage("a4", "landscape");
    drawHeader(pdf, week, page > 0);
    let y = drawTableHeader(pdf, week, page > 0 ? 57 : 75, geometry);
    if (page === 0) y = drawInfluencers(pdf, y, geometry, noteMap);

    let drewRow = false;
    while (rowIndex < maxMissionRows) {
      const nextHeight = Math.max(...WORK_DAYS.map((day, index) => (
        missionHeight(pdf, grouped[day]?.[rowIndex], geometry.planWidths[index])
      )));
      if (drewRow && y + nextHeight > bottomLimit) break;
      y += drawMissionRow(pdf, y, rowIndex, geometry, grouped);
      rowIndex += 1;
      drewRow = true;
    }
    page += 1;
  }

  if (week.notes) {
    let y = pdf.internal.pageSize.getHeight() - 88;
    pdf.setFont("Heebo", "bold");
    pdf.setFontSize(8);
    setPdfColor(pdf, "text", COLORS.accentDark);
    rtlText(pdf, "הערות שבועיות:", pdf.internal.pageSize.getWidth() / 2 + 120, y);
    pdf.setFont("Heebo", "normal");
    setPdfColor(pdf, "text", COLORS.muted);
    rtlText(pdf, week.notes, pdf.internal.pageSize.getWidth() / 2 + 50, y, 300);
  }
  drawSignatures(pdf, week);
  return pdf;
}

export async function downloadWeeklyPDF(
  week: WeekRow,
  missions: MissionRow[],
  dayNotes: DayNoteRow[] = [],
) {
  const pdf = await createWeeklyPDF(week, missions, dayNotes);
  pdf.save(`weekly-${week.year}-w${String(week.week).padStart(2, "0")}.pdf`);
}

const docxBorder = { style: BorderStyle.SINGLE, size: 4, color: COLORS.border.slice(1) };
const docxBorders = { top: docxBorder, bottom: docxBorder, left: docxBorder, right: docxBorder };
const DOCX_FONT = "Arial";

type RtlParagraphOptions = {
  bold?: boolean;
  size?: number;
  color?: string;
  align?: (typeof AlignmentType)[keyof typeof AlignmentType];
  before?: number;
  after?: number;
};

function rtlPara(text: string, options: RtlParagraphOptions = {}) {
  return new Paragraph({
    bidirectional: true,
    alignment: options.align ?? AlignmentType.RIGHT,
    spacing: { before: options.before ?? 0, after: options.after ?? 0, line: 240 },
    children: [new TextRun({
      text,
      bold: options.bold,
      size: options.size ?? 18,
      color: options.color?.replace("#", ""),
      font: DOCX_FONT,
      rightToLeft: true,
    })],
  });
}

function ltrPara(text: string, options: RtlParagraphOptions = {}) {
  return new Paragraph({
    alignment: options.align ?? AlignmentType.LEFT,
    spacing: { before: options.before ?? 0, after: options.after ?? 0 },
    children: [new TextRun({
      text,
      bold: options.bold,
      size: options.size ?? 16,
      color: options.color?.replace("#", ""),
      font: DOCX_FONT,
    })],
  });
}

function docxCell(
  children: Paragraph[],
  width: number,
  options: { fill?: string; span?: number; center?: boolean } = {},
) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    columnSpan: options.span,
    borders: docxBorders,
    shading: options.fill
      ? { fill: options.fill.replace("#", ""), type: ShadingType.CLEAR, color: "auto" }
      : undefined,
    margins: { top: 90, bottom: 90, left: 100, right: 100 },
    verticalAlign: options.center ? VerticalAlign.CENTER : VerticalAlign.TOP,
    children: children.length ? children : [rtlPara("")],
  });
}

function missionParagraphs(mission: MissionRow | undefined): Paragraph[] {
  if (!mission) return [rtlPara("")];
  const time = mission.due_time?.slice(0, 5);
  return [
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.RIGHT,
      spacing: { after: 35, line: 220 },
      children: [
        new TextRun({
          text: mission.done ? "☑ " : "☐ ",
          bold: true,
          size: 17,
          color: (mission.done ? COLORS.completed : COLORS.accentDark).slice(1),
          font: DOCX_FONT,
          rightToLeft: true,
        }),
        ...(time ? [new TextRun({
          text: `${time}  `,
          size: 15,
          color: COLORS.muted.slice(1),
          font: DOCX_FONT,
          rightToLeft: false,
        })] : []),
      ],
    }),
    rtlPara(mission.title, {
      bold: true,
      size: 18,
      color: mission.done ? COLORS.completed : COLORS.ink,
      after: mission.details ? 35 : 0,
    }),
    ...(mission.details ? [rtlPara(mission.details, { size: 15, color: COLORS.muted })] : []),
  ];
}

export function createWeeklyDOCX(
  week: WeekRow,
  missions: MissionRow[],
  dayNotes: DayNoteRow[] = [],
): Document {
  const grouped = groupMissions(missions);
  const noteMap: Record<number, string> = {};
  for (const note of dayNotes) {
    if (WORK_DAYS.includes(note.day_of_week as (typeof WORK_DAYS)[number])) {
      noteMap[note.day_of_week] = note.influencers;
    }
  }

  const usableWidth = 15000;
  const labelWidth = 1050;
  const dayTotal = usableWidth - labelWidth;
  const average = dayTotal / WORK_DAYS.length;
  const scores = WORK_DAYS.map((day) => dayContentScore(day, grouped, noteMap));
  const dayWidths = distributeWidths(scores, dayTotal, average * 0.84, average * 1.18)
    .map((width) => Math.round(width));
  dayWidths[dayWidths.length - 1] += dayTotal - dayWidths.reduce((sum, width) => sum + width, 0);
  const planWidths = dayWidths.map((width) => Math.round(width * 0.78));
  const execWidths = dayWidths.map((width, index) => width - planWidths[index]);
  const columnWidths = [labelWidth, ...WORK_DAYS.flatMap((_, index) => [planWidths[index], execWidths[index]])];
  const { start } = isoWeekToRange(week.year, week.week);

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    height: { value: 500, rule: HeightRule.ATLEAST },
    children: [
      docxCell([rtlPara("קטגוריה", { bold: true, size: 18, color: "#FFFFFF", align: AlignmentType.CENTER })], labelWidth, {
        fill: COLORS.ink,
        center: true,
      }),
      ...WORK_DAYS.map((day, index) => {
        const date = new Date(start);
        date.setUTCDate(start.getUTCDate() + day);
        return docxCell([
          rtlPara(DAY_NAMES[index], { bold: true, size: 18, color: COLORS.ink }),
          ltrPara(fmtDate(date), { size: 14, color: COLORS.muted }),
        ], dayWidths[index], { fill: DAY_FILLS[index], span: 2, center: true });
      }),
    ],
  });

  const subHeaderRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    height: { value: 310, rule: HeightRule.ATLEAST },
    children: [
      docxCell([rtlPara("")], labelWidth, { fill: COLORS.ink }),
      ...WORK_DAYS.flatMap((_, index) => [
        docxCell([rtlPara("תכנון", { bold: true, size: 15, color: COLORS.ink, align: AlignmentType.CENTER })], planWidths[index], {
          fill: COLORS.surface,
          center: true,
        }),
        docxCell([rtlPara("ביצוע", { bold: true, size: 15, color: COLORS.ink, align: AlignmentType.CENTER })], execWidths[index], {
          fill: COLORS.surface,
          center: true,
        }),
      ]),
    ],
  });

  const influencerRow = new TableRow({
    cantSplit: true,
    height: { value: 760, rule: HeightRule.ATLEAST },
    children: [
      docxCell([rtlPara("גורמים\nמשפיעים", { bold: true, size: 18, color: COLORS.accentDark, align: AlignmentType.CENTER })], labelWidth, {
        fill: COLORS.accentSoft,
        center: true,
      }),
      ...WORK_DAYS.flatMap((day, index) => [
        docxCell(noteMap[day] ? [rtlPara(noteMap[day], { size: 16, color: COLORS.ink })] : [rtlPara("")], planWidths[index]),
        docxCell([rtlPara("")], execWidths[index]),
      ]),
    ],
  });

  const maxMissionRows = Math.max(1, ...WORK_DAYS.map((day) => grouped[day]?.length ?? 0));
  const missionRows = Array.from({ length: maxMissionRows }, (_, rowIndex) => new TableRow({
    cantSplit: true,
    height: { value: 560, rule: HeightRule.ATLEAST },
    children: [
      docxCell(rowIndex === 0
        ? [rtlPara("משימות", { bold: true, size: 18, color: COLORS.accentDark, align: AlignmentType.CENTER })]
        : [rtlPara("")], labelWidth, { fill: COLORS.accentSoft, center: true }),
      ...WORK_DAYS.flatMap((day, index) => {
        const mission = grouped[day]?.[rowIndex];
        return [
          docxCell(missionParagraphs(mission), planWidths[index], { fill: mission?.done ? COLORS.completedSoft : undefined }),
          docxCell(mission
            ? [rtlPara(mission.done ? "הושלם" : "☐", {
              bold: mission.done,
              size: mission.done ? 14 : 18,
              color: mission.done ? COLORS.completed : COLORS.borderStrong,
              align: AlignmentType.CENTER,
            })]
            : [rtlPara("")], execWidths[index], { fill: mission?.done ? COLORS.completedSoft : undefined, center: true }),
        ];
      }),
    ],
  }));

  const mainTable = new Table({
    width: { size: usableWidth, type: WidthType.DXA },
    columnWidths,
    layout: TableLayoutType.FIXED,
    visuallyRightToLeft: true,
    margins: { top: 80, bottom: 80, left: 90, right: 90 },
    rows: [headerRow, subHeaderRow, influencerRow, ...missionRows],
  });

  const signatureCell = (label: string, name: string | null, signedAt: string | null) => docxCell([
    rtlPara(label, { bold: true, size: 17, color: COLORS.ink, after: 100 }),
    rtlPara(name
      ? `${name}${signedAt ? ` · ${new Date(signedAt).toLocaleDateString("he-IL")}` : ""}`
      : "________________________________", { size: 15, color: COLORS.muted }),
  ], Math.floor((usableWidth - 350) / 2), { fill: "#FFFFFF" });

  const signatureTable = new Table({
    width: { size: usableWidth, type: WidthType.DXA },
    columnWidths: [Math.floor((usableWidth - 350) / 2), 350, Math.floor((usableWidth - 350) / 2)],
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [new TableRow({
      cantSplit: true,
      children: [
        signatureCell("חתימת מנהל עבודה:", week.approver_signature_name, week.approver_signed_at),
        docxCell([rtlPara("")], 350),
        signatureCell("חתימת מנהל אתר אחסון:", week.author_signature_name, week.author_signed_at),
      ],
    })],
  });

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: DOCX_FONT, size: 18, color: COLORS.ink.slice(1) },
          paragraph: { spacing: { after: 0, line: 240 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 16838, height: 11906, orientation: PageOrientation.LANDSCAPE },
          margin: { top: 450, right: 900, bottom: 500, left: 900 },
        },
      },
      children: [
        new Paragraph({
          bidirectional: true,
          alignment: AlignmentType.CENTER,
          spacing: { after: 70 },
          children: [new TextRun({
            text: "תוכנית עבודה שבועית",
            bold: true,
            size: 42,
            color: COLORS.ink.slice(1),
            font: DOCX_FONT,
            rightToLeft: true,
          })],
        }),
        rtlPara(weekSubtitle(week), {
          size: 20,
          color: COLORS.muted,
          align: AlignmentType.CENTER,
          after: 180,
        }),
        mainTable,
        ...(week.notes ? [
          rtlPara("הערות שבועיות", { bold: true, size: 17, color: COLORS.accentDark, before: 120, after: 30 }),
          rtlPara(week.notes, { size: 15, color: COLORS.muted, after: 80 }),
        ] : [rtlPara("", { after: 80 })]),
        signatureTable,
      ],
    }],
  });
}

export async function downloadWeeklyDOCX(
  week: WeekRow,
  missions: MissionRow[],
  dayNotes: DayNoteRow[] = [],
) {
  const { saveAs } = await import("file-saver");
  const blob = await Packer.toBlob(createWeeklyDOCX(week, missions, dayNotes));
  saveAs(blob, `weekly-${week.year}-w${String(week.week).padStart(2, "0")}.docx`);
}
