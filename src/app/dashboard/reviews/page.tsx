"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  Star, 
  Sparkles, 
  MessageSquare, 
  Check, 
  ExternalLink, 
  TrendingUp, 
  ShieldCheck, 
  Send, 
  Filter, 
  RefreshCw,
  ThumbsUp,
  AlertTriangle,
  Camera,
  Share2
} from "lucide-react";
import { 
  getReviews, 
  saveReviews, 
  getReputationConfig, 
  saveReputationConfig, 
  replyToCustomerReview, 
  INITIAL_REVIEWS,
  DEFAULT_REPUTATION_CONFIG
} from "@/lib/reviews-store";
import { useClientStore, useDraftStore } from "@/lib/use-client-store";
import { useAudio } from "@/components/AudioController";
import { useAuth } from "@/lib/auth-context";

export default function DashboardReviewsPage() {
  const { profile, isLoading } = useAuth();
  const { playClick, playSuccess } = useAudio();
  const wsId = profile?.organizationId;
  const reviews = useClientStore(() => getReviews(wsId), () => INITIAL_REVIEWS);
  const storedConfig = useClientStore(() => getReputationConfig(wsId), () => DEFAULT_REPUTATION_CONFIG);
  const [config, setConfig] = useDraftStore(storedConfig);
  const [activeFilter, setActiveFilter] = useState<"all" | "5star" | "critical" | "photos">("all");
  
  // Reply drafting
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [activeReplyingId, setActiveReplyingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Metrics calculation
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : "—";
  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
  const googlePushedCount = reviews.filter((r) => r.status === "google_pushed").length;

  const filteredReviews = reviews.filter((r) => {
    if (activeFilter === "5star") return r.rating === 5;
    if (activeFilter === "critical") return r.rating <= 3;
    if (activeFilter === "photos") return !!r.photos && r.photos.length > 0;
    return true;
  });

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    playSuccess();
    saveReputationConfig(config, wsId);
    showToast("Google Maps review funnel settings saved!");
  };

  const handlePostReply = (reviewId: string) => {
    const text = replyTextMap[reviewId]?.trim();
    if (!text) return;
    playSuccess();
    replyToCustomerReview(reviewId, text, wsId);
    setActiveReplyingId(null);
    setReplyTextMap((prev) => ({ ...prev, [reviewId]: "" }));
    showToast("Merchant response published and emailed to customer!");
  };

  const handleSimulateAutomatedNudge = () => {
    playSuccess();
    showToast("Simulated WhatsApp Nudge Dispatched: 'Hi Chloe! Hope you loved your Hydrafacial. Tap here to rate us (takes 10s).' -> 5-Star loop active!");
  };

  const handleSimulateRebookingNudge = (clientName: string) => {
    playSuccess();
    showToast(`WhatsApp 4-Week Rebooking Nudge sent to ${clientName}: 'It's been a month since your last glow session. Tap to lock your slot!'`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#105F68] text-white text-xs shadow-xl flex items-center gap-2 border border-[#63C1BB]/30 animate-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-[#63C1BB]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
              Customer Reviews &amp; Reputation Engine
            </h1>
            <span className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#63C1BB]/20 text-[#105F68] font-medium border border-[#63C1BB]/30">
              Unfair Moat #4
            </span>
          </div>
          <p className="text-xs text-[#3A9295] mt-1">
            Automated Google Maps review redirection loop + private feedback shielding + 30-day WhatsApp rebooking engine.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateAutomatedNudge}
            className="px-4 py-2 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-light transition-all shadow-sm flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#63C1BB]" />
            <span>Test 2h Post-Booking Review Nudge</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-[#105F68]/10 shadow-sm flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-[#3A9295]">Reputation Score</span>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-light text-[#105F68]">{avgRating}</h3>
            <div className="flex text-[#F59E0B]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
          </div>
          <p className="text-[11px] text-[#3A9295] mt-1">{totalReviews} Verified Client Ratings</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#105F68]/10 shadow-sm flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-[#3A9295]">Google Maps Funnel</span>
          <div className="mt-2">
            <h3 className="text-3xl font-light text-[#105F68]">{googlePushedCount}</h3>
            <p className="text-[11px] text-[#2E7D32] font-medium mt-1">
              {Math.round((googlePushedCount / (totalReviews || 1)) * 100)}% Conversion to Google Maps
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#105F68]/10 shadow-sm flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-[#3A9295]">5-Star Share</span>
          <div className="mt-2">
            <h3 className="text-3xl font-light text-[#105F68]">
              {Math.round((fiveStarCount / (totalReviews || 1)) * 100)}%
            </h3>
            <p className="text-[11px] text-[#3A9295] mt-1">Flawless Social Proof</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#105F68] text-white border border-[#105F68] shadow-sm flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-[#C8E6E2]">30-Day Rebooking Loop</span>
          <div className="mt-2">
            <h3 className="text-3xl font-light text-white">42%</h3>
            <p className="text-[11px] text-[#C8E6E2] mt-1">Automated WhatsApp Repeat Bookings</p>
          </div>
        </div>
      </div>

      {/* Google Maps Review Funnel Configuration */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-white to-[#F6FAF9] border border-[#105F68]/15 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#63C1BB]/20 flex items-center justify-center text-[#105F68]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[#105F68]">
                Google Maps Review Redirection Funnel
              </h2>
              <p className="text-[11px] text-[#3A9295]">
                Directs happy clients (4★ &amp; 5★) straight to Google Maps while capturing constructive notes privately.
              </p>
            </div>
          </div>

          <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] font-medium border border-[#A5D6A7]">
            Active Funnel Routing
          </span>
        </div>

        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] uppercase tracking-wider text-[#3A9295]">
              Your Google Business Profile Review URL
            </label>
            <input
              type="url"
              required
              value={config.googleMapsReviewUrl}
              onChange={(e) => setConfig({ ...config, googleMapsReviewUrl: e.target.value })}
              placeholder="https://g.page/r/your-business/review"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#105F68] text-white text-xs hover:bg-[#0D4F57] transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5 text-[#63C1BB]" />
              <span>Save Funnel Settings</span>
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] text-[#3A9295]">
          <div className="p-3 rounded-2xl bg-white border border-black/5 flex items-center gap-2">
            <ThumbsUp className="w-4 h-4 text-[#2E7D32] shrink-0" />
            <span><b>4★ &amp; 5★ Ratings:</b> Auto-prompts client to push review to Google Maps with 1 click.</span>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-black/5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
            <span><b>1★ to 3★ Ratings:</b> Routed privately to owner to prevent negative public rankings.</span>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-black/5 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#105F68] shrink-0" />
            <span><b>4-Week Nudge:</b> WhatsApp ping fires 28 days later to rebook before slots fill up.</span>
          </div>
        </div>
      </div>

      {/* Reviews Feed Panel */}
      <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-light text-[#105F68] tracking-tight">
              Verified Client Feedback Stream
            </h3>
            <p className="text-xs text-[#3A9295]">
              Real reviews submitted via Client Portal or automated WhatsApp loop.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[#F6FAF9] border border-black/5">
            {[
              { id: "all", label: "All Reviews" },
              { id: "5star", label: "5 Stars" },
              { id: "photos", label: "With Photos" },
              { id: "critical", label: "Needs Follow-up" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  playClick();
                  setActiveFilter(tab.id as "all" | "5star" | "critical" | "photos");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
                  activeFilter === tab.id
                    ? "bg-[#105F68] text-white shadow-sm font-medium"
                    : "text-[#3A9295] hover:text-[#105F68]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews Cards List */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#3A9295]">
              No reviews matching this filter.
            </div>
          ) : (
            filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 sm:p-6 rounded-2xl border border-black/5 bg-[#FBFDFD] hover:border-[#105F68]/20 transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#C8E6E2] text-[#105F68] font-semibold text-xs flex items-center justify-center">
                      {rev.clientAvatar || rev.clientName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#105F68]">{rev.clientName}</span>
                        {rev.verifiedBooking && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#63C1BB]/20 text-[#105F68] font-medium flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-[#105F68]" />
                            <span>Verified Booking</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#3A9295]">{rev.serviceName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Stars */}
                    <div className="flex text-[#F59E0B]">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rev.rating ? "fill-[#F59E0B]" : "text-black/15"
                          }`}
                        />
                      ))}
                    </div>

                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                        rev.status === "google_pushed"
                          ? "bg-[#E8F5E9] text-[#2E7D32]"
                          : "bg-[#C8E6E2]/40 text-[#105F68]"
                      }`}
                    >
                      {rev.status === "google_pushed" ? "Pushed to Google Maps" : "Internal Portal"}
                    </span>
                  </div>
                </div>

                {/* Comment body */}
                <p className="text-xs text-[#103438] leading-relaxed">
                  &ldquo;{rev.comment}&rdquo;
                </p>

                {/* Photo Attachments */}
                {rev.photos && rev.photos.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    {rev.photos.map((photo, pIdx) => (
                      <div
                        key={pIdx}
                        className="relative w-16 h-16 rounded-xl overflow-hidden border border-black/10 group cursor-pointer"
                      >
                        <Image
                          src={photo}
                          alt="Customer review photo"
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Existing Merchant Reply */}
                {rev.merchantReply && (
                  <div className="p-3.5 rounded-xl bg-white border border-[#105F68]/15 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-[#3A9295]">
                      <span className="font-medium text-[#105F68]">Your Official Response:</span>
                      <span>{rev.merchantReplyAt ? rev.merchantReplyAt.substring(0, 10) : "Recently"}</span>
                    </div>
                    <p className="text-xs text-[#105F68]/90 font-light">{rev.merchantReply}</p>
                  </div>
                )}

                {/* Merchant Reply Actions & 4-Week Rebooking Trigger */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/5 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        playClick();
                        setActiveReplyingId(activeReplyingId === rev.id ? null : rev.id);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-black/10 hover:border-[#105F68] text-[11px] text-[#105F68] transition-all flex items-center gap-1.5 bg-white"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>{rev.merchantReply ? "Edit Response" : "Reply Publicly"}</span>
                    </button>

                    <button
                      onClick={() => handleSimulateRebookingNudge(rev.clientName)}
                      className="px-3 py-1.5 rounded-lg bg-[#63C1BB]/20 hover:bg-[#63C1BB]/30 text-[11px] text-[#105F68] transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Dispatch 4-Week Rebooking Nudge</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-[#3A9295]">
                    Received {rev.createdAt.substring(0, 10)}
                  </span>
                </div>

                {/* Inline Reply Form */}
                {activeReplyingId === rev.id && (
                  <div className="pt-2 space-y-2 animate-in fade-in">
                    <textarea
                      rows={2}
                      placeholder={`Draft reply to ${rev.clientName}...`}
                      value={replyTextMap[rev.id] || ""}
                      onChange={(e) =>
                        setReplyTextMap({ ...replyTextMap, [rev.id]: e.target.value })
                      }
                      className="w-full p-3 rounded-xl border border-[#105F68]/20 bg-white text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setActiveReplyingId(null)}
                        className="px-3 py-1.5 rounded-lg text-[11px] text-[#3A9295] hover:text-[#105F68]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handlePostReply(rev.id)}
                        className="px-4 py-1.5 rounded-lg bg-[#105F68] text-white text-[11px] hover:bg-[#0D4F57] transition-all flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Publish Reply</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
