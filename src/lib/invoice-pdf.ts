import { jsPDF } from "jspdf";
import { InvoiceRecord } from "@/lib/platform-store";

export interface BusinessPDFInfo {
  name?: string;
  email?: string;
  phone?: string;
  slug?: string;
  address?: string;
}

/**
 * Generates and triggers download of a high-resolution, designer PDF invoice/receipt
 */
export function generateInvoicePDF(
  inv: InvoiceRecord,
  business?: BusinessPDFInfo
): void {
  // Create A4 portrait PDF document (210mm x 297mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const tealPrimary = [16, 95, 104];     // #105F68
  const tealSecondary = [58, 146, 149];  // #3A9295
  const mintAccent = [99, 193, 187];     // #63C1BB
  const textDark = [16, 52, 56];         // #103438
  const grayLight = [246, 250, 249];     // #F6FAF9
  const borderLight = [226, 232, 240];   // #E2E8F0

  const businessName = business?.name || "Ovel Merchant Workspace";
  const businessSlug = business?.slug || "store";

  // Top Accent Banner
  doc.setFillColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.rect(0, 0, pageWidth, 7, "F");

  y = 22;

  // Header Left: Brand Name & Subtitle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.text(businessName, margin, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
  doc.text(`Official Client Billing Statement • ovel.app/l/${businessSlug}`, margin, y);

  // Header Right: "INVOICE / RECEIPT" Badge
  const badgeText = inv.status === "paid" ? "TAX INVOICE & RECEIPT" : "STATEMENT OF ACCOUNT";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.text(badgeText, pageWidth - margin, y - 6, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
  doc.text(inv.invoiceNumber, pageWidth - margin, y, { align: "right" });

  // Divider Line
  y += 8;
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  // Information Cards Grid (Billed To vs Invoice Summary)
  y += 8;
  const boxHeight = 32;

  // Box 1: Billed To
  doc.setFillColor(grayLight[0], grayLight[1], grayLight[2]);
  doc.roundedRect(margin, y, contentWidth / 2 - 4, boxHeight, 3, 3, "F");
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin, y, contentWidth / 2 - 4, boxHeight, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
  doc.text("BILLED TO", margin + 4, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(inv.clientName || "Valued Client", margin + 4, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
  doc.text(inv.clientEmail || "Direct Client", margin + 4, y + 19);

  if (business?.phone || inv.bookingId) {
    doc.setFontSize(8);
    doc.text(`Ref: ${inv.bookingId ? inv.bookingId.slice(0, 18) : "Direct Order"}`, margin + 4, y + 26);
  }

  // Box 2: Invoice Metadata
  const box2X = margin + contentWidth / 2 + 4;
  const box2W = contentWidth / 2 - 4;

  doc.setFillColor(grayLight[0], grayLight[1], grayLight[2]);
  doc.roundedRect(box2X, y, box2W, boxHeight, 3, 3, "F");
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(box2X, y, box2W, boxHeight, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
  doc.text("TRANSACTION DETAILS", box2X + 4, y + 6);

  // Date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
  doc.text("Date Issued:", box2X + 4, y + 13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const dateFormatted = new Date(inv.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  doc.text(dateFormatted, box2X + box2W - 4, y + 13, { align: "right" });

  // Status
  doc.setFont("helvetica", "normal");
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
  doc.text("Payment Status:", box2X + 4, y + 19);
  doc.setFont("helvetica", "bold");
  if (inv.status === "paid") {
    doc.setTextColor(16, 120, 60); // Green
    doc.text("PAID & SETTLED", box2X + box2W - 4, y + 19, { align: "right" });
  } else if (inv.status === "sent") {
    doc.setTextColor(180, 100, 20); // Amber
    doc.text("AWAITING PAYMENT", box2X + box2W - 4, y + 19, { align: "right" });
  } else {
    doc.setTextColor(80, 80, 80);
    doc.text("DRAFT", box2X + box2W - 4, y + 19, { align: "right" });
  }

  // Tender / Method
  doc.setFont("helvetica", "normal");
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
  doc.text("Payment Tender:", box2X + 4, y + 26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(inv.paymentMethod || "Electronic Settlement", box2X + box2W - 4, y + 26, { align: "right" });

  y += boxHeight + 10;

  // Itemized Services / Products Table Header
  doc.setFillColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.roundedRect(margin, y, contentWidth, 8, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("ITEM / SERVICE DESCRIPTION", margin + 4, y + 5.5);
  doc.text("AMOUNT (USD)", pageWidth - margin - 4, y + 5.5, { align: "right" });

  y += 10;

  // Parse items from summary or display as single line item
  const rawItems = inv.itemsSummary ? inv.itemsSummary.split(",") : [];
  const items = rawItems.length > 0 
    ? rawItems.map((item) => item.trim()).filter(Boolean)
    : [inv.clientName ? `${businessName} Professional Session` : "Custom Service Order"];

  const subtotalDollars = (inv.subtotalCents / 100).toFixed(2);
  const itemPrice = (inv.subtotalCents / 100 / items.length).toFixed(2);

  items.forEach((itemText, idx) => {
    // Zebra striping
    if (idx % 2 === 1) {
      doc.setFillColor(grayLight[0], grayLight[1], grayLight[2]);
      doc.rect(margin, y - 2, contentWidth, 7, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(itemText, margin + 4, y + 3);

    // If multiple items, distribute price or show subtotal on last
    const priceDisplay = items.length === 1 ? `$${subtotalDollars}` : `$${itemPrice}`;
    doc.text(priceDisplay, pageWidth - margin - 4, y + 3, { align: "right" });

    y += 7.5;
  });

  // Table Bottom Divider
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Financial Summary Section (Right Aligned)
  const totalsWidth = 80;
  const totalsX = pageWidth - margin - totalsWidth;

  // Subtotal
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
  doc.text("Subtotal:", totalsX, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`$${subtotalDollars}`, pageWidth - margin, y, { align: "right" });
  y += 6;

  // Upfront Deposit Credited
  if (inv.depositCreditedCents > 0) {
    const depositDollars = (inv.depositCreditedCents / 100).toFixed(2);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
    doc.text("Deposit Credited:", totalsX, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 120, 60);
    doc.text(`-$${depositDollars}`, pageWidth - margin, y, { align: "right" });
    y += 6;
  }

  // Tax
  if (inv.taxCents > 0) {
    const taxDollars = (inv.taxCents / 100).toFixed(2);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
    doc.text("Sales Tax / VAT:", totalsX, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`+$${taxDollars}`, pageWidth - margin, y, { align: "right" });
    y += 6;
  }

  // Total Line Divider
  doc.setDrawColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.setLineWidth(0.6);
  doc.line(totalsX, y, pageWidth - margin, y);
  y += 5;

  // Final Total / Balance
  const balanceDollars = (inv.balanceDueCents / 100).toFixed(2);
  const totalLabel = inv.status === "paid" ? "Total Settled (Paid):" : "Net Balance Due:";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.text(totalLabel, totalsX, y + 1);

  doc.setFontSize(13);
  doc.text(`$${balanceDollars}`, pageWidth - margin, y + 1, { align: "right" });

  y += 14;

  // Paid Stamp / Watermark Badge
  if (inv.status === "paid") {
    doc.setFillColor(235, 250, 242);
    doc.setDrawColor(16, 160, 80);
    doc.setLineWidth(0.6);
    doc.roundedRect(margin, y, 65, 18, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(16, 140, 70);
    doc.text("✓ PAID IN FULL", margin + 32.5, y + 7.5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Direct Merchant Settlement", margin + 32.5, y + 13, { align: "center" });
  }

  // Internal Memo / Notes if present
  if (inv.notes) {
    y += inv.status === "paid" ? 22 : 4;
    doc.setFillColor(grayLight[0], grayLight[1], grayLight[2]);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
    doc.text("TRANSACTION MEMO", margin + 4, y + 4.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(inv.notes, margin + 4, y + 10);
  }

  // Bottom Footer
  const footerY = 280;
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
  doc.text(
    "Thank you for your business. Powered by Ovel Unified Commerce • Direct Merchant Payouts (0% Commission)",
    margin,
    footerY + 5
  );
  doc.text(`Page 1 of 1`, pageWidth - margin, footerY + 5, { align: "right" });

  // Save / Trigger Download
  doc.save(`${inv.invoiceNumber}.pdf`);
}
