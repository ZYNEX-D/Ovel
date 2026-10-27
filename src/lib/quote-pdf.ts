import { QuoteProposal } from "@/lib/platform-store";
import { getCurrencySymbol, DEFAULT_CURRENCY } from "@/lib/currency";
import { BusinessPDFInfo } from "@/lib/invoice-pdf";

export interface QuotePDFOptions {
  dynamicTotal?: number;
  dynamicDeposit?: number;
  selectedAddOns?: Record<string, boolean>;
  signatureSvg?: string;
  signedTimestamp?: string;
  userIpAddress?: string;
  fulfillmentLabel?: string;
}

/**
 * Generates and triggers download of a high-resolution, designer PDF for official quotations & signed agreements
 */
export async function generateQuotePDF(
  quote: QuoteProposal,
  business?: BusinessPDFInfo,
  options?: QuotePDFOptions
): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Curated color palette
  const tealPrimary = [16, 95, 104];     // #105F68
  const tealSecondary = [58, 146, 149];  // #3A9295
  const mintAccent = [99, 193, 187];     // #63C1BB
  const textDark = [16, 52, 56];         // #103438
  const grayLight = [246, 250, 249];     // #F6FAF9
  const borderLight = [226, 232, 240];   // #E2E8F0
  const emeraldSuccess = [27, 94, 32];   // #1B5E20

  const businessName = business?.name || "Merchant Workspace";
  const businessSlug = business?.slug || "store";
  const currencyCode = business?.currency || DEFAULT_CURRENCY;
  const currencySymbol = getCurrencySymbol(currencyCode);

  const quoteRefNumber = quote.quoteNumber || ("QT-" + quote.id.slice(-6).toUpperCase());
  const isAccepted = quote.status === "accepted" || quote.status === "converted";

  // Financial values
  const totalCents = typeof options?.dynamicTotal === "number" ? options.dynamicTotal : quote.totalCents;
  const depositCents = typeof options?.dynamicDeposit === "number" ? options.dynamicDeposit : (quote.depositCents || 0);
  const hasDeposit = depositCents > 0;
  const balanceDueCents = Math.max(0, totalCents - depositCents);

  // Top Accent Banner
  doc.setFillColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.rect(0, 0, pageWidth, 6, "F");

  y = 20;

  // Header Left: Brand Name & Subtitle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.text(businessName, margin, y);

  y += 5.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
  doc.text(`Official Business Quotation & Agreement • ovel.lk/l/${businessSlug}`, margin, y);

  // Header Right: Document Title & Badge
  const docTitle = isAccepted ? "OFFICIAL QUOTATION & SIGNED AGREEMENT" : "COMMERCIAL QUOTATION & PROPOSAL";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.text(docTitle, pageWidth - margin, y - 5.5, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
  doc.text(quoteRefNumber, pageWidth - margin, y, { align: "right" });

  // Divider Line
  y += 7;
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  // Information Cards Grid (Issued By vs Billed/Issued To)
  y += 6;
  const boxHeight = 36;
  const colWidth = (contentWidth - 6) / 2;

  // Box 1: Billed / Authorized Party
  doc.setFillColor(grayLight[0], grayLight[1], grayLight[2]);
  doc.roundedRect(margin, y, colWidth, boxHeight, 2.5, 2.5, "F");
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin, y, colWidth, boxHeight, 2.5, 2.5, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
  doc.text("CLIENT / AUTHORIZED PARTY", margin + 4, y + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(quote.clientName || "Valued Client", margin + 4, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);

  let clientLineOffset = y + 17.5;
  if (quote.clientCompany) {
    doc.text(`Company: ${quote.clientCompany}`, margin + 4, clientLineOffset);
    clientLineOffset += 5;
  }
  const contactText = [quote.clientEmail, quote.clientPhone].filter(Boolean).join(" • ");
  if (contactText) {
    doc.text(contactText, margin + 4, clientLineOffset);
    clientLineOffset += 5;
  }
  if (quote.clientAddress) {
    doc.setFontSize(7.5);
    doc.text(`Address: ${quote.clientAddress.slice(0, 45)}`, margin + 4, clientLineOffset);
  }

  // Box 2: Proposal & Settlement Details
  const box2X = margin + colWidth + 6;
  doc.setFillColor(grayLight[0], grayLight[1], grayLight[2]);
  doc.roundedRect(box2X, y, colWidth, boxHeight, 2.5, 2.5, "F");
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(box2X, y, colWidth, boxHeight, 2.5, 2.5, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
  doc.text("AGREEMENT & SETTLEMENT DETAILS", box2X + 4, y + 5.5);

  // Status
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
  doc.text("Agreement Status:", box2X + 4, y + 12);
  doc.setFont("helvetica", "bold");
  if (isAccepted) {
    doc.setTextColor(emeraldSuccess[0], emeraldSuccess[1], emeraldSuccess[2]);
    doc.text("AUTHORIZED & SIGNED", box2X + colWidth - 4, y + 12, { align: "right" });
  } else {
    doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
    doc.text("OFFICIAL PROPOSAL", box2X + colWidth - 4, y + 12, { align: "right" });
  }

  // Date Issued
  doc.setFont("helvetica", "normal");
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
  doc.text("Date Issued:", box2X + 4, y + 17.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const dateIssuedStr = new Date(quote.createdAt || new Date()).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  doc.text(dateIssuedStr, box2X + colWidth - 4, y + 17.5, { align: "right" });

  // Fulfillment Mode
  doc.setFont("helvetica", "normal");
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
  doc.text("Fulfillment Mode:", box2X + 4, y + 23);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const fLabel = options?.fulfillmentLabel || (quote.fulfillmentType ? quote.fulfillmentType.toUpperCase() : "STANDARD DELIVERY");
  doc.text(fLabel, box2X + colWidth - 4, y + 23, { align: "right" });

  // Valid Until / Signed At
  doc.setFont("helvetica", "normal");
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
  doc.text(isAccepted ? "Signed At:" : "Valid Until:", box2X + 4, y + 28.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const dateOtherStr = isAccepted
    ? (options?.signedTimestamp || "Electronically Verified")
    : (quote.expiresAt ? new Date(quote.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "30 Days");
  doc.text(dateOtherStr.slice(0, 24), box2X + colWidth - 4, y + 28.5, { align: "right" });

  y += boxHeight + 8;

  // Project Scope Title / Summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.text(`Proposal: ${quote.title || "Agreed Commercial Deliverables"}`, margin, y);
  y += 4;

  if (quote.scopeDescription) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
    const splitScope = doc.splitTextToSize(quote.scopeDescription, contentWidth);
    doc.text(splitScope.slice(0, 2), margin, y);
    y += (Math.min(splitScope.length, 2) * 3.8) + 2;
  } else {
    y += 2;
  }

  // Itemized Scope Table Header
  doc.setFillColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("#", margin + 3, y + 4.8);
  doc.text("DELIVERABLE / SCOPE SPECIFICATION", margin + 10, y + 4.8);
  doc.text("QTY", margin + 115, y + 4.8, { align: "center" });
  doc.text(`UNIT PRICE (${currencyCode})`, margin + 145, y + 4.8, { align: "right" });
  doc.text(`AMOUNT (${currencyCode})`, pageWidth - margin - 3, y + 4.8, { align: "right" });

  y += 8.5;

  // Render Line Items
  const lineItems = quote.lineItems && quote.lineItems.length > 0
    ? quote.lineItems
    : [{ description: quote.title || "Commercial Deliverable", quantity: 1, priceCents: quote.totalCents, unitPrice: quote.totalCents / 100 }];

  lineItems.forEach((item, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(grayLight[0], grayLight[1], grayLight[2]);
      doc.rect(margin, y - 2, contentWidth, 6.5, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
    doc.text(String(idx + 1), margin + 3, y + 2.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text((item.description || "Scope Deliverable").slice(0, 65), margin + 10, y + 2.5);

    const qty = item.quantity || 1;
    doc.text(String(qty), margin + 115, y + 2.5, { align: "center" });

    const unitPriceDollars = ((item.priceCents || 0) / 100).toFixed(2);
    doc.text(`${currencySymbol} ${unitPriceDollars}`, margin + 145, y + 2.5, { align: "right" });

    const itemTotalDollars = (((item.priceCents || 0) * qty) / 100).toFixed(2);
    doc.setFont("helvetica", "bold");
    doc.text(`${currencySymbol} ${itemTotalDollars}`, pageWidth - margin - 3, y + 2.5, { align: "right" });

    y += 6.5;
  });

  // Render Selected Optional Add-ons if present
  if (quote.optionalAddOns && quote.optionalAddOns.length > 0) {
    const selectedOptions = quote.optionalAddOns.filter((opt) => {
      if (options?.selectedAddOns) {
        return options.selectedAddOns[opt.id];
      }
      return opt.selected;
    });

    selectedOptions.forEach((opt, idx) => {
      doc.setFillColor(grayLight[0], grayLight[1], grayLight[2]);
      doc.rect(margin, y - 2, contentWidth, 6.5, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(16, 95, 104);
      doc.text("+", margin + 3, y + 2.5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(`[Approved Option] ${opt.description}`.slice(0, 65), margin + 10, y + 2.5);

      doc.text("1", margin + 115, y + 2.5, { align: "center" });

      const optPriceDollars = ((opt.priceCents || 0) / 100).toFixed(2);
      doc.text(`${currencySymbol} ${optPriceDollars}`, margin + 145, y + 2.5, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text(`${currencySymbol} ${optPriceDollars}`, pageWidth - margin - 3, y + 2.5, { align: "right" });

      y += 6.5;
    });
  }

  // Table Bottom Divider
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Financial Totals Summary (Right Aligned)
  const totalsWidth = 85;
  const totalsX = pageWidth - margin - totalsWidth;

  // Gross Subtotal
  const totalDollars = (totalCents / 100).toFixed(2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
  doc.text("Total Agreed Proposal Value:", totalsX, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`${currencySymbol} ${totalDollars}`, pageWidth - margin, y, { align: "right" });
  y += 5;

  // Upfront Deposit Paid
  if (hasDeposit) {
    const depositDollars = (depositCents / 100).toFixed(2);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
    doc.text("Upfront Deposit Paid:", totalsX, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(emeraldSuccess[0], emeraldSuccess[1], emeraldSuccess[2]);
    doc.text(`-${currencySymbol} ${depositDollars}`, pageWidth - margin, y, { align: "right" });
    y += 5;

    // Remaining Balance Due
    const balanceDollars = (balanceDueCents / 100).toFixed(2);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
    doc.text("Remaining Balance on Delivery:", totalsX, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`${currencySymbol} ${balanceDollars}`, pageWidth - margin, y, { align: "right" });
    y += 5;
  }

  // Total Line Divider
  doc.setDrawColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.setLineWidth(0.5);
  doc.line(totalsX, y, pageWidth - margin, y);
  y += 5;

  // Final Total Banner
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.text(hasDeposit ? "Upfront Deposit Settled:" : "Total Package Value:", totalsX, y);
  doc.setFontSize(11);
  const highlightedAmount = hasDeposit ? (depositCents / 100).toFixed(2) : totalDollars;
  doc.text(`${currencySymbol} ${highlightedAmount}`, pageWidth - margin, y, { align: "right" });

  y += 10;

  // Formal E-Signature & Legal Authorization Box
  if (isAccepted) {
    const sigBoxHeight = 36;
    doc.setFillColor(240, 249, 244); // Soft Emerald
    doc.roundedRect(margin, y, contentWidth, sigBoxHeight, 2.5, 2.5, "F");
    doc.setDrawColor(165, 214, 167);
    doc.roundedRect(margin, y, contentWidth, sigBoxHeight, 2.5, 2.5, "S");

    // Title & Badge
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(emeraldSuccess[0], emeraldSuccess[1], emeraldSuccess[2]);
    doc.text("✓ VERIFIED ELECTRONIC SIGNATURE & AUDIT TRAIL", margin + 4, y + 5.5);

    // Legal certification text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
    const legalNotice =
      "This document certifies that the proposal scope, deliverables, and payment terms detailed above were formally authorized and electronically executed in accordance with applicable electronic transaction standards.";
    const splitNotice = doc.splitTextToSize(legalNotice, contentWidth - 8);
    doc.text(splitNotice, margin + 4, y + 10);

    // Signer Metadata & Signature Display
    const sigY = y + 19;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`Signer: ${quote.signatureData || quote.clientName}`, margin + 4, sigY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
    const ipStr = options?.userIpAddress || "Verified Client Session";
    const timeStr = options?.signedTimestamp || (quote.issuedAt ? new Date(quote.issuedAt).toISOString() : new Date().toISOString());
    doc.text(`Timestamp: ${timeStr} • Network IP: ${ipStr}`, margin + 4, sigY + 4.5);

    // Right Side: Verified Seal Badge
    doc.setFillColor(emeraldSuccess[0], emeraldSuccess[1], emeraldSuccess[2]);
    doc.roundedRect(pageWidth - margin - 48, y + 16, 44, 14, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("DIGITALLY SIGNED", pageWidth - margin - 26, y + 22, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text("Legally Binding Agreement", pageWidth - margin - 26, y + 26.5, { align: "center" });
  }

  // Footer
  const footerY = pageHeight - 12;
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(tealSecondary[0], tealSecondary[1], tealSecondary[2]);
  doc.text(
    `Official Agreement Reference #${quoteRefNumber} • Generated via Ovel Direct Operating Platform (ovel.lk)`,
    margin,
    footerY
  );
  doc.text("Page 1 of 1", pageWidth - margin, footerY, { align: "right" });

  // Save / Trigger Download
  doc.save(`${quoteRefNumber}_Official_Agreement.pdf`);
}
