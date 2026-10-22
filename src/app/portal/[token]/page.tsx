"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  CreditCard, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  Download,
  AlertCircle,
  Star,
  ExternalLink
} from "lucide-react";
import { 
  getBookings, 
  getInvoices, 
  saveInvoices, 
  INITIAL_BOOKINGS,
  INITIAL_INVOICES,
  rescheduleBooking,
  payableBalanceCents,
  findBookingByToken,
  BookingRecord, 
  InvoiceRecord
} from "@/lib/platform-store";
import { addMinutes, durationMinutes } from "@/lib/booking-time";
import { useClientStore, useHydrated } from "@/lib/use-client-store";
import { submitCustomerReview, getReputationConfig } from "@/lib/reviews-store";
import { useAudio } from "@/components/AudioController";
import ProgressiveBlur from "@/components/ProgressiveBlur";
import { generateInvoicePDF } from "@/lib/invoice-pdf";

export default function ClientPortalPage() {
  const params = useParams();
  const token = (params?.token as string) || "";
  const { playClick, playSuccess } = useAudio();

  const hydrated = useHydrated();
  const { workspaceId: matchedWs } = findBookingByToken(token);
  const bookings = useClientStore(() => getBookings(matchedWs), () => INITIAL_BOOKINGS);
  const invoices = useClientStore(() => getInvoices(matchedWs), () => INITIAL_INVOICES);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState("2026-10-15T11:00");
  const [notification, setNotification] = useState<string | null>(null);
  // Review state
  const [reviewRating, setReviewRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [reviewText, setReviewText] = useState("");
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);

  const booking = useMemo(() => {
    return bookings.find((b) => b.rescheduleToken === token);
  }, [bookings, token]);

  const invoice = useMemo(() => {
    if (!booking) return undefined;
    return invoices.find((i) => i.bookingId === booking.id);
  }, [invoices, booking]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    playSuccess();

    const duration = durationMinutes(booking.startTime, booking.endTime) ?? 60;
    const startTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(newDate) ? `${newDate}:00` : newDate;
    const endTime = addMinutes(startTime, duration);
    if (!endTime) return;
    const { workspaceId: matchedWs } = findBookingByToken(token);
    const updated = rescheduleBooking(booking.id, startTime, endTime, matchedWs);
    if (!updated) {
      showToast("That time is not open. Pick another slot.");
      return;
    }
    setIsRescheduling(false);
    showToast("Appointment rescheduled successfully!");
  };

  const handlePayBalance = () => {
    if (!invoice) return;
    playSuccess();
    const { workspaceId: matchedWs } = findBookingByToken(token);
    const updated = invoices.map((inv) => {
      if (inv.id === invoice.id) {
        return { ...inv, status: "paid" as const, paidAt: new Date().toISOString(), balanceDueCents: 0 };
      }
      return inv;
    });
    saveInvoices(updated, matchedWs);
    showToast("Remaining balance paid in full! Receipt updated.");
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !reviewText.trim()) return;
    playSuccess();

    submitCustomerReview({
      bookingId: booking.id,
      clientName: booking.clientName,
      rating: reviewRating,
      serviceName: booking.serviceName,
      comment: reviewText,
      status: reviewRating >= 4 ? "google_pushed" : "private_feedback",
    });

    setHasSubmittedReview(true);
    showToast(
      reviewRating >= 4
        ? "Review received! Thank you for the high rating."
        : "Feedback received privately. Management notified."
    );
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#F6FAF9] flex items-center justify-center p-6 text-center font-['Kaleko_105',sans-serif]">
        <div className="w-8 h-8 rounded-full border-2 border-[#105F68] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#F6FAF9] flex items-center justify-center p-6 text-center font-['Kaleko_105',sans-serif]">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-[#105F68]/15 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#C8E6E2]/40 text-[#105F68] flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-light text-[#105F68]">Reservation Not Found</h2>
          <p className="text-xs text-[#3A9295] leading-relaxed">
            The booking link is invalid, expired, or has already been completed.
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

  const balanceDue = payableBalanceCents(booking, invoice) / 100;
  const isInvoicePaid = invoice?.status === "paid";

  return (
    <div className="min-h-screen bg-[#F6FAF9] text-[#103438] antialiased selection:bg-[#105F68] selection:text-white font-['Kaleko_105',sans-serif] flex flex-col">
      <ProgressiveBlur position="top" height="h-20" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#105F68]/10 px-4 sm:px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C8E6E2]/40 border border-[#9ED5D1]/60 flex items-center justify-center p-2">
              <Image src="/icon.svg" alt="Ovel" width={24} height={24} />
            </div>
            <div>
              <h1 className="text-base font-light text-[#105F68]">
                Client Self-Service Portal
              </h1>
              <p className="text-[11px] text-[#3A9295] font-light">
                Passwordless Access • Manage Bookings &amp; Invoices
              </p>
            </div>
          </div>

          <span className="text-xs px-3 py-1 rounded-full bg-[#105F68]/10 text-[#105F68]">
            {booking.clientName}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
        <div className="bg-white rounded-[2.5rem] border border-[#105F68]/15 shadow-xl p-6 sm:p-10 space-y-8">
          {/* Status Banner */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/5 pb-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#3A9295] font-light">
                RESERVATION #{booking.id.substring(3, 9).toUpperCase()}
              </span>
              <h2 className="text-2xl font-light text-[#105F68] tracking-tight mt-1">
                {booking.serviceName}
              </h2>
              <p className="text-xs text-[#3A9295] mt-1">
                Specialist: <b>{booking.staffName}</b>
              </p>
            </div>

            <span
              className={`text-[10px] px-3 py-1 rounded-full uppercase tracking-wider font-medium ${
                booking.status === "confirmed"
                  ? "bg-[#63C1BB]/20 text-[#105F68]"
                  : booking.status === "rescheduled"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              Status: {booking.status}
            </span>
          </div>

          {/* Time & Location Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-1 text-xs">
              <div className="flex items-center gap-2 text-[#105F68] font-medium">
                <Calendar className="w-4 h-4 text-[#3A9295]" />
                <span>Scheduled Time</span>
              </div>
              <p className="text-sm font-semibold text-[#105F68] mt-1">
                {booking.startTime.replace("T", " at ")}
              </p>
              <p className="text-[#3A9295]">Calendar sync confirmed</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-1 text-xs">
              <div className="flex items-center gap-2 text-[#105F68] font-medium">
                <CreditCard className="w-4 h-4 text-[#3A9295]" />
                <span>Financial Settlement</span>
              </div>
              <p className="text-sm font-semibold text-[#105F68] mt-1">
                Deposit Paid: ${(booking.depositPaidCents / 100).toFixed(2)}
              </p>
              <p className="text-[#3A9295]">
                {isInvoicePaid ? (
                  <span className="text-[#2E7D32] font-semibold">Fully Paid ($0.00 balance)</span>
                ) : (
                  <span>Balance Due: ${balanceDue.toFixed(2)}</span>
                )}
              </p>
            </div>
          </div>

          {/* Self-Service Actions */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs uppercase tracking-widest text-[#3A9295] font-light">
              Self-Service Actions
            </h3>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  playClick();
                  setIsRescheduling(!isRescheduling);
                }}
                className="px-5 py-2.5 rounded-full border border-[#105F68]/20 bg-white hover:bg-[#105F68]/5 text-xs text-[#105F68] font-light transition-all flex items-center gap-2 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#3A9295]" />
                <span>Reschedule Appointment</span>
              </button>

              {!isInvoicePaid && (
                <button
                  onClick={handlePayBalance}
                  className="px-5 py-2.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-light transition-all flex items-center gap-2 shadow-sm"
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#63C1BB]" />
                  <span>Settle Remaining Balance (${balanceDue.toFixed(2)})</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (!booking) return;
                  playSuccess();
                  try {
                    const targetInvoice: InvoiceRecord = invoice || {
                      id: `inv_${booking.id}`,
                      bookingId: booking.id,
                      invoiceNumber: `INV-${new Date().getFullYear()}-${booking.id.slice(-4).toUpperCase()}`,
                      clientName: booking.clientName,
                      clientEmail: booking.clientEmail,
                      itemsSummary: booking.serviceName,
                      subtotalCents: booking.totalPriceCents,
                      depositCreditedCents: booking.depositPaidCents,
                      taxCents: 0,
                      balanceDueCents: booking.totalPriceCents - booking.depositPaidCents,
                      status: isInvoicePaid ? "paid" : "sent",
                      createdAt: booking.createdAt,
                    };

                    generateInvoicePDF(targetInvoice, {
                      name: booking.serviceName || "Service Studio",
                      email: booking.clientEmail,
                    });
                    showToast(`Downloaded invoice PDF: ${targetInvoice.invoiceNumber}`);
                  } catch (err: unknown) {
                    showToast(`Error generating PDF: ${(err as Error)?.message || "Failed"}`);
                  }
                }}
                className="px-5 py-2.5 rounded-full border border-black/10 hover:bg-black/5 text-xs text-[#105F68] font-light transition-all flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-[#3A9295]" />
                <span>Download Invoice PDF</span>
              </button>
            </div>
          </div>

          {/* Reschedule Inline Picker */}
          {isRescheduling && (
            <form onSubmit={handleReschedule} className="p-6 rounded-3xl bg-[#C8E6E2]/20 border border-[#9ED5D1]/50 space-y-4 animate-fadeUp">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#105F68]">
                Select New Reschedule Slot
              </h4>
              <input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-white border border-black/10 text-xs text-[#105F68]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRescheduling(false)}
                  className="px-4 py-2 rounded-full text-xs text-[#3A9295]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all"
                >
                  Confirm New Slot
                </button>
              </div>
            </form>
          )}

          {/* Customer Review & Reputation Module */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#F6FAF9] to-white border border-[#105F68]/15 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#3A9295] font-light">
                  CUSTOMER EXPERIENCE &amp; REPUTATION
                </span>
                <h3 className="text-lg font-light text-[#105F68] tracking-tight mt-0.5">
                  How was your service with {booking.staffName}?
                </h3>
              </div>

              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#63C1BB]/20 text-[#105F68] font-medium">
                Verified Booking Feedback
              </span>
            </div>

            {hasSubmittedReview ? (
              <div className="p-6 rounded-2xl bg-[#E8F5E9] border border-[#A5D6A7] text-center space-y-3">
                <div className="flex justify-center text-[#F59E0B]">
                  {[...Array(reviewRating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <h4 className="text-sm font-medium text-[#1B5E20]">
                  Thank you for rating your appointment!
                </h4>
                <p className="text-xs text-[#2E7D32] max-w-md mx-auto">
                  {reviewRating >= 4
                    ? "Your high rating helps small independent specialists thrive. If you have 10 seconds, please consider sharing your feedback on our official Google Maps profile!"
                    : "Your constructive feedback has been routed privately to management for immediate review."}
                </p>
                {reviewRating >= 4 && (
                  <div className="pt-2 flex justify-center">
                    <a
                      href={getReputationConfig().googleMapsReviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2.5 rounded-full bg-[#1B5E20] hover:bg-[#2E7D32] text-white text-xs font-light transition-all flex items-center gap-2 shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#A5D6A7]" />
                      <span>Post Review to Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-[#3A9295] block mb-2">
                    Tap to Rate Your Experience:
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          playClick();
                          setReviewRating(star as 1 | 2 | 3 | 4 | 5);
                        }}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= reviewRating
                              ? "fill-[#F59E0B] text-[#F59E0B]"
                              : "text-black/20"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-[#105F68] font-medium ml-2">
                      {reviewRating === 5
                        ? "⭐⭐⭐⭐⭐ Exceptional!"
                        : reviewRating === 4
                        ? "⭐⭐⭐⭐ Great Service"
                        : reviewRating === 3
                        ? "⭐⭐⭐ Neutral"
                        : "Needs Improvement"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#3A9295] block mb-1">
                    Your Review / Comments:
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Tell us what you liked about the service, results, or specialist care..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-black/10 bg-white text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-xs text-[#3A9295]">
                    <ShieldCheck className="w-4 h-4 text-[#105F68]" />
                    <span>Protected by Ovel 0% Marketplace Zero-Interference</span>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-light transition-all flex items-center gap-2 shadow-sm"
                  >
                    <span>Submit Verified Review</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#63C1BB]" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#105F68] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs border border-[#63C1BB]/30 animate-fadeUp">
          <CheckCircle2 className="w-4 h-4 text-[#63C1BB]" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}
