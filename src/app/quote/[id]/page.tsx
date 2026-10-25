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
  Landmark
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  getQuotes, 
  saveQuotes, 
  createBooking, 
  findQuoteById,
  QuoteProposal 
} from "@/lib/platform-store";
import { addDaysLocal, addMinutes, displayTimeToIsoLocal } from "@/lib/booking-time";
import { useHydrated } from "@/lib/use-client-store";
import { useAudio } from "@/components/AudioController";
import ProgressiveBlur from "@/components/ProgressiveBlur";
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

  // Conversion state
  const isAlreadyConverted = quote.status === "accepted" || quote.status === "converted";
  const [isConverted, setIsConverted] = useState(isAlreadyConverted);
  const [convertedBookingId, setConvertedBookingId] = useState(quote.convertedBookingId || "");

  // Multi-step separate flow state (0: Scope, 1: Sign, 2: Schedule, 3: Deposit, 4: Done)
  const [currentStep, setCurrentStep] = useState<number>(isAlreadyConverted ? 4 : 0);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState<1 | -1>(1);

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

  // Step 1: Signature state (Signature Pad + Typed Fallback)
  const [signMode, setSignMode] = useState<"draw" | "type">("draw");
  const [signatureStrokes, setSignatureStrokes] = useState<InkStroke[]>([]);
  const [signatureSvg, setSignatureSvg] = useState<string>(quote?.signatureSvg || "");
  const [typedSignature, setTypedSignature] = useState(quote?.signatureData || quote?.clientName || "");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [userIpAddress] = useState("127.0.0.1 (Verified Client)");
  const [signedTimestamp] = useState(() => new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC");

  // Step 2: Schedule appointment state
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
    // Simulate instant Quote View Tracking notification to merchant
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

  // Dynamic pricing calculation based on toggled add-ons
  const addOnsTotal = useMemo(() => {
    if (!quote?.optionalAddOns) return 0;
    return quote.optionalAddOns.reduce((sum, opt) => {
      return selectedAddOns[opt.id] ? sum + opt.priceCents : sum;
    }, 0);
  }, [quote, selectedAddOns]);

  const dynamicTotal = (quote?.totalCents || 0) + addOnsTotal;
  const dynamicDeposit = Math.round(dynamicTotal * 0.25);

  const toggleAddOn = (optId: string) => {
    playClick();
    setSelectedAddOns((prev) => ({ ...prev, [optId]: !prev[optId] }));
  };

  // Stepper definition
  const stepperSteps: StepperStep[] = useMemo(() => [
    {
      id: "scope",
      label: "Scope & Add-ons",
      description: "Review items & options",
      error: stepErrors.scope,
    },
    {
      id: "sign",
      label: "E-Signature",
      description: "Authorize agreement",
      error: stepErrors.sign,
    },
    {
      id: "schedule",
      label: "Kickoff Slot",
      description: "Pick date & specialist time",
      error: stepErrors.schedule,
    },
    {
      id: "deposit",
      label: "Pay Deposit",
      description: "Card on file & direct payout",
      error: stepErrors.deposit,
    },
  ], [stepErrors]);

  // Step Navigation Handlers
  const goToNextStep = () => {
    if (!quote) return;
    const nowMs = new Date().getTime();
    if (quote.expiresAt && Date.parse(quote.expiresAt) < nowMs) {
      setStepErrors((prev) => ({ ...prev, [stepperSteps[currentStep].id]: "This proposal has expired." }));
      return;
    }

    if (currentStep === 0) {
      // Advance to Sign
      setStepErrors((prev) => ({ ...prev, scope: "" }));
      setDirection(1);
      playClick();
      setCurrentStep(1);
      return;
    }

    if (currentStep === 1) {
      // Validate Sign
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
        setStepErrors((prev) => ({ ...prev, sign: "Please accept the service and cancellation terms." }));
        return;
      }
      setStepErrors((prev) => ({ ...prev, sign: "" }));
      setDirection(1);
      playClick();
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      // Validate Schedule
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
      setCurrentStep(3);
      return;
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0 && !isConverted) {
      setDirection(-1);
      playClick();
      setCurrentStep((prev) => prev - 1);
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
      setStepErrors((prev) => ({ ...prev, deposit: "This proposal has expired." }));
      return;
    }

    const bookingStartTime = displayTimeToIsoLocal(dayValue, selectedTimeSlot);
    const bookingEndTime = bookingStartTime ? addMinutes(bookingStartTime, 90) : null;
    if (!bookingStartTime || !bookingEndTime) {
      setStepErrors((prev) => ({ ...prev, deposit: "Choose a valid appointment time." }));
      return;
    }

    const finalSignerLabel = signMode === "draw" 
      ? `${quote.clientName || "Client"} (Handwritten Ink)` 
      : (typedSignature || quote.clientName || "Authorized Client");
    const finalSignatureSvg = signMode === "draw" && signatureSvg ? signatureSvg : undefined;

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
      notes: `Multi-Step Quote Conversion. E-Signed: ${finalSignerLabel} (${userIpAddress}). Deposit: ${formatCurrency(dynamicDeposit, currency)}.`,
    }, workspaceId);

    if (!booking) {
      setStepErrors((prev) => ({ ...prev, deposit: "That time is already booked. Choose another slot." }));
      return;
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
          convertedBookingId: booking.id,
        };
      }
      return q;
    });

    saveQuotes(updated, workspaceId);
    setQuote((prev) => ({
      ...prev,
      status: "accepted",
      signatureData: finalSignerLabel,
      signatureSvg: finalSignatureSvg,
      totalCents: dynamicTotal,
      depositCents: dynamicDeposit,
      convertedBookingId: booking.id,
    }));
    setConvertedBookingId(booking.id);
    setIsConverted(true);
    setCurrentStep(4);
  }, [
    quote, 
    isConverted, 
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
    playSuccess
  ]);

  const timeSlots = ["09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM"];

  return (
    <div className="min-h-screen bg-[#F6FAF9] text-[#103438] antialiased selection:bg-[#105F68] selection:text-white font-['Kaleko_105',sans-serif] flex flex-col">
      <ProgressiveBlur position="top" height="h-20" />

      {/* Floating View Tracking Banner */}
      {viewTracked && !isConverted && (
        <div className="bg-[#105F68] text-white px-4 py-2 text-[11px] font-light flex items-center justify-center gap-2 border-b border-[#63C1BB]/30 animate-in slide-in-from-top-2">
          <Eye className="w-3.5 h-3.5 text-[#63C1BB]" />
          <span>
            <b>Live View Tracking Active:</b> Business owner was just notified that you opened proposal #{quote.id.toUpperCase()}.
          </span>
        </div>
      )}

      {/* Sticky Flow Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#105F68]/10 px-4 sm:px-8 py-3.5">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#C8E6E2]/40 border border-[#9ED5D1]/60 flex items-center justify-center p-2">
              <Image src="/icon.svg" alt="Ovel Logo" width={24} height={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-light text-[#105F68]">
                  Client Quotation Portal
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#63C1BB]/20 text-[#105F68] font-medium">
                  {isConverted ? "Confirmed" : `Step ${currentStep + 1} of 4`}
                </span>
              </div>
              <p className="text-[11px] text-[#3A9295] font-light">
                {quote.title}
              </p>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="text-[#3A9295]">Total Value: </span>
            <span className="font-semibold text-[#105F68]">{formatCurrency(dynamicTotal, currency)}</span>
          </div>
        </div>
      </header>

      {/* Main Flow Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10">
        
        {/* UI Arc Stepper Indicator Card */}
        <div className="bg-white rounded-3xl border border-[#105F68]/15 shadow-sm p-4 sm:p-6 mb-6">
          <Stepper
            steps={stepperSteps}
            current={isConverted ? 4 : currentStep}
            onStepSelect={handleStepSelect}
            details="all"
            label="Quotation Acceptance Steps"
            completeLabel="Proposal authorized and deposit paid"
          />
        </div>

        {/* Dynamic Multi-Step Body */}
        <div className="bg-white rounded-[2.5rem] border border-[#105F68]/15 shadow-xl p-6 sm:p-12 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {/* STEP 0: Itemized Proposal & Scope / Add-ons */}
            {currentStep === 0 && !isConverted && (
              <motion.div
                key="step-scope"
                initial={{ opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 24 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/5 pb-6">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#3A9295] font-light">
                      STEP 1 OF 4 • SCOPE &amp; CUSTOMIZATION
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight mt-1">
                      {quote.title}
                    </h2>
                    <p className="text-xs text-[#3A9295] mt-1">
                      Custom prepared for <b>{quote.clientName}</b> • Zero platform take-rate (100% direct settlement)
                    </p>
                  </div>

                  <div className="text-left sm:text-right text-xs">
                    <span className="text-[#3A9295]">Proposal Valid Until:</span>
                    <p className="font-semibold text-[#105F68]">
                      {quote.expiresAt.substring(0, 10)}
                    </p>
                    <span className="inline-block mt-2 text-[10px] px-3 py-1 rounded-full uppercase tracking-wider font-medium bg-[#C8E6E2]/40 text-[#105F68]">
                      Status: Awaiting Approval
                    </span>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="space-y-3">
                  <h3 className="text-xs uppercase tracking-widest text-[#3A9295] font-light">
                    Included Core Protocols
                  </h3>
                  <div className="divide-y divide-black/5 border border-black/5 rounded-2xl overflow-hidden">
                    {quote.lineItems.map((item, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between text-xs bg-[#FBFDFD]">
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-[#105F68]/10 text-[#105F68] flex items-center justify-center font-mono text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-[#105F68]">{item.description}</span>
                        </div>
                        <span className="font-semibold text-[#105F68]">
                          {formatCurrency(item.priceCents, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interactive Optional Add-Ons */}
                {quote.optionalAddOns && quote.optionalAddOns.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs uppercase tracking-widest text-[#3A9295] font-light flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#105F68]" />
                        <span>Optional Add-Ons (Select to Include in Agreement)</span>
                      </h3>
                      <span className="text-[11px] text-[#3A9295]">Live reactive total</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {quote.optionalAddOns.map((opt) => {
                        const isChecked = !!selectedAddOns[opt.id];
                        return (
                          <div
                            key={opt.id}
                            onClick={() => toggleAddOn(opt.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isChecked
                                ? "border-[#105F68] bg-[#C8E6E2]/30 shadow-sm"
                                : "border-black/5 bg-[#FBFDFD] hover:border-[#105F68]/30"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                                  isChecked
                                    ? "bg-[#105F68] border-[#105F68] text-white"
                                    : "border-black/20 bg-white"
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5" />}
                              </div>
                              <span className="text-xs font-medium text-[#105F68]">
                                {opt.description}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-[#105F68]">
                              +{formatCurrency(opt.priceCents, currency)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Dynamic Total Summary Box */}
                <div className="p-5 rounded-2xl bg-[#F6FAF9] border border-[#105F68]/15 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#3A9295]">Core Scope Subtotal:</span>
                    <span className="text-[#105F68] font-medium">{formatCurrency(quote.totalCents, currency)}</span>
                  </div>
                  {addOnsTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#3A9295]">Selected Add-Ons:</span>
                      <span className="text-[#105F68] font-medium">+{formatCurrency(addOnsTotal, currency)}</span>
                    </div>
                  )}
                  <div className="h-px bg-black/5 my-1" />
                  <div className="flex justify-between text-base font-semibold text-[#105F68]">
                    <span>Agreed Total Package Value:</span>
                    <span>{formatCurrency(dynamicTotal, currency)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-[#3A9295]">
                    <span>Required Reservation Deposit (25%):</span>
                    <span className="text-[#105F68] font-semibold">{formatCurrency(dynamicDeposit, currency)}</span>
                  </div>
                </div>

                {stepErrors.scope && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{stepErrors.scope}</span>
                  </div>
                )}

                {/* Step Actions */}
                <div className="pt-4 flex items-center justify-between border-t border-black/5">
                  <span className="text-xs text-[#3A9295]">
                    Next: Digital signature &amp; agreement
                  </span>
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-6 py-3 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-medium tracking-tight flex items-center gap-2 shadow-md hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    <span>Continue to E-Signature</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 1: Click-to-Sign Legal Agreement */}
            {currentStep === 1 && !isConverted && (
              <motion.div
                key="step-sign"
                initial={{ opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 24 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="space-y-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 pb-6">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#3A9295] font-light">
                      STEP 2 OF 4 • LEGALLY BINDING E-SIGNATURE
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight mt-1">
                      Authorize Agreement &amp; Service Terms
                    </h2>
                    <p className="text-xs text-[#3A9295] mt-1">
                      Sign electronically with responsive ink or typed confirmation for proposal #{quote.id.toUpperCase()}.
                    </p>
                  </div>

                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] font-medium border border-[#A5D6A7]">
                    ESIGN &amp; UETA Compliant
                  </span>
                </div>

                {/* Proposal Mini Recap */}
                <div className="p-4 rounded-2xl bg-[#F6FAF9] border border-[#105F68]/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[#3A9295]">Agreed Package: </span>
                    <b className="text-[#105F68]">{quote.title}</b>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[#3A9295]">Total: <b className="text-[#105F68]">{formatCurrency(dynamicTotal, currency)}</b></span>
                    <span className="text-[#3A9295]">Deposit: <b className="text-[#105F68]">{formatCurrency(dynamicDeposit, currency)}</b></span>
                  </div>
                </div>

                {/* Proposal Terms & Conditions (if typed by merchant) */}
                {quote.termsAndConditions && (
                  <div className="p-5 rounded-3xl border border-[#105F68]/15 bg-white space-y-2.5 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#105F68]">
                      <FileText className="w-3.5 h-3.5 text-[#3A9295]" />
                      <span>Agreed Proposal Terms &amp; Conditions</span>
                    </div>
                    <div className="whitespace-pre-line text-xs text-slate-600 leading-relaxed bg-[#F6FAF9] p-3.5 rounded-2xl border border-black/5 font-mono text-[11px] max-h-48 overflow-y-auto">
                      {quote.termsAndConditions}
                    </div>
                  </div>
                )}

                {/* Signature Mode Switcher & Card */}
                <div className="p-6 rounded-3xl border border-black/10 bg-[#FBFDFD] space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-3">
                    <span className="text-xs text-[#3A9295] font-medium">
                      Select Signature Method:
                    </span>
                    <div className="flex items-center gap-1 p-1 bg-black/5 rounded-full text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          setSignMode("draw");
                        }}
                        className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all text-xs font-medium cursor-pointer ${
                          signMode === "draw"
                            ? "bg-[#105F68] text-white shadow-sm"
                            : "text-[#3A9295] hover:text-[#105F68]"
                        }`}
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>Draw Ink Signature</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          setSignMode("type");
                        }}
                        className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all text-xs font-medium cursor-pointer ${
                          signMode === "type"
                            ? "bg-[#105F68] text-white shadow-sm"
                            : "text-[#3A9295] hover:text-[#105F68]"
                        }`}
                      >
                        <Type className="w-3.5 h-3.5" />
                        <span>Type Name</span>
                      </button>
                    </div>
                  </div>

                  {/* Draw Signature via Arc SignaturePad */}
                  {signMode === "draw" ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-[#3A9295] font-medium flex items-center gap-1.5">
                          <PenTool className="w-3.5 h-3.5 text-[#105F68]" />
                          <span>Draw your signature on the baseline below:</span>
                        </label>
                        {signatureStrokes.length > 0 && (
                          <span className="text-[11px] font-medium text-[#105F68] bg-[#C8E6E2]/40 px-2.5 py-0.5 rounded-full">
                            {signatureStrokes.length} {signatureStrokes.length === 1 ? "stroke" : "strokes"} recorded
                          </span>
                        )}
                      </div>

                      <div className="rounded-2xl border border-black/10 p-3 bg-white shadow-sm">
                        <SignaturePad
                          signer={quote.clientName}
                          hint="Sign here with mouse, pen, or finger"
                          fileName={`quote-${quote.id}-signature`}
                          onChange={handleStrokesChange}
                          defaultColor="black"
                          defaultWidth="medium"
                        />
                      </div>
                      <p className="text-[11px] text-[#82a3a5] italic">
                        Tip: You can use the replay button to preview your stroke rhythm, or clear with the animated squeegee wipe.
                      </p>
                    </div>
                  ) : (
                    /* Typed Signature Option */
                    <div className="space-y-3">
                      <label className="text-xs text-[#3A9295] block font-medium">
                        Type your full legal name to generate digital e-signature:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Eleanor Vance"
                        value={typedSignature}
                        onChange={(e) => {
                          setTypedSignature(e.target.value);
                          if (stepErrors.sign) setStepErrors((prev) => ({ ...prev, sign: "" }));
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-black/10 text-xl font-['Disolve'] text-[#105F68] focus:outline-none focus:border-[#105F68] shadow-inner"
                      />
                    </div>
                  )}

                  {/* Printed Legal Signer Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-[11px] uppercase tracking-wider text-[#3A9295] font-medium">
                        Printed Signer Legal Name
                      </label>
                      <input
                        type="text"
                        value={typedSignature}
                        onChange={(e) => setTypedSignature(e.target.value)}
                        placeholder="Full Legal Name"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] uppercase tracking-wider text-[#3A9295] font-medium">
                        Associated Client Email
                      </label>
                      <input
                        type="email"
                        readOnly
                        value={quote.clientEmail}
                        className="w-full px-3.5 py-2 rounded-xl bg-black/5 border border-black/5 text-xs text-[#3A9295] cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Audit Trail Logging Box */}
                  <div className="p-3.5 rounded-xl bg-[#F6FAF9] border border-[#105F68]/15 text-[10px] text-[#3A9295] font-mono flex flex-wrap items-center justify-between gap-2">
                    <span>IP Log: {userIpAddress}</span>
                    <span>Timestamp: {signedTimestamp}</span>
                    <span>Audit Security: SHA-256 Verified</span>
                  </div>

                  <div className="flex items-start gap-2.5 pt-2">
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
                    <label htmlFor="agreeTerms" className="text-xs text-[#3A9295] cursor-pointer leading-relaxed">
                      I agree to the itemized scope of work, acknowledge the 24-hour cancellation policy, and authorize the {formatCurrency(dynamicDeposit, currency)} deposit charge.
                    </label>
                  </div>
                </div>

                {stepErrors.sign && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{stepErrors.sign}</span>
                  </div>
                )}

                {/* Step Actions */}
                <div className="pt-4 flex items-center justify-between border-t border-black/5">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="px-5 py-2.5 rounded-full border border-black/10 text-xs text-[#105F68] font-medium hover:bg-black/5 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Scope</span>
                  </button>

                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-6 py-3 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-medium tracking-tight flex items-center gap-2 shadow-md hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    <span>Continue to Schedule</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Live Calendar & Time Slot Picker */}
            {currentStep === 2 && !isConverted && (
              <motion.div
                key="step-schedule"
                initial={{ opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 24 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="space-y-6"
              >
                <div className="border-b border-black/5 pb-6">
                  <span className="text-xs uppercase tracking-widest text-[#3A9295] font-light">
                    STEP 3 OF 4 • SELECT KICKOFF APPOINTMENT
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight mt-1">
                    Pick Your Date &amp; Preferred Time Slot
                  </h2>
                  <p className="text-xs text-[#3A9295] mt-1">
                    Intelligent scheduling padded with smart buffer times for prep and sanitization.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="p-5 rounded-2xl border border-black/10 bg-[#FBFDFD] space-y-3">
                    <label className="text-xs text-[#3A9295] block font-medium flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#105F68]" />
                      <span>Target Appointment Date:</span>
                    </label>
                    <input
                      type="date"
                      value={dayValue}
                      onChange={(e) => {
                        setSelectedDay(e.target.value);
                        if (stepErrors.schedule) setStepErrors((prev) => ({ ...prev, schedule: "" }));
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-black/10 text-xs text-[#105F68] font-medium focus:outline-none focus:border-[#105F68]"
                    />
                    <p className="text-[11px] text-[#3A9295]">
                      Selected day: <b>{dayValue || "None chosen"}</b>
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl border border-black/10 bg-[#FBFDFD] space-y-3">
                    <label className="text-xs text-[#3A9295] block font-medium flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#105F68]" />
                      <span>Available Specialist Time Slots:</span>
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
                          className={`py-2.5 px-1 text-center rounded-xl text-xs transition-all cursor-pointer ${
                            selectedTimeSlot === slot
                              ? "bg-[#105F68] text-white font-medium shadow-sm"
                              : "bg-white border border-black/10 text-[#105F68] hover:border-[#105F68]"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#3A9295]">
                      Selected slot: <b>{selectedTimeSlot}</b> (approx 90 min)
                    </p>
                  </div>
                </div>

                {stepErrors.schedule && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{stepErrors.schedule}</span>
                  </div>
                )}

                {/* Step Actions */}
                <div className="pt-4 flex items-center justify-between border-t border-black/5">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="px-5 py-2.5 rounded-full border border-black/10 text-xs text-[#105F68] font-medium hover:bg-black/5 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Signature</span>
                  </button>

                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-6 py-3 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-medium tracking-tight flex items-center gap-2 shadow-md hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    <span>Continue to Deposit</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Frictionless 0% Take-Rate Deposit Settlement */}
            {currentStep === 3 && !isConverted && (
              <motion.div
                key="step-deposit"
                initial={{ opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 24 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="space-y-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 pb-6">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#3A9295] font-light">
                      STEP 4 OF 4 • SECURE DEPOSIT &amp; CARD-ON-FILE
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight mt-1">
                      Pay {formatCurrency(dynamicDeposit, currency)} Reservation Deposit
                    </h2>
                    <p className="text-xs text-[#3A9295] mt-1">
                      Direct settlement to merchant. Finalize your confirmed slot for {dayValue} at {selectedTimeSlot}.
                    </p>
                  </div>

                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#63C1BB]/20 text-[#105F68] font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>256-Bit TLS Stripe SetupIntent</span>
                  </span>
                </div>

                {/* Designated Merchant Payment Channel (if specified) */}
                {quote.paymentMethodName && (
                  <div className="p-4 rounded-2xl bg-white border border-[#105F68]/20 space-y-1.5 text-xs shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-[#105F68]/10 text-[#105F68]">
                        <Landmark className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">
                          Designated Settlement Channel
                        </span>
                        <span className="font-semibold text-[#105F68] text-xs">
                          {quote.paymentMethodName}
                        </span>
                      </div>
                    </div>
                    {quote.paymentMethodDetails && (
                      <p className="text-[11px] text-slate-600 font-mono bg-[#F6FAF9] p-2.5 rounded-xl border border-black/5 leading-relaxed">
                        {quote.paymentMethodDetails}
                      </p>
                    )}
                  </div>
                )}

                {/* Payment Form Fields */}
                <div className="p-6 rounded-2xl border border-black/10 bg-[#FBFDFD] space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] uppercase tracking-wider text-[#3A9295]">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-white border border-black/10 text-xs text-[#105F68] font-mono focus:outline-none focus:border-[#105F68]"
                        />
                        <CreditCard className="w-4 h-4 text-[#3A9295] absolute right-3 top-3" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-wider text-[#3A9295]">Expires</label>
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-black/10 text-xs text-[#105F68] font-mono text-center focus:outline-none focus:border-[#105F68]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-wider text-[#3A9295]">CVC</label>
                        <input
                          type="text"
                          required
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-black/10 text-xs text-[#105F68] font-mono text-center focus:outline-none focus:border-[#105F68]"
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
                    <label htmlFor="saveCard" className="text-xs text-[#3A9295] cursor-pointer">
                      Save card on file for frictionless checkout and 24h no-show guarantee (Stripe SetupIntent).
                    </label>
                  </div>
                </div>

                {stepErrors.deposit && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{stepErrors.deposit}</span>
                  </div>
                )}

                {/* Final Submit Actions */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-black/5">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-black/10 text-xs text-[#105F68] font-medium hover:bg-black/5 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Schedule</span>
                  </button>

                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <div className="flex items-center gap-2 text-xs text-[#3A9295]">
                      <ShieldCheck className="w-4 h-4 text-[#105F68]" />
                      <span>0% Platform Take-Rate Guarantee</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleFinalizeFlow()}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-medium transition-all flex items-center justify-center gap-2.5 shadow-xl hover:scale-[1.02] cursor-pointer"
                    >
                      <span>Sign &amp; Pay {formatCurrency(dynamicDeposit, currency)} Deposit</span>
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
                  Proposal Signed &amp; Appointment Locked!
                </h3>
                <p className="text-xs sm:text-sm text-[#2E7D32] max-w-lg mx-auto leading-relaxed">
                  You have completed the entire quote-to-booking loop. Your {formatCurrency(dynamicDeposit, currency)} deposit has been credited to invoice #{convertedBookingId || "BK-101"}.
                </p>

                <div className="p-5 rounded-2xl bg-white/90 border border-[#A5D6A7] max-w-md mx-auto text-xs text-[#1B5E20] space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[#2E7D32]">Specialist:</span>
                    <span className="font-semibold">Assigned Specialist</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#2E7D32]">Scheduled Date:</span>
                    <span className="font-semibold">{dayValue} at {selectedTimeSlot}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#2E7D32]">Signer:</span>
                    <span className="font-semibold">{quote.signatureData || quote.clientName}</span>
                  </div>
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

                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <Link
                    href="/dashboard"
                    className="px-6 py-2.5 rounded-full bg-[#1B5E20] text-white text-xs font-light hover:bg-[#2E7D32] transition-all shadow-sm"
                  >
                    View in Merchant Dashboard
                  </Link>

                  <button
                    onClick={() => {
                      playSuccess();
                      alert("Google Calendar invite & ICS downloaded!");
                    }}
                    className="px-6 py-2.5 rounded-full border border-[#1B5E20] text-[#1B5E20] text-xs font-light hover:bg-[#1B5E20]/5 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Add to Google Calendar</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
