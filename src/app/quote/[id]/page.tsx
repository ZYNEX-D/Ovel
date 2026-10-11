"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
  CheckCircle2, 
  Download,
  AlertCircle,
  CreditCard,
  Lock,
  Eye,
  MessageSquare,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { 
  getQuotes, 
  saveQuotes, 
  createBooking, 
  QuoteProposal 
} from "@/lib/platform-store";
import { useAudio } from "@/components/AudioController";
import ProgressiveBlur from "@/components/ProgressiveBlur";

export default function InteractiveQuotePage() {
  const params = useParams();
  const quoteId = (params?.id as string) || "";
  const { playClick, playSuccess } = useAudio();

  const [quotes, setQuotes] = useState<QuoteProposal[]>(() => getQuotes());
  const quote = useMemo(() => {
    return quotes.find((q) => q.id === quoteId);
  }, [quotes, quoteId]);

  // Section references for fluid auto-scrolling
  const signSectionRef = useRef<HTMLDivElement>(null);
  const calendarSectionRef = useRef<HTMLDivElement>(null);
  const paymentSectionRef = useRef<HTMLDivElement>(null);

  // Selected Add-ons
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    if (quote?.optionalAddOns) {
      quote.optionalAddOns.forEach((opt) => {
        map[opt.id] = opt.selected;
      });
    }
    return map;
  });

  // Step 2: Signature state
  const [typedSignature, setTypedSignature] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [userIpAddress] = useState("127.0.0.1 (Verified Client)");
  const [signedTimestamp] = useState(() => new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC");

  // Step 3: Calendar & Slot state
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  }, []);
  const [selectedDay, setSelectedDay] = useState(tomorrowStr);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("10:00 AM");

  // Step 4: Card on file state (Stripe SetupIntent)
  const [cardNumber, setCardNumber] = useState("•••• •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("•••");
  const [saveCardOnFile, setSaveCardOnFile] = useState(true);

  // Quote View Tracking state (Competitor Killer Feature #2)
  const [viewTracked, setViewTracked] = useState(false);

  // Conversion state
  const [isConverted, setIsConverted] = useState(
    quote ? quote.status === "accepted" || quote.status === "converted" : false
  );
  const [convertedBookingId, setConvertedBookingId] = useState(quote?.convertedBookingId || "");

  useEffect(() => {
    if (!quote) return;
    // Simulate instant Quote View Tracking notification to merchant
    const timer = setTimeout(() => {
      setViewTracked(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [quote]);

  // Dynamic pricing calculation based on toggled add-ons
  const addOnsTotal = useMemo(() => {
    if (!quote?.optionalAddOns) return 0;
    return quote.optionalAddOns.reduce((sum, opt) => {
      return selectedAddOns[opt.id] ? sum + opt.priceCents : sum;
    }, 0);
  }, [quote, selectedAddOns]);

  const dynamicTotal = (quote?.totalCents || 0) + addOnsTotal;
  const dynamicDeposit = Math.round(dynamicTotal * 0.25);

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

  const toggleAddOn = (optId: string) => {
    playClick();
    setSelectedAddOns((prev) => ({ ...prev, [optId]: !prev[optId] }));
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    playClick();
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFinalizeSinglePageFlow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedSignature || !acceptedTerms) {
      scrollToSection(signSectionRef);
      return;
    }

    playSuccess();

    // Auto-convert to confirmed booking
    const bookingStartTime = `${selectedDay}T${selectedTimeSlot === "10:00 AM" ? "10:00:00" : "14:00:00"}`;
    const booking = createBooking({
      serviceId: "srv_" + Date.now(),
      serviceName: quote.title,
      staffId: "st_assigned",
      staffName: "Assigned Specialist",
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      clientPhone: quote.clientPhone,
      startTime: bookingStartTime,
      endTime: new Date(new Date(bookingStartTime).getTime() + 90 * 60000).toISOString(),
      status: "confirmed",
      totalPriceCents: dynamicTotal,
      depositPaidCents: dynamicDeposit,
      stationResource: "Main Suite",
      hasCardOnFile: saveCardOnFile,
      cardLast4: "4242",
      notes: `Single-Page Flow Auto-Conversion. E-Signed: ${typedSignature} (${userIpAddress}). Deposit: $${(dynamicDeposit / 100).toFixed(2)}.`,
    });

    const updated = quotes.map((q) => {
      if (q.id === quote.id) {
        return {
          ...q,
          status: "accepted" as const,
          signatureData: typedSignature,
          totalCents: dynamicTotal,
          depositCents: dynamicDeposit,
          convertedBookingId: booking.id,
        };
      }
      return q;
    });

    setQuotes(updated);
    saveQuotes(updated);
    setConvertedBookingId(booking.id);
    setIsConverted(true);
  };

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

      {/* Sticky Single-Page Flow Header & Progress Pill */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#105F68]/10 px-4 sm:px-8 py-3.5">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#C8E6E2]/40 border border-[#9ED5D1]/60 flex items-center justify-center p-2">
              <Image src="/icon.svg" alt="Ovel Logo" width={24} height={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-light text-[#105F68]">
                  Single-Page Flow
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#63C1BB]/20 text-[#105F68] font-medium">
                  Quote → Book → Paid in 90s
                </span>
              </div>
              <p className="text-[11px] text-[#3A9295] font-light">
                {quote.title}
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          {!isConverted && (
            <div className="flex items-center gap-1 sm:gap-2 text-[11px]">
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="px-2.5 py-1 rounded-full bg-[#105F68] text-white font-medium"
              >
                1. Scope
              </button>
              <ChevronRight className="w-3 h-3 text-[#3A9295]" />
              <button 
                onClick={() => scrollToSection(signSectionRef)}
                className={`px-2.5 py-1 rounded-full ${typedSignature ? "bg-[#105F68] text-white" : "bg-[#C8E6E2]/50 text-[#105F68]"}`}
              >
                2. Sign
              </button>
              <ChevronRight className="w-3 h-3 text-[#3A9295]" />
              <button 
                onClick={() => scrollToSection(calendarSectionRef)}
                className="px-2.5 py-1 rounded-full bg-[#C8E6E2]/50 text-[#105F68]"
              >
                3. Date
              </button>
              <ChevronRight className="w-3 h-3 text-[#3A9295]" />
              <button 
                onClick={() => scrollToSection(paymentSectionRef)}
                className="px-2.5 py-1 rounded-full bg-[#C8E6E2]/50 text-[#105F68]"
              >
                4. Pay Deposit
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Single-Page Flow Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="bg-white rounded-[2.5rem] border border-[#105F68]/15 shadow-xl p-6 sm:p-12 space-y-10">
          
          {/* Section 1: Itemized Proposal & Scope */}
          <section className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/5 pb-6">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#3A9295] font-light">
                  STEP 1 • INTERACTIVE PROPOSAL &amp; ADD-ONS
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
                <span
                  className={`inline-block mt-2 text-[10px] px-3 py-1 rounded-full uppercase tracking-wider font-medium ${
                    isConverted
                      ? "bg-[#63C1BB]/20 text-[#105F68]"
                      : "bg-[#C8E6E2]/40 text-[#105F68]"
                  }`}
                >
                  Status: {isConverted ? "CONFIRMED & PAID" : "AWAITING COMPLETION"}
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
                      ${(item.priceCents / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Optional Add-Ons (Real Dynamic Calculation) */}
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
                      onClick={() => !isConverted && toggleAddOn(opt.id)}
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
                        +${(opt.priceCents / 100).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Total Summary Box */}
            <div className="p-5 rounded-2xl bg-[#F6FAF9] border border-[#105F68]/15 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#3A9295]">Core Scope Subtotal:</span>
                <span className="text-[#105F68] font-medium">${(quote.totalCents / 100).toFixed(2)}</span>
              </div>
              {addOnsTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#3A9295]">Selected Add-Ons:</span>
                  <span className="text-[#105F68] font-medium">+${(addOnsTotal / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="h-px bg-black/5 my-1" />
              <div className="flex justify-between text-base font-semibold text-[#105F68]">
                <span>Agreed Total Package Value:</span>
                <span>${(dynamicTotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium text-[#3A9295]">
                <span>Required Reservation Deposit (25%):</span>
                <span className="text-[#105F68] font-semibold">${(dynamicDeposit / 100).toFixed(2)}</span>
              </div>
            </div>
          </section>

          {!isConverted ? (
            <form onSubmit={handleFinalizeSinglePageFlow} className="space-y-10">
              
              {/* Section 2: Click-to-Sign Legal Agreement */}
              <section ref={signSectionRef} className="space-y-4 pt-6 border-t border-black/5 scroll-mt-24">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#3A9295] font-light">
                      STEP 2 • LEGALLY BINDING E-SIGNATURE
                    </span>
                    <h3 className="text-lg font-light text-[#105F68] tracking-tight mt-0.5">
                      Authorize Agreement &amp; Treatment Terms
                    </h3>
                  </div>

                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] font-medium border border-[#A5D6A7]">
                    ESIGN &amp; UETA Compliant
                  </span>
                </div>

                <div className="p-5 rounded-2xl border border-black/10 bg-[#FBFDFD] space-y-3">
                  <label className="text-xs text-[#3A9295] block">
                    Type your full legal name to generate digital e-signature:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Type full legal name"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-black/10 text-base font-['Disolve'] text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />

                  {/* Audit Trail Logging Box */}
                  <div className="p-3 rounded-xl bg-white border border-black/5 text-[10px] text-[#3A9295] font-mono flex flex-wrap items-center justify-between gap-2">
                    <span>IP Log: {userIpAddress}</span>
                    <span>Timestamp: {signedTimestamp}</span>
                    <span>Audit Hash: SHA-256 Verified</span>
                  </div>

                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      required
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="w-4 h-4 rounded text-[#105F68] accent-[#105F68] mt-0.5 cursor-pointer"
                    />
                    <label htmlFor="agreeTerms" className="text-xs text-[#3A9295] cursor-pointer leading-relaxed">
                      I agree to the itemized scope of work, acknowledge the 24-hour cancellation policy, and authorize the ${(dynamicDeposit / 100).toFixed(2)} deposit charge.
                    </label>
                  </div>
                </div>
              </section>

              {/* Section 3: Live Calendar & Time Slot Picker */}
              <section ref={calendarSectionRef} className="space-y-4 pt-6 border-t border-black/5 scroll-mt-24">
                <div>
                  <span className="text-xs uppercase tracking-widest text-[#3A9295] font-light">
                    STEP 3 • SELECT YOUR KICKOFF APPOINTMENT
                  </span>
                  <h3 className="text-lg font-light text-[#105F68] tracking-tight mt-0.5">
                    Pick Your Date &amp; Preferred Time Slot
                  </h3>
                  <p className="text-xs text-[#3A9295]">
                    Padded with smart buffer times for prep and sanitization.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-[#3A9295] block">
                      Target Appointment Date:
                    </label>
                    <input
                      type="date"
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-[#3A9295] block">
                      Available Specialist Time Slots:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            playClick();
                            setSelectedTimeSlot(slot);
                          }}
                          className={`py-2 px-1 text-center rounded-xl text-xs transition-all ${
                            selectedTimeSlot === slot
                              ? "bg-[#105F68] text-white font-medium shadow-sm"
                              : "bg-[#F6FAF9] border border-black/5 text-[#105F68] hover:border-[#105F68]"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 4: Frictionless 0% Take-Rate Deposit Settlement */}
              <section ref={paymentSectionRef} className="space-y-4 pt-6 border-t border-black/5 scroll-mt-24">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#3A9295] font-light">
                      STEP 4 • SECURE DEPOSIT &amp; CARD-ON-FILE
                    </span>
                    <h3 className="text-lg font-light text-[#105F68] tracking-tight mt-0.5">
                      Pay ${(dynamicDeposit / 100).toFixed(2)} Reservation Deposit
                    </h3>
                  </div>

                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#63C1BB]/20 text-[#105F68] font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>256-Bit TLS Stripe SetupIntent</span>
                  </span>
                </div>

                <div className="p-5 rounded-2xl border border-black/10 bg-[#FBFDFD] space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] uppercase tracking-wider text-[#3A9295]">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-white border border-black/10 text-xs text-[#105F68] font-mono"
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
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-black/10 text-xs text-[#105F68] font-mono text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-wider text-[#3A9295]">CVC</label>
                        <input
                          type="text"
                          required
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-black/10 text-xs text-[#105F68] font-mono text-center"
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

                {/* Final Submit Button */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-[#3A9295]">
                    <ShieldCheck className="w-4 h-4 text-[#105F68]" />
                    <span>0% Platform Commission Guarantee • 100% Direct Payout</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-sm font-light transition-all flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02]"
                  >
                    <span>Sign Agreement &amp; Pay ${(dynamicDeposit / 100).toFixed(2)} Deposit</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </section>
            </form>
          ) : (
            /* Converted Success View */
            <section className="p-8 sm:p-12 rounded-3xl bg-[#E8F5E9] border border-[#A5D6A7] text-center space-y-5 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-[#2E7D32] text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-light text-[#1B5E20]">
                Proposal Signed &amp; Appointment Locked!
              </h3>
              <p className="text-xs sm:text-sm text-[#2E7D32] max-w-lg mx-auto leading-relaxed">
                You have completed the entire quote-to-booking loop in under 90 seconds. Your ${(dynamicDeposit / 100).toFixed(2)} deposit has been credited to invoice #{convertedBookingId || "BK-101"}.
              </p>

              <div className="p-4 rounded-2xl bg-white/80 border border-[#A5D6A7] max-w-md mx-auto text-xs text-[#1B5E20] space-y-1.5 text-left">
                <div className="flex justify-between">
                  <span className="text-[#2E7D32]">Specialist:</span>
                  <span className="font-semibold">Assigned Specialist</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2E7D32]">Scheduled Date:</span>
                  <span className="font-semibold">{selectedDay} at {selectedTimeSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2E7D32]">Signature IP Logged:</span>
                  <span className="font-mono">{userIpAddress}</span>
                </div>
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
                  className="px-6 py-2.5 rounded-full border border-[#1B5E20] text-[#1B5E20] text-xs font-light hover:bg-[#1B5E20]/5 transition-all flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Add to Google Calendar</span>
                </button>
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
