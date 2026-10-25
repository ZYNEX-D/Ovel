"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  User, 
  Phone, 
  Lock, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Star, 
  Download, 
  LogOut, 
  ShoppingBag, 
  ChevronRight, 
  Sparkles, 
  ArrowRight,
  RotateCcw,
  AlertCircle
} from "lucide-react";
import { 
  getActiveClientSession, 
  clearActiveClientSession, 
  loginClientWithPhone, 
  getClientBookings, 
  ClientAccount 
} from "@/lib/client-auth";
import { submitCustomerReview } from "@/lib/reviews-store";
import Toast from "@/components/arc/toast/toast";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";
import { useAudio } from "@/components/AudioController";
import { PRIMARY_DOMAIN } from "@/lib/domain";

export default function GeneralClientPortalPage() {
  const { playClick, playSuccess } = useAudio();
  const [session, setSession] = useState<ClientAccount | null>(() => getActiveClientSession());

  // Login form state (if unauthenticated)
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Tab & Notification state
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [notification, setNotification] = useState<string | null>(null);

  // Rating modal state
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [reviewComment, setReviewComment] = useState("");

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const bookings = useMemo(() => {
    if (!session?.phone) return [];
    return getClientBookings(session.phone);
  }, [session]);

  const activeBookings = useMemo(() => {
    return bookings.filter((b) => b.status !== "completed" && b.status !== "cancelled");
  }, [bookings]);

  const pastBookings = useMemo(() => {
    return bookings.filter((b) => b.status === "completed" || b.status === "cancelled");
  }, [bookings]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    playClick();

    const result = loginClientWithPhone(loginPhone, loginPassword);
    if (result.success && result.account) {
      playSuccess();
      setSession(result.account);
      showToast(`Welcome back, ${result.account.fullName}!`);
    } else {
      setLoginError(result.error || "Login failed. Please check your credentials.");
    }
  };

  const handleLogout = () => {
    playClick();
    clearActiveClientSession();
    setSession(null);
    showToast("Signed out of client portal.");
  };

  const handleSaveReview = () => {
    if (!reviewBookingId) return;
    playSuccess();
    submitCustomerReview({
      bookingId: reviewBookingId,
      clientName: session?.fullName || "Verified Client",
      serviceName: "Client Session Experience",
      rating: (reviewRating >= 1 && reviewRating <= 5 ? reviewRating : 5) as 1 | 2 | 3 | 4 | 5,
      comment: reviewComment || "Excellent and seamless booking experience!",
      status: "published",
    });
    setReviewBookingId(null);
    setReviewComment("");
    showToast("Thank you for your rating! Your review has been published.");
  };

  return (
    <div className="min-h-screen bg-[#F6FAF9] text-[#103438] font-sans antialiased selection:bg-[#C8E6E2]">
      {/* Arc UI Toast Notification */}
      <div className="fixed bottom-6 right-6 z-50">
        <Toast
          open={Boolean(notification)}
          onOpenChange={(open) => { if (!open) setNotification(null); }}
          title={notification || ""}
          duration={3500}
        />
      </div>

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-black/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-['Disolve'] text-2xl text-[#105F68]">Ovel</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#105F68]/10 text-[#105F68] font-semibold">
              Client Portal
            </span>
          </Link>

          {session ? (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-semibold text-[#105F68] block">
                  {session.fullName}
                </span>
                <span className="text-[11px] text-[#3A9295] font-mono">
                  {session.phone}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-black/5 text-[#3A9295] hover:text-red-600 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-[#3A9295]">
              Direct Client Access • {PRIMARY_DOMAIN}
            </span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {!session ? (
          /* Unauthenticated Login Screen */
          <div className="max-w-md mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-black/10 shadow-xl space-y-6">
            <div className="space-y-1 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#C8E6E2]/40 text-[#105F68] flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-light text-[#105F68] tracking-tight">
                Client Portal Sign In
              </h2>
              <p className="text-xs text-[#3A9295]">
                Enter your mobile phone number and password to track your appointments and orders.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#3A9295]">
                  Mobile Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="+94 77 123 4567"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] font-mono focus:outline-none focus:border-[#105F68] focus:bg-white transition-all"
                  />
                  <Phone className="w-4 h-4 text-[#3A9295] absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#3A9295]">
                  Your Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68] focus:bg-white transition-all"
                  />
                  <Lock className="w-4 h-4 text-[#3A9295] absolute left-3.5 top-3.5" />
                </div>
              </div>

              {loginError && (
                <p className="text-xs text-red-600 font-medium">{loginError}</p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-medium tracking-tight shadow-md hover:scale-[1.01] transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>Access My Orders &amp; Bookings</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-4 border-t border-black/5 text-center text-[11px] text-[#3A9295]">
              Never booked before? Open any merchant’s Ovelink page to create an account while booking!
            </div>
          </div>
        ) : (
          /* Authenticated Client Dashboard */
          <div className="space-y-8">
            {/* Header Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-black/5 shadow-sm">
              <div className="space-y-1">
                <span className="text-xs uppercase font-light tracking-widest text-[#3A9295]">
                  Client Dashboard
                </span>
                <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
                  Welcome back, {session.fullName}!
                </h1>
                <p className="text-xs text-[#3A9295]">
                  Live status, appointment times, reschedule controls, and verified billing receipts.
                </p>
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-2 bg-[#F6FAF9] p-1.5 rounded-2xl border border-black/5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("active")}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeTab === "active"
                      ? "bg-white text-[#105F68] shadow-sm"
                      : "text-[#3A9295] hover:text-[#105F68]"
                  }`}
                >
                  Active ({activeBookings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeTab === "history"
                      ? "bg-white text-[#105F68] shadow-sm"
                      : "text-[#3A9295] hover:text-[#105F68]"
                  }`}
                >
                  Past History ({pastBookings.length})
                </button>
              </div>
            </div>

            {/* Bookings / Orders List */}
            {activeTab === "active" && (
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-widest text-[#3A9295] font-light">
                  Current Appointments &amp; Open Orders
                </h3>

                {activeBookings.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border border-black/5 space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto opacity-40" />
                    <h4 className="text-lg font-light text-[#105F68]">No upcoming appointments</h4>
                    <p className="text-xs text-[#3A9295] max-w-sm mx-auto">
                      You are all caught up! When you book or order through any Ovel storefront, it will appear here in real-time.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {activeBookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-6 rounded-3xl bg-white border border-black/5 shadow-sm hover:border-[#105F68]/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {b.status === "confirmed" ? "Confirmed Slot" : b.status}
                            </span>
                            <span className="text-xs text-[#3A9295] font-mono">
                              ID: #{b.id.slice(-6)}
                            </span>
                          </div>

                          <h4 className="text-xl font-light text-[#105F68]">
                            {b.serviceName}
                          </h4>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-[#3A9295]">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#105F68]" />
                              <span>{new Date(b.startTime).toLocaleDateString()}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[#105F68]" />
                              <span>{new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-[#105F68]" />
                              <span>{b.staffName}</span>
                            </span>
                          </div>
                        </div>

                        {/* Financial summary & Actions */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0">
                          <div className="text-left sm:text-right sm:pr-4">
                            <span className="text-xs text-[#3A9295] block">Deposit Paid:</span>
                            <span className="text-base font-bold text-emerald-700">
                              {formatCurrency(b.depositPaidCents, DEFAULT_CURRENCY)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/portal/${b.rescheduleToken}`}
                              className="px-3.5 py-2 rounded-xl bg-[#F6FAF9] hover:bg-[#105F68]/10 text-[#105F68] text-xs font-medium border border-black/10 transition-all flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reschedule</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() => {
                                setReviewBookingId(b.id);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                              <span>Rate Service</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Past History Tab */}
            {activeTab === "history" && (
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-widest text-[#3A9295] font-light">
                  Completed Services &amp; Past Orders
                </h3>

                {pastBookings.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border border-black/5 space-y-2">
                    <p className="text-xs text-[#3A9295]">No past orders recorded yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {pastBookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-5 rounded-2xl bg-white border border-black/5 flex items-center justify-between gap-4 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-[#105F68] block">{b.serviceName}</span>
                          <span className="text-[#3A9295]">{new Date(b.startTime).toLocaleDateString()} with {b.staffName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[#105F68] font-bold">
                            {formatCurrency(b.totalPriceCents, DEFAULT_CURRENCY)}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 uppercase">
                            {b.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal: Client Rating & Review Submission */}
      {reviewBookingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl border border-black/10">
            <div className="space-y-1 text-center">
              <span className="text-xs uppercase font-light tracking-wider text-[#3A9295]">
                Verified Feedback
              </span>
              <h3 className="text-xl font-light text-[#105F68] tracking-tight">
                Rate your service experience
              </h3>
              <p className="text-xs text-[#3A9295]">
                Your feedback appears directly on the merchant’s storefront and builds their verified reputation.
              </p>
            </div>

            {/* 5-Star interactive selector */}
            <div className="flex justify-center items-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    playClick();
                    setReviewRating(star as 1 | 2 | 3 | 4 | 5);
                  }}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= reviewRating
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-200 fill-slate-100"
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#105F68]">
                Your Review or Comments
              </label>
              <textarea
                rows={3}
                placeholder="How was the appointment or delivery? What did you like most?"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReviewBookingId(null)}
                className="px-4 py-2 rounded-full border border-black/10 text-xs text-[#3A9295] hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReview}
                className="px-6 py-2 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-medium shadow-md"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
