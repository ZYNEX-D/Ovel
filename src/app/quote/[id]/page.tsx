"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  FileText, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  CreditCard, 
  Lock, 
  Eye, 
  AlertCircle,
  PenTool,
  Type,
  Landmark,
  Building2,
  MapPin,
  Package,
  Briefcase,
  Printer,
  CalendarCheck,
  Download,
  Receipt
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  getQuotes, 
  saveQuotes, 
  createBooking, 
  findQuoteById,
  deductInventoryForLineItems,
  convertQuoteToInvoice,
  QuoteProposal 
} from "@/lib/platform-store";
import { addDaysLocal, addMinutes, displayTimeToIsoLocal } from "@/lib/booking-time";
import { useHydrated } from "@/lib/use-client-store";
import { useAudio } from "@/components/AudioController";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";
import { getOvelink } from "@/lib/ovelink-store";
import { Stepper, StepperStep } from "@/components/arc/stepper/stepper";
import { SignaturePad, signatureToSvg, type InkStroke } from "@/components/arc/signature-pad/signature-pad";

export default function InteractiveQuotePage() {
  const params = useParams();
  const quoteId = (params?.id as string) || "";
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#F6FAF9] flex items-center justify-center p-6 text-center font-['Kaleko_105',sans-serif]">
        <div className="w-8 h-8 rounded-full border-2 border-[#105F68] border-t-transparent animate-spin" />
      </div>
    );
  }

  const { quote, workspaceId } = findQuoteById(quoteId);

  if (!quote) {
    return (
      <div className="min-h-screen bg-[#F6FAF9] flex items-center justify-center p-6 text-center font-['Kaleko_105',sans-serif]">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-[#105F68]/15 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#C8E6E2]/40 text-[#105F68] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-light text-[#105F68]">Proposal Not Found</h2>
          <p className="text-xs text-[#3A9295] leading-relaxed">
            This quote proposal does not exist, has expired, or was removed.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block px-6 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <InteractiveQuoteView initialQuote={quote} workspaceId={workspaceId} />;
}

type StepKey = "scope" | "sign" | "schedule" | "settlement";

interface StepConfig {
  id: StepKey;
  label: string;
  description: string;
}

function InteractiveQuoteView({
  initialQuote,
  workspaceId,
}: {
  initialQuote: QuoteProposal;
  workspaceId: string;
}) {
  const { playClick, playSuccess } = useAudio();
  const [quote, setQuote] = useState<QuoteProposal>(initialQuote);

  const activeOvelink = useMemo(() => {
    return getOvelink("leclat", undefined, workspaceId);
  }, [workspaceId]);
  const currency = activeOvelink?.currency || DEFAULT_CURRENCY;

  // Proposal configuration flags
  const fulfillmentType = quote.fulfillmentType || "general";
  const requiresScheduling = Boolean(quote.requiresScheduling || fulfillmentType === "appointment");
  const requiresSignature = quote.requireSignature !== false;
  const quoteRefNumber = quote.quoteNumber || ("QT-" + quote.id.slice(-6).toUpperCase());

  // Conversion state
  const isAlreadyConverted = quote.status === "accepted" || quote.status === "converted";
  const [isConverted, setIsConverted] = useState(isAlreadyConverted);
  const [convertedBookingId, setConvertedBookingId] = useState(quote.convertedBookingId || "");
  const [convertedInvoiceNumber, setConvertedInvoiceNumber] = useState(quote.convertedInvoiceId ? "INV-LINKED" : "");

  // Selected Add-ons (Step 0)
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    if (quote?.optionalAddOns) {
      quote.optionalAddOns.forEach((opt) => {
        map[opt.id] = opt.selected;
      });
    }
    return map;
  });

  // Dynamic pricing calculation based on toggled add-ons
  const addOnsTotal = useMemo(() => {
    if (!quote?.optionalAddOns) return 0;
    return quote.optionalAddOns.reduce((sum, opt) => {
      return selectedAddOns[opt.id] ? sum + opt.priceCents : sum;
    }, 0);
  }, [quote, selectedAddOns]);

  const dynamicTotal = (quote?.totalCents || 0) + addOnsTotal;

  // Dynamic deposit calculation based on quote's deposit mode
  const dynamicDeposit = useMemo(() => {
    if (quote.requireDeposit === false) return 0;
    if (quote.depositCents === 0) return 0;
    if (quote.depositCents !== undefined) {
      if (quote.totalCents > 0) {
        const ratio = quote.depositCents / quote.totalCents;
        return Math.min(dynamicTotal, Math.round(dynamicTotal * ratio));
      }
      return quote.depositCents;
    }
    // Default fallback 25% if unspecified
    return Math.round(dynamicTotal * 0.25);
  }, [quote, dynamicTotal]);

  const hasDeposit = dynamicDeposit > 0;

  // Dynamic Steps definition based on quote customization
  const activeSteps: StepConfig[] = useMemo(() => {
    const steps: StepConfig[] = [
      {
        id: "scope",
        label: "Scope & Details",
        description: "Review items & options",
      },
    ];

    if (requiresSignature) {
      steps.push({
        id: "sign",
        label: "E-Signature",
        description: "Authorize agreement",
      });
    }

    if (requiresScheduling) {
      steps.push({
        id: "schedule",
        label: "Kickoff Slot",
        description: "Pick appointment time",
      });
    }

    steps.push({
      id: "settlement",
      label: hasDeposit ? "Pay Deposit" : "Confirm",
      description: hasDeposit ? `${formatCurrency(dynamicDeposit, currency)} deposit` : "Authorize agreement",
    });

    return steps;
  }, [requiresSignature, requiresScheduling, hasDeposit, dynamicDeposit, currency]);

  // Stepper state
  const [currentStep, setCurrentStep] = useState<number>(isAlreadyConverted ? activeSteps.length : 0);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState<1 | -1>(1);

  const currentStepKey: StepKey | "complete" = isConverted
    ? "complete"
    : (activeSteps[currentStep]?.id || "scope");

  // Step 1: Signature state (Signature Pad + Typed Fallback)
  const [signMode, setSignMode] = useState<"draw" | "type">("draw");
  const [signatureStrokes, setSignatureStrokes] = useState<InkStroke[]>([]);
  const [signatureSvg, setSignatureSvg] = useState<string>(quote?.signatureSvg || "");
  const [typedSignature, setTypedSignature] = useState(quote?.signatureData || quote?.clientName || "");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [userIpAddress] = useState("127.0.0.1 (Verified Client)");
  const [signedTimestamp] = useState(() => new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC");

  // Step 2: Schedule appointment state (only if requiresScheduling)
  const defaultDay = addDaysLocal(new Date(), 2);
  const [selectedDay, setSelectedDay] = useState("");
  const dayValue = selectedDay || defaultDay;
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("09:00 AM");

  // Step 3: Card on file state (Stripe SetupIntent)
  const [cardNumber, setCardNumber] = useState("•••• •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("•••");
  const [saveCardOnFile, setSaveCardOnFile] = useState(true);

  // Quote View Tracking state
  const [viewTracked, setViewTracked] = useState(false);

  useEffect(() => {
    if (!quote) return;
    const timer = setTimeout(() => {
      setViewTracked(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [quote]);

  // Handle ink stroke changes from Arc SignaturePad
  const handleStrokesChange = useCallback((strokes: InkStroke[]) => {
    setSignatureStrokes(strokes);
    if (strokes.length > 0) {
      const svg = signatureToSvg(strokes);
      setSignatureSvg(svg);
      setStepErrors((prev) => ({ ...prev, sign: "" }));
    } else {
      setSignatureSvg("");
    }
  }, []);

  const toggleAddOn = (optId: string) => {
    playClick();
    setSelectedAddOns((prev) => ({ ...prev, [optId]: !prev[optId] }));
  };

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    playSuccess();
    setIsDownloadingPdf(true);
    try {
      const { generateQuotePDF } = await import("@/lib/quote-pdf");
      await generateQuotePDF(
        quote,
        {
          name: activeOvelink?.businessName || "Merchant Workspace",
          email: activeOvelink?.email,
          phone: activeOvelink?.whatsappNumber,
          slug: activeOvelink?.slug || "store",
          address: activeOvelink?.location,
          currency,
        },
        {
          dynamicTotal,
          dynamicDeposit,
          selectedAddOns,
          signatureSvg: quote.signatureSvg || signatureSvg,
          signedTimestamp,
          userIpAddress,
          fulfillmentLabel: fulfillmentBadge.label,
        }
      );
    } catch (err: unknown) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Stepper definition mapped to Arc Stepper
  const stepperSteps: StepperStep[] = useMemo(() => {
    return activeSteps.map((step) => ({
      id: step.id,
      label: step.label,
      description: step.description,
      error: stepErrors[step.id],
    }));
  }, [activeSteps, stepErrors]);

  // Step Navigation Handlers
  const goToNextStep = () => {
    if (!quote) return;
    const nowMs = new Date().getTime();
    if (quote.expiresAt && Date.parse(quote.expiresAt) < nowMs) {
      setStepErrors((prev) => ({ ...prev, [currentStepKey]: "This proposal has expired." }));
      return;
    }

    if (currentStepKey === "scope") {
      setStepErrors((prev) => ({ ...prev, scope: "" }));
      setDirection(1);
      playClick();
      setCurrentStep((prev) => Math.min(prev + 1, activeSteps.length - 1));
      return;
    }

    if (currentStepKey === "sign") {
      const hasDrawn = signatureStrokes.length > 0 || signatureSvg.length > 0;
      const hasTyped = typedSignature.trim().length > 0;

      if (signMode === "draw" && !hasDrawn) {
        setStepErrors((prev) => ({ ...prev, sign: "Please draw your signature on the pad above to authorize." }));
        return;
      }
      if (signMode === "type" && !hasTyped) {
        setStepErrors((prev) => ({ ...prev, sign: "Please type your full legal name to e-sign." }));
        return;
      }
      if (!acceptedTerms) {
        setStepErrors((prev) => ({ ...prev, sign: "Please accept the agreement terms and authorization conditions." }));
        return;
      }
      setStepErrors((prev) => ({ ...prev, sign: "" }));
      setDirection(1);
      playClick();
      setCurrentStep((prev) => Math.min(prev + 1, activeSteps.length - 1));
      return;
    }

    if (currentStepKey === "schedule") {
      if (!dayValue) {
        setStepErrors((prev) => ({ ...prev, schedule: "Please select an appointment date." }));
        return;
      }
      if (!selectedTimeSlot) {
        setStepErrors((prev) => ({ ...prev, schedule: "Please choose a time slot." }));
        return;
      }
      setStepErrors((prev) => ({ ...prev, schedule: "" }));
      setDirection(1);
      playClick();
      setCurrentStep((prev) => Math.min(prev + 1, activeSteps.length - 1));
      return;
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0 && !isConverted) {
      setDirection(-1);
      playClick();
      setCurrentStep((prev) => Math.max(0, prev - 1));
    }
  };

  const handleStepSelect = (index: number) => {
    if (index < currentStep && !isConverted) {
      setDirection(-1);
      playClick();
      setCurrentStep(index);
    }
  };

  const handleFinalizeFlow = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quote || isConverted) return;

    const nowMs = new Date().getTime();
    if (quote.expiresAt && Date.parse(quote.expiresAt) < nowMs) {
      setStepErrors((prev) => ({ ...prev, settlement: "This proposal has expired." }));
      return;
    }

    const finalSignerLabel = requiresSignature
      ? (signMode === "draw"
          ? `${quote.clientName || "Client"} (Handwritten Ink)`
          : (typedSignature || quote.clientName || "Authorized Client"))
      : (quote.clientName || "Authorized Client");
    const finalSignatureSvg = requiresSignature && signMode === "draw" && signatureSvg ? signatureSvg : undefined;

    let createdBookingId = "";

    // If quotation requires appointment scheduling, book the slot
    if (requiresScheduling) {
      const bookingStartTime = displayTimeToIsoLocal(dayValue, selectedTimeSlot);
      const bookingEndTime = bookingStartTime ? addMinutes(bookingStartTime, 90) : null;
      if (!bookingStartTime || !bookingEndTime) {
        setStepErrors((prev) => ({ ...prev, settlement: "Choose a valid appointment time." }));
        return;
      }

      const enteredLast4 = cardNumber.replace(/\D/g, "").slice(-4);
      const keepCard = saveCardOnFile && enteredLast4.length === 4;
      const booking = createBooking({
        serviceId: "srv_" + nowMs,
        serviceName: quote.title,
        staffId: "st_assigned",
        staffName: "Assigned Specialist",
        clientName: quote.clientName,
        clientEmail: quote.clientEmail,
        clientPhone: quote.clientPhone,
        startTime: bookingStartTime,
        endTime: bookingEndTime,
        status: "confirmed",
        totalPriceCents: dynamicTotal,
        depositPaidCents: dynamicDeposit,
        stationResource: "Main Suite",
        hasCardOnFile: keepCard,
        cardLast4: keepCard ? enteredLast4 : undefined,
        notes: `Quote Acceptance (${quoteRefNumber}). E-Signed: ${finalSignerLabel} (${userIpAddress}). Deposit: ${formatCurrency(dynamicDeposit, currency)}.`,
      }, workspaceId);

      if (!booking) {
        setStepErrors((prev) => ({ ...prev, settlement: "That time slot is already booked. Please choose another." }));
        return;
      }
      createdBookingId = booking.id;
    }

    // Deduct physical inventory if physical product items are included
    if (quote.lineItems && quote.lineItems.length > 0) {
      const productItems = quote.lineItems
        .filter((item) => item.type === "product" && item.itemId)
        .map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity || 1,
        }));
      if (productItems.length > 0) {
        deductInventoryForLineItems(productItems, workspaceId);
      }
    }

    playSuccess();
    setStepErrors({});

    const allQuotes = getQuotes(workspaceId);
    const updated = allQuotes.map((q) => {
      if (q.id === quote.id) {
        return {
          ...q,
          status: "accepted" as const,
          signatureData: finalSignerLabel,
          signatureSvg: finalSignatureSvg,
          totalCents: dynamicTotal,
          depositCents: dynamicDeposit,
          convertedBookingId: createdBookingId || undefined,
        };
      }
      return q;
    });

    saveQuotes(updated, workspaceId);

    // Automatically generate invoice upon acceptance with deposit credited
    const convertedInvoice = convertQuoteToInvoice(
      quote.id,
      {
        creditTerms: "due_on_receipt",
        initialPaymentCents: dynamicDeposit,
        initialPaymentMethod: quote.paymentMethodName || "Online Payment",
        notes: `Accepted and e-signed online by ${finalSignerLabel}. IP: ${userIpAddress}.`,
      },
      workspaceId
    );

    if (convertedInvoice) {
      setConvertedInvoiceNumber(convertedInvoice.invoiceNumber);
    }

    setQuote((prev) => ({
      ...prev,
      status: "accepted",
      signatureData: finalSignerLabel,
      signatureSvg: finalSignatureSvg,
      totalCents: dynamicTotal,
      depositCents: dynamicDeposit,
      convertedBookingId: createdBookingId || undefined,
      convertedInvoiceId: convertedInvoice?.id || undefined,
    }));
    setConvertedBookingId(createdBookingId);
    setIsConverted(true);
    setCurrentStep(activeSteps.length);
  }, [
    quote, 
    isConverted, 
    requiresScheduling,
    requiresSignature,
    quoteRefNumber,
    dayValue, 
    selectedTimeSlot, 
    cardNumber, 
    saveCardOnFile, 
    dynamicTotal, 
    dynamicDeposit, 
    signMode,
    signatureSvg,
    typedSignature, 
    userIpAddress, 
    currency, 
    workspaceId,
    activeSteps.length,
    playSuccess
  ]);

  const timeSlots = ["09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM"];

  const fulfillmentBadge = useMemo(() => {
    switch (fulfillmentType) {
      case "project":
        return { label: "Project Scope", icon: Briefcase, color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "delivery":
        return { label: "Product Supply & Delivery", icon: Package, color: "bg-amber-50 text-amber-700 border-amber-200" };
      case "appointment":
        return { label: "Appointment / Session", icon: CalendarCheck, color: "bg-teal-50 text-[#105F68] border-[#9ED5D1]" };
      default:
        return { label: "General Proposal", icon: FileText, color: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  }, [fulfillmentType]);

  return (
    <div className="min-h-screen bg-[#F6FAF9] text-[#103438] antialiased selection:bg-[#105F68] selection:text-white font-['Kaleko_105',sans-serif] flex flex-col">
      {/* Floating View Tracking Banner */}
      {viewTracked && !isConverted && (
        <div className="bg-[#105F68] text-white px-4 py-2 text-[11px] font-light flex items-center justify-center gap-2 border-b border-[#63C1BB]/30 animate-in slide-in-from-top-2 print:hidden">
          <Eye className="w-3.5 h-3.5 text-[#63C1BB]" />
          <span>
            <b>Live View Tracking Active:</b> Business owner was just notified that you opened proposal #{quoteRefNumber}.
          </span>
        </div>
      )}

      {/* Sticky Flow Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#105F68]/10 px-4 sm:px-8 py-3 shadow-2xs print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-[#C8E6E2]/40 border border-[#9ED5D1]/60 flex items-center justify-center p-2 shrink-0">
              <Image src="/icon.svg" alt="Ovel Logo" width={22} height={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-semibold text-[#105F68] truncate">
                  {quoteRefNumber}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border flex items-center gap-1 ${fulfillmentBadge.color}`}>
                  <fulfillmentBadge.icon className="w-3 h-3" />
                  <span>{fulfillmentBadge.label}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#63C1BB]/20 text-[#105F68] font-semibold shrink-0">
                  {isConverted ? "Authorized" : `Step ${currentStep + 1} of ${activeSteps.length}`}
                </span>
              </div>
              <p className="text-[11px] text-[#3A9295] truncate font-light">
                {quote.title}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-[#3A9295] font-medium block">Total Value</span>
            <span className="font-mono font-semibold text-[#105F68] text-sm sm:text-base">
              {formatCurrency(dynamicTotal, currency)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Flow Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 print:hidden">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-10 space-y-8">
          {/* Integrated Stepper Progress Bar */}
          <div className="pb-6 border-b border-slate-100">
            <Stepper
              steps={stepperSteps}
              current={isConverted ? activeSteps.length : currentStep}
              onStepSelect={handleStepSelect}
              details="current"
              label="Quotation Acceptance Steps"
              completeLabel="Proposal authorized and finalized"
            />
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {/* STEP 0: Itemized Proposal & Scope / Add-ons */}
            {currentStepKey === "scope" && !isConverted && (
              <motion.div
                key="step-scope"
                initial={{ opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 24 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="border-b border-slate-100 pb-6 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-wider text-[#3A9295] font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#105F68]" />
                      Scope &amp; Specifications
                    </span>
                    <span className="text-[11px] px-3 py-0.5 rounded-full uppercase tracking-wider font-semibold bg-[#C8E6E2]/50 text-[#105F68] border border-[#9ED5D1]/60">
                      Awaiting Approval
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-[#105F68] bg-[#C8E6E2]/30 px-2 py-0.5 rounded-md">
                          {quoteRefNumber}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${fulfillmentBadge.color}`}>
                          {fulfillmentBadge.label}
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
                        {quote.title}
                      </h2>
                      <div className="text-xs text-slate-500 space-y-1 pt-1">
                        <p>
                          Prepared for: <strong className="text-slate-800 font-semibold">{quote.clientName}</strong>
                          {quote.clientCompany && (
                            <span className="inline-flex items-center gap-1 ml-2 text-slate-600 font-medium">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {quote.clientCompany}
                            </span>
                          )}
                        </p>
                        <p className="text-slate-400">
                          {quote.clientEmail} {quote.clientPhone ? `• ${quote.clientPhone}` : ""}
                        </p>
                        {quote.clientAddress && (
                          <p className="flex items-center gap-1 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{quote.clientAddress}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right text-xs shrink-0 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">Valid Until</span>
                      <span className="font-mono font-semibold text-slate-800 text-sm">
                        {quote.expiresAt ? new Date(quote.expiresAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        }) : "30 Days"}
                      </span>
                      {quote.issuedAt && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Issued: {new Date(quote.issuedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scope of Work / Project Description (if customized) */}
                {quote.scopeDescription && (
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[#105F68] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#3A9295]" />
                      <span>Project Scope &amp; Executive Summary</span>
                    </span>
                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                      {quote.scopeDescription}
                    </p>
                  </div>
                )}

                {/* Line Items - Clean divided list */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-widest text-[#3A9295] font-semibold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#105F68]" />
                      <span>Scope Deliverables &amp; Line Items</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {quote.lineItems?.length || 0} {quote.lineItems?.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 border-y border-slate-100">
                    {quote.lineItems.map((item, idx) => {
                      const qty = item.quantity || 1;
                      const lineTotal = item.priceCents * qty;
                      return (
                        <div key={idx} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-mono text-[10px] font-medium shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <span className="font-medium text-slate-800 block truncate">{item.description}</span>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                <span className="uppercase text-[9px] font-semibold text-slate-400">
                                  {item.type || "Deliverable"}
                                </span>
                                <span>• Qty: {qty}</span>
                                <span>• Unit: {formatCurrency(item.priceCents, currency)}</span>
                              </div>
                            </div>
                          </div>
                          <span className="font-mono font-semibold text-[#105F68] text-sm shrink-0">
                            {formatCurrency(lineTotal, currency)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Add-Ons */}
                {quote.optionalAddOns && quote.optionalAddOns.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs uppercase tracking-widest text-[#3A9295] font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#105F68]" />
                        <span>Optional Add-Ons (Select to Include in Agreement)</span>
                      </h3>
                      <span className="text-[11px] text-[#3A9295] bg-[#C8E6E2]/40 px-2 py-0.5 rounded-full font-medium">
                        Live reactive
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 border-y border-slate-100">
                      {quote.optionalAddOns.map((opt) => {
                        const isChecked = !!selectedAddOns[opt.id];
                        return (
                          <div
                            key={opt.id}
                            onClick={() => toggleAddOn(opt.id)}
                            className={`py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              isChecked ? "bg-slate-50/80 px-3 -mx-3 rounded-xl" : "hover:bg-slate-50/50 px-3 -mx-3 rounded-xl"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                                  isChecked
                                    ? "bg-[#105F68] border-[#105F68] text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3" />}
                              </div>
                              <span className="text-xs font-medium text-slate-800">
                                {opt.description}
                              </span>
                            </div>
                            <span className="text-xs font-mono font-semibold text-[#105F68] shrink-0">
                              +{formatCurrency(opt.priceCents, currency)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Special Instructions / Notes */}
                {quote.notes && (
                  <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                    <span className="font-semibold block text-[11px] uppercase tracking-wider text-amber-800">
                      Important Notes &amp; Special Conditions
                    </span>
                    <p className="text-amber-800 leading-relaxed font-light">
                      {quote.notes}
                    </p>
                  </div>
                )}

                {/* Terms and Conditions Preview */}
                {quote.termsAndConditions && (
                  <div className="border-l-2 border-[#105F68]/30 pl-4 py-1 space-y-1.5">
                    <span className="text-xs font-semibold text-[#105F68] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#3A9295]" />
                      <span>Agreed Proposal Terms &amp; Conditions Preview</span>
                    </span>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-mono text-[11px]">
                      {quote.termsAndConditions}
                    </p>
                  </div>
                )}

                {/* Dynamic Total Summary */}
                <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                  {quote.subtotalCents !== undefined && (
                    <div className="flex justify-between text-slate-500">
                      <span>Items Subtotal:</span>
                      <span className="font-mono font-medium text-slate-700">
                        {formatCurrency(quote.subtotalCents, currency)}
                      </span>
                    </div>
                  )}

                  {quote.discountCents !== undefined && quote.discountCents > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>
                        Contract Discount {quote.discountPercentage ? `(${quote.discountPercentage}%)` : ""}:
                      </span>
                      <span className="font-mono font-medium">
                        -{formatCurrency(quote.discountCents, currency)}
                      </span>
                    </div>
                  )}

                  {quote.taxCents !== undefined && quote.taxCents > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>
                        Estimated Tax / VAT {quote.taxRate ? `(${quote.taxRate}%)` : ""}:
                      </span>
                      <span className="font-mono font-medium text-slate-700">
                        +{formatCurrency(quote.taxCents, currency)}
                      </span>
                    </div>
                  )}

                  {addOnsTotal > 0 && (
                    <div className="flex justify-between text-[#105F68]">
                      <span>Selected Optional Add-Ons:</span>
                      <span className="font-mono font-medium">+{formatCurrency(addOnsTotal, currency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-base sm:text-lg font-semibold text-[#105F68] pt-2 border-t border-slate-100">
                    <span>Agreed Package Value:</span>
                    <span className="font-mono">{formatCurrency(dynamicTotal, currency)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-medium text-[#3A9295]">
                    <span>
                      {hasDeposit ? "Required Deposit:" : "Deposit Required:"}
                    </span>
                    <span className="font-mono text-sm font-semibold text-[#105F68]">
                      {hasDeposit ? formatCurrency(dynamicDeposit, currency) : "None (0% Upfront)"}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Direct settlement to merchant. 0% platform intermediary take-rate.</span>
                  </div>
                </div>

                {stepErrors.scope && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-xs border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{stepErrors.scope}</span>
                  </div>
                )}

                {/* Step Actions */}
                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    Next step: {requiresSignature ? "Digital e-signature & authorization" : (requiresScheduling ? "Select kickoff slot" : "Finalize agreement")}
                  </span>
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-semibold tracking-tight flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <span>
                      {requiresSignature ? "Continue to E-Signature" : (requiresScheduling ? "Continue to Schedule" : "Continue to Authorize")}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 1: Click-to-Sign Legal Agreement */}
            {currentStepKey === "sign" && !isConverted && (
              <motion.div
                key="step-sign"
                initial={{ opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 24 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="border-b border-slate-100 pb-5 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-wider text-[#3A9295] font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#105F68]" />
                      Digital E-Signature • Legal Authorization
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
                      ESIGN &amp; UETA Compliant
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
                    Authorize Agreement &amp; Terms
                  </h2>
                  <p className="text-xs text-slate-500">
                    Sign electronically with responsive ink or typed confirmation for proposal #{quoteRefNumber}.
                  </p>
                </div>

                {/* Inline Recap Strip */}
                <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Proposal:</span>
                    <strong className="text-slate-800 font-semibold">{quote.title}</strong>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">Total: <strong className="font-mono text-slate-800">{formatCurrency(dynamicTotal, currency)}</strong></span>
                    {hasDeposit && (
                      <span className="text-[#3A9295]">Deposit Hold: <strong className="font-mono text-[#105F68]">{formatCurrency(dynamicDeposit, currency)}</strong></span>
                    )}
                  </div>
                </div>

                {/* Proposal Terms & Conditions */}
                {quote.termsAndConditions && (
                  <div className="border-l-2 border-[#105F68]/40 pl-4 py-1 space-y-1.5">
                    <span className="text-xs font-semibold text-[#105F68] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#3A9295]" />
                      <span>Agreed Proposal Terms &amp; Conditions</span>
                    </span>
                    <div className="whitespace-pre-line text-xs text-slate-600 leading-relaxed font-mono text-[11px] max-h-40 overflow-y-auto">
                      {quote.termsAndConditions}
                    </div>
                  </div>
                )}

                {/* Signature Workspace */}
                <div className="space-y-5 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-[#105F68]" />
                      <span>{signMode === "draw" ? "Draw your signature on the baseline below:" : "Type your legal name to e-sign:"}</span>
                    </label>

                    {/* Mode Switcher Pill */}
                    <div className="inline-flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          setSignMode("draw");
                        }}
                        className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all text-xs font-medium cursor-pointer ${
                          signMode === "draw"
                            ? "bg-white text-[#105F68] shadow-xs font-semibold"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        <PenTool className="w-3 h-3" />
                        <span>Draw</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          setSignMode("type");
                        }}
                        className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all text-xs font-medium cursor-pointer ${
                          signMode === "type"
                            ? "bg-white text-[#105F68] shadow-xs font-semibold"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        <Type className="w-3 h-3" />
                        <span>Type</span>
                      </button>
                    </div>
                  </div>

                  {/* Draw Signature Pad */}
                  {signMode === "draw" ? (
                    <div className="space-y-2">
                      <SignaturePad
                        signer={quote.clientName}
                        hint="Sign here with mouse, pen, or finger"
                        fileName={`quote-${quote.id}-signature`}
                        onChange={handleStrokesChange}
                        defaultColor="black"
                        defaultWidth="medium"
                        showColors={false}
                        showReplay={false}
                        showExports={false}
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Draw your signature above, or use the eraser to clear.</span>
                        {signatureStrokes.length > 0 && (
                          <span className="text-emerald-700 font-medium">
                            {signatureStrokes.length} {signatureStrokes.length === 1 ? "stroke" : "strokes"} captured
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Eleanor Vance"
                        value={typedSignature}
                        onChange={(e) => {
                          setTypedSignature(e.target.value);
                          if (stepErrors.sign) setStepErrors((prev) => ({ ...prev, sign: "" }));
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xl font-['Disolve'] text-[#105F68] focus:outline-none focus:bg-white focus:border-[#105F68] transition-colors"
                      />
                    </div>
                  )}

                  {/* Printed Legal Signer Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                        Printed Signer Legal Name
                      </label>
                      <input
                        type="text"
                        value={typedSignature}
                        onChange={(e) => setTypedSignature(e.target.value)}
                        placeholder="Full Legal Name"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#105F68] transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                        Signer Email
                      </label>
                      <input
                        type="email"
                        readOnly
                        value={quote.clientEmail}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Audit Trail */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100">
                    <span>IP Log: {userIpAddress}</span>
                    <span>Timestamp: {signedTimestamp}</span>
                    <span className="flex items-center gap-1 text-emerald-600 font-sans font-medium text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      SHA-256 Tamper-Proof Audit
                    </span>
                  </div>

                  {/* Consent Checkbox */}
                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      required
                      checked={acceptedTerms}
                      onChange={(e) => {
                        setAcceptedTerms(e.target.checked);
                        if (stepErrors.sign) setStepErrors((prev) => ({ ...prev, sign: "" }));
                      }}
                      className="w-4 h-4 rounded text-[#105F68] accent-[#105F68] mt-0.5 cursor-pointer"
                    />
                    <label htmlFor="agreeTerms" className="text-xs text-slate-600 cursor-pointer leading-relaxed">
                      I agree to the itemized deliverables, accept the proposal terms, and authorize this agreement.
                      {hasDeposit ? ` I acknowledge the ${formatCurrency(dynamicDeposit, currency)} deposit settlement.` : ""}
                    </label>
                  </div>
                </div>

                {stepErrors.sign && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-xs border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{stepErrors.sign}</span>
                  </div>
                )}

                {/* Step Actions */}
                <div className="pt-6 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="px-5 py-2.5 rounded-full border border-slate-200 text-xs text-slate-700 font-medium hover:bg-slate-50 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Scope</span>
                  </button>

                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-7 py-3 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-semibold tracking-tight flex items-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <span>
                      {requiresScheduling ? "Continue to Schedule" : (hasDeposit ? "Continue to Deposit" : "Continue to Finalize")}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Live Calendar & Time Slot Picker (Only when requiresScheduling is true) */}
            {currentStepKey === "schedule" && !isConverted && (
              <motion.div
                key="step-schedule"
                initial={{ opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 24 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="space-y-6"
              >
                <div className="border-b border-slate-100 pb-5 space-y-2">
                  <span className="text-[11px] uppercase tracking-wider text-[#3A9295] font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#105F68]" />
                    Appointment Booking • Kickoff Session
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
                    Pick Your Date &amp; Preferred Time Slot
                  </h2>
                  <p className="text-xs text-slate-500">
                    Direct calendar booking linked with your agreed proposal deliverables.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-700 block font-semibold flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#105F68]" />
                      <span>Target Appointment Date</span>
                    </label>
                    <input
                      type="date"
                      value={dayValue}
                      onChange={(e) => {
                        setSelectedDay(e.target.value);
                        if (stepErrors.schedule) setStepErrors((prev) => ({ ...prev, schedule: "" }));
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#105F68] transition-colors"
                    />
                    <p className="text-[11px] text-slate-400">
                      Chosen date: <b className="text-slate-700">{dayValue || "None chosen"}</b>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-700 block font-semibold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#105F68]" />
                      <span>Available Specialist Slots</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            playClick();
                            setSelectedTimeSlot(slot);
                            if (stepErrors.schedule) setStepErrors((prev) => ({ ...prev, schedule: "" }));
                          }}
                          className={`py-2 px-1 text-center rounded-xl text-xs transition-all cursor-pointer ${
                            selectedTimeSlot === slot
                              ? "bg-[#105F68] text-white font-medium shadow-xs"
                              : "bg-slate-50 border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-white"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Chosen slot: <b className="text-slate-700">{selectedTimeSlot}</b> (approx 90 min)
                    </p>
                  </div>
                </div>

                {stepErrors.schedule && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-xs border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{stepErrors.schedule}</span>
                  </div>
                )}

                {/* Step Actions */}
                <div className="pt-6 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="px-5 py-2.5 rounded-full border border-slate-200 text-xs text-slate-700 font-medium hover:bg-slate-50 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-7 py-3 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-semibold tracking-tight flex items-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <span>{hasDeposit ? "Continue to Deposit" : "Continue to Finalize"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3 / Final Step: Settlement or Final Confirmation */}
            {currentStepKey === "settlement" && !isConverted && (
              <motion.div
                key="step-settlement"
                initial={{ opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 24 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="space-y-6"
              >
                <div className="border-b border-slate-100 pb-5 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-wider text-[#3A9295] font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#105F68]" />
                      Final Confirmation • {hasDeposit ? "Deposit Settlement" : "Agreement Authorization"}
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#63C1BB]/20 text-[#105F68] font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>256-Bit TLS Direct Payout</span>
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
                    {hasDeposit
                      ? `Pay ${formatCurrency(dynamicDeposit, currency)} Reservation Deposit`
                      : "Authorize & Confirm Proposal"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {hasDeposit
                      ? "Direct settlement to merchant. Completes authorization and locks proposal deliverables."
                      : "No upfront deposit is required. Confirm acceptance to initiate project fulfillment."}
                  </p>
                </div>

                {/* Recap Bar */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Proposal Reference:</span>
                    <span className="font-mono font-semibold text-slate-800">{quoteRefNumber}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Client / Company:</span>
                    <span className="font-semibold text-slate-800">
                      {quote.clientName} {quote.clientCompany ? `(${quote.clientCompany})` : ""}
                    </span>
                  </div>
                  {requiresScheduling && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Kickoff Slot:</span>
                      <span className="font-semibold text-slate-800">{dayValue} at {selectedTimeSlot}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-semibold text-[#105F68] pt-2 border-t border-slate-200 text-sm">
                    <span>Total Contract Value:</span>
                    <span className="font-mono">{formatCurrency(dynamicTotal, currency)}</span>
                  </div>
                  {hasDeposit && (
                    <div className="flex justify-between items-center font-semibold text-[#3A9295] text-xs">
                      <span>Deposit Due Now:</span>
                      <span className="font-mono">{formatCurrency(dynamicDeposit, currency)}</span>
                    </div>
                  )}
                </div>

                {/* Designated Merchant Payment Channel */}
                {quote.paymentMethodName && (
                  <div className="border-l-2 border-[#105F68] pl-4 py-1 space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-3.5 h-3.5 text-[#105F68]" />
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        Designated Settlement Channel:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {quote.paymentMethodName}
                      </span>
                    </div>
                    {quote.paymentMethodDetails && (
                      <p className="text-[11px] text-slate-600 font-mono leading-relaxed">
                        {quote.paymentMethodDetails}
                      </p>
                    )}
                  </div>
                )}

                {/* Payment Fields (Card on file / SetupIntent) */}
                {hasDeposit ? (
                  <div className="space-y-4 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Card Number</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-[#105F68] transition-colors"
                          />
                          <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Expires</label>
                          <input
                            type="text"
                            required
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono text-center focus:outline-none focus:bg-white focus:border-[#105F68] transition-colors"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">CVC</label>
                          <input
                            type="text"
                            required
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono text-center focus:outline-none focus:bg-white focus:border-[#105F68] transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pt-1">
                      <input
                        type="checkbox"
                        id="saveCard"
                        checked={saveCardOnFile}
                        onChange={(e) => setSaveCardOnFile(e.target.checked)}
                        className="w-4 h-4 rounded text-[#105F68] accent-[#105F68] cursor-pointer"
                      />
                      <label htmlFor="saveCard" className="text-xs text-slate-600 cursor-pointer">
                        Save card on file for automated milestone payments and frictionless completion (Stripe SetupIntent).
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                    <span className="font-semibold block flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      Zero Deposit Required
                    </span>
                    <p className="text-emerald-800 leading-relaxed font-light">
                      Payment is settled according to the milestone and delivery terms outlined in this agreement. By clicking confirm below, you authorize the proposal.
                    </p>
                  </div>
                )}

                {stepErrors.settlement && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-xs border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{stepErrors.settlement}</span>
                  </div>
                )}

                {/* Final Submit Actions */}
                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-slate-200 text-xs text-slate-700 font-medium hover:bg-slate-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>0% Platform Take-Rate</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleFinalizeFlow()}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2.5 shadow-sm hover:shadow-md cursor-pointer"
                    >
                      <span>
                        {hasDeposit
                          ? `Sign & Pay ${formatCurrency(dynamicDeposit, currency)} Deposit`
                          : "Authorize & Confirm Proposal"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CONVERTED / COMPLETE SUCCESS VIEW */}
            {isConverted && (
              <motion.div
                key="step-complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="p-8 sm:p-12 rounded-3xl bg-[#E8F5E9] border border-[#A5D6A7] text-center space-y-5"
              >
                <div className="w-16 h-16 rounded-full bg-[#2E7D32] text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-light text-[#1B5E20]">
                  {requiresScheduling
                    ? "Proposal Signed & Appointment Locked!"
                    : "Proposal Signed & Agreement Authorized!"}
                </h3>
                <p className="text-xs sm:text-sm text-[#2E7D32] max-w-lg mx-auto leading-relaxed">
                  {requiresScheduling
                    ? `You have completed the entire quote-to-booking loop. Your ${formatCurrency(dynamicDeposit, currency)} deposit has been credited to booking #${convertedBookingId || "BK-101"}.`
                    : `You have successfully authorized proposal #${quoteRefNumber}. The merchant has been notified and fulfillment of your deliverables is initiated.`}
                </p>

                <div className="p-5 rounded-2xl bg-white/90 border border-[#A5D6A7] max-w-md mx-auto text-xs text-[#1B5E20] space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[#2E7D32]">Proposal Reference:</span>
                    <span className="font-mono font-semibold">{quoteRefNumber}</span>
                  </div>
                  {convertedInvoiceNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#2E7D32]">Generated Invoice:</span>
                      <span className="font-mono font-bold text-[#105F68]">{convertedInvoiceNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-[#2E7D32]">Payment Terms:</span>
                    <span className="font-semibold">Due upon Receipt</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#2E7D32]">Fulfillment Mode:</span>
                    <span className="font-semibold">{fulfillmentBadge.label}</span>
                  </div>
                  {requiresScheduling && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#2E7D32]">Scheduled Date:</span>
                      <span className="font-semibold">{dayValue} at {selectedTimeSlot}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-[#2E7D32]">Client / Signer:</span>
                    <span className="font-semibold">{quote.signatureData || quote.clientName}</span>
                  </div>
                  {quote.clientCompany && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#2E7D32]">Company:</span>
                      <span className="font-semibold">{quote.clientCompany}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-[#2E7D32]">Total Package:</span>
                    <span className="font-mono font-semibold">{formatCurrency(dynamicTotal, currency)}</span>
                  </div>
                  {hasDeposit && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#2E7D32]">Deposit Paid:</span>
                      <span className="font-mono font-semibold">{formatCurrency(dynamicDeposit, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-[#2E7D32]">Signature IP Logged:</span>
                    <span className="font-mono">{userIpAddress}</span>
                  </div>
                  {(quote.signatureSvg || signatureSvg) && (
                    <div className="pt-2 border-t border-[#A5D6A7]/40 flex flex-col items-center justify-center gap-1">
                      <span className="text-[10px] uppercase tracking-wider text-[#2E7D32] font-medium self-start">
                        Verified Electronic Signature
                      </span>
                      <div
                        className="w-full h-14 bg-white/80 rounded-xl border border-[#A5D6A7]/50 p-2 flex items-center justify-center [&>svg]:h-full [&>svg]:w-auto [&>svg]:max-w-full"
                        dangerouslySetInnerHTML={{ __html: quote.signatureSvg || signatureSvg }}
                      />
                    </div>
                  )}
                </div>

                <div className="pt-2 flex flex-wrap justify-center gap-3 print:hidden">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    className="px-6 py-2.5 rounded-full bg-[#1B5E20] text-white text-xs font-medium hover:bg-[#2E7D32] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloadingPdf ? "Generating PDF..." : "Download Official PDF"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSuccess();
                      window.print();
                    }}
                    className="px-6 py-2.5 rounded-full border border-[#1B5E20] text-[#1B5E20] text-xs font-medium hover:bg-[#1B5E20]/5 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Agreement</span>
                  </button>

                  {convertedInvoiceNumber && (
                    <button
                      type="button"
                      onClick={async () => {
                        playSuccess();
                        try {
                          const { getInvoices } = await import("@/lib/platform-store");
                          const allInvs = getInvoices(workspaceId);
                          const matchedInv = allInvs.find((i) => i.invoiceNumber === convertedInvoiceNumber || i.quoteId === quote.id);
                          if (matchedInv) {
                            const { generateInvoicePDF } = await import("@/lib/invoice-pdf");
                            await generateInvoicePDF(matchedInv, {
                              name: activeOvelink?.businessName || "Merchant Workspace",
                              currency,
                            });
                          }
                        } catch (err) {
                          console.error("Invoice PDF download error:", err);
                        }
                      }}
                      className="px-6 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-medium hover:bg-[#0D4F57] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Download Invoice PDF</span>
                    </button>
                  )}

                  {requiresScheduling && (
                    <button
                      type="button"
                      onClick={() => {
                        playSuccess();
                        alert("Google Calendar invite & ICS downloaded!");
                      }}
                      className="px-6 py-2.5 rounded-full border border-[#1B5E20] text-[#1B5E20] text-xs font-medium hover:bg-[#1B5E20]/5 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Add to Google Calendar</span>
                    </button>
                  )}

                  <Link
                    href={`/l/${activeOvelink?.slug || "leclat"}`}
                    className="px-6 py-2.5 rounded-full border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Visit Storefront</span>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* DEDICATED OFFICIAL PRINTABLE QUOTATION & AGREEMENT RECEIPT (VISIBLE ONLY ON PRINT) */}
      <div className="hidden print:block w-full max-w-4xl mx-auto bg-white text-[#103438] font-['Kaleko_105',sans-serif] p-4 sm:p-6">
        {/* Official Header */}
        <div className="border-b-2 border-[#105F68] pb-5 mb-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#105F68] tracking-tight">
                {activeOvelink?.businessName || "Merchant Workspace"}
              </h1>
              <p className="text-xs text-[#3A9295] mt-1 font-light">
                Official Business Quotation &amp; Agreement Statement • ovel.lk/l/{activeOvelink?.slug || "store"}
              </p>
              {(activeOvelink?.email || activeOvelink?.whatsappNumber) && (
                <p className="text-[11px] text-slate-500 mt-1">
                  {[activeOvelink?.email, activeOvelink?.whatsappNumber].filter(Boolean).join(" • ")}
                </p>
              )}
              {activeOvelink?.location && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {activeOvelink.location}
                </p>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#105F68] px-2.5 py-1 rounded inline-block">
                {isConverted ? "OFFICIAL QUOTATION & SIGNED RECEIPT" : "COMMERCIAL QUOTATION & PROPOSAL"}
              </span>
              <h2 className="text-base font-mono font-bold text-[#105F68] mt-2">
                {quoteRefNumber}
              </h2>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block mt-1">
                {isConverted ? "✓ AUTHORIZED & SIGNED" : "AWAITING AUTHORIZATION"}
              </span>
            </div>
          </div>
        </div>

        {/* Parties Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 mb-5 text-xs">
          {/* Billed To / Client */}
          <div className="p-4 rounded-xl border border-slate-200 bg-[#F6FAF9]/50 space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#3A9295] block">
              CLIENT / AUTHORIZED PARTY
            </span>
            <p className="font-bold text-sm text-[#103438]">{quote.clientName || "Valued Client"}</p>
            {quote.clientCompany && (
              <p className="text-slate-700 font-medium">Company: {quote.clientCompany}</p>
            )}
            <p className="text-slate-500">
              {[quote.clientEmail, quote.clientPhone].filter(Boolean).join(" • ")}
            </p>
            {quote.clientAddress && (
              <p className="text-slate-500">Address: {quote.clientAddress}</p>
            )}
          </div>

          {/* Transaction & Settlement Details */}
          <div className="p-4 rounded-xl border border-slate-200 bg-[#F6FAF9]/50 space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#3A9295] block">
              AGREEMENT &amp; SETTLEMENT DETAILS
            </span>
            <div className="flex justify-between">
              <span className="text-slate-500">Proposal Reference:</span>
              <span className="font-mono font-bold text-slate-800">{quoteRefNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date Issued:</span>
              <span className="font-medium text-slate-800">
                {new Date(quote.createdAt || new Date()).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fulfillment Mode:</span>
              <span className="font-medium text-slate-800">{fulfillmentBadge.label}</span>
            </div>
            {requiresScheduling && (
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Date:</span>
                <span className="font-medium text-slate-800">{dayValue} at {selectedTimeSlot}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Agreement Status:</span>
              <span className="font-bold text-emerald-800">
                {isConverted ? (hasDeposit ? "Authorized & Deposit Settled" : "Authorized & Confirmed") : "Awaiting Authorization"}
              </span>
            </div>
          </div>
        </div>

        {/* Scope Summary (if present) */}
        {quote.scopeDescription && (
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 mb-5 text-xs space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#105F68] block">
              PROJECT SCOPE &amp; SPECIFICATIONS
            </span>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">{quote.scopeDescription}</p>
          </div>
        )}

        {/* Itemized Table */}
        <div className="mb-5">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-[#105F68] text-white">
                <th className="py-2.5 px-3 font-semibold text-[11px] w-8">#</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">DELIVERABLE / SCOPE SPECIFICATION</th>
                <th className="py-2.5 px-3 font-semibold text-[11px] text-center w-16">QTY</th>
                <th className="py-2.5 px-3 font-semibold text-[11px] text-right w-28">UNIT PRICE</th>
                <th className="py-2.5 px-3 font-semibold text-[11px] text-right w-28">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {quote.lineItems?.map((item, idx) => {
                const qty = item.quantity || 1;
                const total = (item.priceCents || 0) * qty;
                return (
                  <tr key={idx} className={idx % 2 === 1 ? "bg-slate-50/60" : "bg-white"}>
                    <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">{item.description}</td>
                    <td className="py-2 px-3 text-center text-slate-600 font-mono">{qty}</td>
                    <td className="py-2 px-3 text-right text-slate-600 font-mono">{formatCurrency(item.priceCents, currency)}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">{formatCurrency(total, currency)}</td>
                  </tr>
                );
              })}
              {quote.optionalAddOns?.filter((opt) => selectedAddOns[opt.id]).map((opt, idx) => (
                <tr key={`addon-${idx}`} className="bg-emerald-50/40">
                  <td className="py-2 px-3 text-emerald-700 font-mono text-[11px]">+</td>
                  <td className="py-2 px-3 text-emerald-900 font-medium">
                    [Approved Option] {opt.description}
                  </td>
                  <td className="py-2 px-3 text-center text-emerald-700 font-mono">1</td>
                  <td className="py-2 px-3 text-right text-emerald-700 font-mono">{formatCurrency(opt.priceCents, currency)}</td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-900 font-mono">{formatCurrency(opt.priceCents, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Breakdown (Right Aligned) */}
        <div className="flex justify-end mb-5 text-xs">
          <div className="w-80 space-y-1.5 border border-slate-200 rounded-xl p-3.5 bg-[#F6FAF9]/50">
            <div className="flex justify-between text-slate-600">
              <span>Base Proposal Value:</span>
              <span className="font-mono font-medium">{formatCurrency(quote.totalCents || 0, currency)}</span>
            </div>
            {addOnsTotal > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Approved Add-ons Total:</span>
                <span className="font-mono">+{formatCurrency(addOnsTotal, currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[#105F68] pt-1 border-t border-slate-200">
              <span>Total Agreed Value:</span>
              <span className="font-mono text-sm">{formatCurrency(dynamicTotal, currency)}</span>
            </div>
            {hasDeposit && (
              <>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Upfront Deposit Paid:</span>
                  <span className="font-mono">-{formatCurrency(dynamicDeposit, currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Remaining Balance Due:</span>
                  <span className="font-mono text-sm">{formatCurrency(dynamicTotal - dynamicDeposit, currency)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* E-Signature & Audit Trail Block */}
        {isConverted && (
          <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/60 mb-5 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                ✓ VERIFIED ELECTRONIC SIGNATURE &amp; AUDIT TRAIL
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold uppercase tracking-wider">
                Legally Binding Agreement
              </span>
            </div>

            <p className="text-[11px] text-emerald-900 leading-relaxed">
              This document certifies that the proposal scope, deliverables, and payment terms detailed above were formally authorized and electronically executed by the client in accordance with applicable electronic transaction standards.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-emerald-200">
              <div>
                <p className="text-slate-800"><b>Signer:</b> {quote.signatureData || quote.clientName}</p>
                {quote.clientCompany && <p className="text-slate-700"><b>Company:</b> {quote.clientCompany}</p>}
                <p className="text-slate-500 text-[10px] mt-1"><b>Signed At:</b> {signedTimestamp}</p>
                <p className="text-slate-500 text-[10px]"><b>Verification IP:</b> {userIpAddress}</p>
              </div>

              <div className="flex flex-col items-end justify-center">
                {(quote.signatureSvg || signatureSvg) && (
                  <div
                    className="w-48 h-12 bg-white rounded border border-emerald-200 p-1 flex items-center justify-center [&>svg]:h-full [&>svg]:w-auto [&>svg]:max-w-full"
                    dangerouslySetInnerHTML={{ __html: quote.signatureSvg || signatureSvg }}
                  />
                )}
                <span className="text-[9px] uppercase tracking-wider text-emerald-800 font-semibold mt-1">
                  Cryptographically Logged
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Document Footer */}
        <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Official Quotation &amp; Agreement #{quoteRefNumber} • Generated via Ovel Operating Platform</span>
          <span>Page 1 of 1 • Valid Business Document</span>
        </div>
      </div>
    </div>
  );
}
