import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { R as Root2, I as Item, H as Header, T as Trigger2, C as Content2 } from "../_libs/radix-ui__react-accordion.mjs";
import { c as cn } from "./button-DHovwa_B.mjs";
import { j as jsPDF } from "../_libs/jspdf.mjs";
import { a as autoTable } from "../_libs/jspdf-autotable.mjs";
import { F as FileSaver_minExports } from "../_libs/file-saver.mjs";
import { T as TableRow, A as AlignmentType, a as Table, W as WidthType, F as File, P as Paragraph, b as TextRun, H as HeadingLevel, c as Packer, d as TableCell, B as BorderStyle, S as ShadingType } from "../_libs/docx.mjs";
import { d as attachHeebo } from "./pdf-fonts-DKyE_pTi.mjs";
import { C as ChevronDown } from "../_libs/lucide-react.mjs";
const Accordion = Root2;
const AccordionItem = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Item, { ref, className: cn("border-b", className), ...props }));
AccordionItem.displayName = "AccordionItem";
const AccordionTrigger = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Header, { className: "flex", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
  Trigger2,
  {
    ref,
    className: cn(
      "flex flex-1 items-center justify-between py-4 text-sm font-medium cursor-pointer transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" })
    ]
  }
) }));
AccordionTrigger.displayName = Trigger2.displayName;
const AccordionContent = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Content2,
  {
    ref,
    className: "overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("pb-4 pt-0", className), children })
  }
));
AccordionContent.displayName = Content2.displayName;
const STATUS_LABEL = {
  pending: "ממתינה",
  awaiting_approval: "ממתינה לאישור",
  approved: "אושרה",
  preparing: "בהכנה",
  ready: "מוכנה לאיסוף",
  completed: "הושלמה",
  cancelled: "בוטלה"
};
function fmtCurrency(n) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", minimumFractionDigits: 2 }).format(n);
}
function fmtDate(iso) {
  return new Date(iso).toLocaleString("he-IL");
}
function teamName(o) {
  return o.team_name ?? o.teams?.name ?? "";
}
async function downloadOrderInvoicePDF(o, brandName = "Logistikam") {
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  await attachHeebo(pdf);
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 36;
  const rightX = pageW - margin;
  let y = margin;
  pdf.setFont("Heebo", "bold");
  pdf.setFontSize(18);
  pdf.text(brandName, margin, y + 6);
  pdf.setFont("Heebo", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(120);
  pdf.text("מסמך הזמנה", margin, y + 22);
  pdf.setTextColor(15);
  pdf.setFont("Heebo", "bold");
  pdf.setFontSize(16);
  pdf.text("חשבונית הזמנה", rightX, y + 6, { align: "right" });
  pdf.setFont("Heebo", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(120);
  pdf.text(`מס׳ ${o.id.slice(0, 8).toUpperCase()}`, rightX, y + 22, { align: "right" });
  pdf.text(fmtDate(o.created_at), rightX, y + 36, { align: "right" });
  y += 50;
  pdf.setDrawColor(15);
  pdf.setLineWidth(1);
  pdf.line(margin, y, rightX, y);
  y += 14;
  pdf.setTextColor(15);
  pdf.setFont("Heebo", "bold");
  pdf.setFontSize(11);
  pdf.text("צוות", rightX, y, { align: "right" });
  pdf.setFont("Heebo", "normal");
  pdf.text(teamName(o), rightX, y + 14, { align: "right" });
  let metaY = y + 28;
  if (o.ordered_by_name) {
    pdf.text(`מזמין: ${o.ordered_by_name}`, rightX, metaY, { align: "right" });
    metaY += 14;
  }
  if (o.contact_phone) {
    pdf.text(`טלפון: ${o.contact_phone}`, rightX, metaY, { align: "right" });
    metaY += 14;
  }
  pdf.setFont("Heebo", "bold");
  pdf.text("סטטוס", margin, y);
  pdf.setFont("Heebo", "normal");
  pdf.text(STATUS_LABEL[o.status] ?? o.status, margin, y + 14);
  y = Math.max(metaY, y + 42) + 8;
  const rows = o.order_items.map((it, i) => {
    const price = Number(it.price);
    return [
      fmtCurrency(price * it.quantity),
      fmtCurrency(price),
      String(it.quantity),
      it.name,
      String(i + 1)
    ];
  });
  autoTable(pdf, {
    startY: y,
    head: [["סה״כ", "מחיר", "כמות", "מוצר", "#"]],
    body: rows,
    styles: { font: "Heebo", fontSize: 10, halign: "right", cellPadding: 6, textColor: 20 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, halign: "center", fontStyle: "bold" },
    columnStyles: {
      0: { halign: "left", cellWidth: 80 },
      1: { halign: "left", cellWidth: 70 },
      2: { halign: "center", cellWidth: 50 },
      3: { halign: "right" },
      4: { halign: "center", cellWidth: 30 }
    },
    margin: { left: margin, right: margin }
  });
  const afterTable = pdf.lastAutoTable?.finalY ?? y + 40;
  y = afterTable + 16;
  pdf.setDrawColor(15);
  pdf.setLineWidth(1.2);
  pdf.line(rightX - 220, y, rightX, y);
  y += 16;
  pdf.setFont("Heebo", "bold");
  pdf.setFontSize(14);
  pdf.text("סה״כ לתשלום", rightX, y, { align: "right" });
  pdf.text(fmtCurrency(Number(o.total)), rightX - 220, y, { align: "left" });
  pdf.setFont("Heebo", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(120);
  y += 12;
  pdf.text("כולל מע״מ", rightX - 220, y, { align: "left" });
  if (o.notes) {
    y += 22;
    pdf.setTextColor(15);
    pdf.setFont("Heebo", "bold");
    pdf.setFontSize(10);
    pdf.text("הערות:", rightX, y, { align: "right" });
    pdf.setFont("Heebo", "normal");
    const lines = pdf.splitTextToSize(o.notes, rightX - margin - 50);
    pdf.text(lines, rightX, y + 14, { align: "right" });
  }
  pdf.setFontSize(8);
  pdf.setTextColor(140);
  pdf.text(
    `נוצר ב-${(/* @__PURE__ */ new Date()).toLocaleString("he-IL")} · ${brandName}`,
    pageW / 2,
    pdf.internal.pageSize.getHeight() - 20,
    { align: "center" }
  );
  pdf.save(`invoice-${o.id.slice(0, 8)}.pdf`);
}
const border = { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" };
const cellBorders = { top: border, bottom: border, left: border, right: border };
function rtlPara(text, opts = {}) {
  return new Paragraph({
    bidirectional: true,
    alignment: opts.align ?? AlignmentType.RIGHT,
    children: [new TextRun({ text, bold: opts.bold, size: opts.size, font: "Arial", rightToLeft: true })]
  });
}
function headerCell(text) {
  return new TableCell({
    borders: cellBorders,
    width: { size: 1800, type: WidthType.DXA },
    shading: { fill: "0F172A", type: ShadingType.CLEAR, color: "auto" },
    children: [new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, color: "FFFFFF", font: "Arial", rightToLeft: true })]
    })]
  });
}
function bodyCell(text, align = AlignmentType.RIGHT) {
  return new TableCell({
    borders: cellBorders,
    width: { size: 1800, type: WidthType.DXA },
    children: [new Paragraph({
      bidirectional: true,
      alignment: align,
      children: [new TextRun({ text, font: "Arial", rightToLeft: true })]
    })]
  });
}
async function downloadOrderInvoiceDOCX(o, brandName = "Logistikam") {
  const items = o.order_items.map((it, i) => new TableRow({
    children: [
      bodyCell(String(i + 1), AlignmentType.CENTER),
      bodyCell(it.name),
      bodyCell(String(it.quantity), AlignmentType.CENTER),
      bodyCell(fmtCurrency(Number(it.price)), AlignmentType.LEFT),
      bodyCell(fmtCurrency(Number(it.price) * it.quantity), AlignmentType.LEFT)
    ]
  }));
  const table = new Table({
    width: { size: 9e3, type: WidthType.DXA },
    columnWidths: [700, 4200, 900, 1500, 1700],
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          headerCell("#"),
          headerCell("מוצר"),
          headerCell("כמות"),
          headerCell("מחיר"),
          headerCell("סה״כ")
        ]
      }),
      ...items
    ]
  });
  const doc = new File({
    styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1e3, right: 1e3, bottom: 1e3, left: 1e3 } } },
      children: [
        new Paragraph({
          bidirectional: true,
          alignment: AlignmentType.RIGHT,
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: brandName, bold: true, size: 36, font: "Arial", rightToLeft: true })]
        }),
        rtlPara(`חשבונית הזמנה · מס׳ ${o.id.slice(0, 8).toUpperCase()}`, { bold: true, size: 26 }),
        rtlPara(`תאריך: ${fmtDate(o.created_at)}`),
        rtlPara(`צוות: ${teamName(o)}`),
        ...o.ordered_by_name ? [rtlPara(`מזמין: ${o.ordered_by_name}`)] : [],
        ...o.contact_phone ? [rtlPara(`טלפון: ${o.contact_phone}`)] : [],
        rtlPara(`סטטוס: ${STATUS_LABEL[o.status] ?? o.status}`),
        new Paragraph({ children: [new TextRun(" ")] }),
        table,
        new Paragraph({ children: [new TextRun(" ")] }),
        rtlPara(`סה״כ לתשלום: ${fmtCurrency(Number(o.total))} (כולל מע״מ)`, { bold: true, size: 28 }),
        ...o.notes ? [new Paragraph({ children: [new TextRun(" ")] }), rtlPara(`הערות: ${o.notes}`)] : []
      ]
    }]
  });
  const blob = await Packer.toBlob(doc);
  FileSaver_minExports.saveAs(blob, `invoice-${o.id.slice(0, 8)}.docx`);
}
export {
  Accordion as A,
  AccordionItem as a,
  AccordionTrigger as b,
  AccordionContent as c,
  downloadOrderInvoicePDF as d,
  downloadOrderInvoiceDOCX as e
};
