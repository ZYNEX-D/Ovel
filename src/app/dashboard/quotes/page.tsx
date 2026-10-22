"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  FileText, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  X, 
  Calendar, 
  Sparkles,
  ShoppingBag
} from "lucide-react";
import { 
  getQuotes, 
  INITIAL_QUOTES,
  createQuote, 
  deleteQuote, 
  getClientProfiles, 
  INITIAL_CLIENT_PROFILES,
  getServices, 
  INITIAL_SERVICES,
  QuoteProposal, 
  ClientProfile, 
  ServiceItem 
} from "@/lib/platform-store";
import { useClientStore } from "@/lib/use-client-store";
import { useAuth } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";

export default function DashboardQuotesPage() {
  const { profile, isLoading } = useAuth();
  const { playClick, playSuccess } = useAudio();
  const wsId = profile?.organizationId;
  const quotes = useClientStore(() => getQuotes(wsId), () => INITIAL_QUOTES);
  const clients = useClientStore(() => getClientProfiles(wsId), () => INITIAL_CLIENT_PROFILES);
  const services = useClientStore(() => getServices(wsId), () => INITIAL_SERVICES);

  // Modals & Notifications
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [lineItems, setLineItems] = useState<{ description: string; price: number }[]>([
    { description: "Primary Consultation & Project Assessment", price: 250 },
  ]);
  const [optionalAddOns, setOptionalAddOns] = useState<{ description: string; price: number }[]>([
    { description: "Priority Weekend Allocation & Expedited Turnaround", price: 150 },
  ]);
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [expiresInDays, setExpiresInDays] = useState<number>(14);
  const [quoteStatus, setQuoteStatus] = useState<"draft" | "sent">("sent");

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };



  // Form Computations
  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }, [lineItems]);

  const handleSelectClient = (clientId: string) => {
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setClientName(found.name);
      setClientEmail(found.email);
      setClientPhone(found.phone || "");
    }
  };

  const handleAddLineItem = () => {
    playClick();
    setLineItems([...lineItems, { description: "", price: 100 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    playClick();
    if (lineItems.length <= 1) {
      showToast("Quote requires at least one line item.");
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleQuickAddService = (serviceId: string) => {
    const srv = services.find((s) => s.id === serviceId);
    if (srv) {
      playClick();
      setLineItems([...lineItems, { description: srv.name, price: srv.priceCents / 100 }]);
      showToast(`Added "${srv.name}" to line items`);
    }
  };

  const handleAddAddOn = () => {
    playClick();
    setOptionalAddOns([...optionalAddOns, { description: "", price: 50 }]);
  };

  const handleRemoveAddOn = (index: number) => {
    playClick();
    setOptionalAddOns(optionalAddOns.filter((_, i) => i !== index));
  };

  const handleCreateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientName.trim() || !clientEmail.trim()) {
      showToast("Please complete proposal title, client name, and email.");
      return;
    }

    playSuccess();

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (Number(expiresInDays) || 14));

    const totalCents = Math.round(subtotal * 100);
    const depositCents = Math.round((Number(depositAmount) || 0) * 100);

    const formattedLineItems = lineItems
      .filter((item) => item.description.trim())
      .map((item) => ({
        description: item.description,
        priceCents: Math.round((Number(item.price) || 0) * 100),
      }));

    const formattedAddOns = optionalAddOns
      .filter((add) => add.description.trim())
      .map((add, idx) => ({
        id: `addon_${Date.now()}_${idx}`,
        description: add.description,
        priceCents: Math.round((Number(add.price) || 0) * 100),
        selected: false,
      }));

    createQuote(
      {
        title,
        clientName,
        clientEmail,
        clientPhone,
        lineItems: formattedLineItems.length > 0 ? formattedLineItems : [{ description: title, priceCents: totalCents }],
        optionalAddOns: formattedAddOns,
        totalCents,
        depositCents,
        status: quoteStatus,
        expiresAt: expiryDate.toISOString(),
      },
      wsId
    );

    setIsCreateOpen(false);
    setTitle("");
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setLineItems([{ description: "Primary Consultation & Project Assessment", price: 250 }]);
    setOptionalAddOns([{ description: "Priority Weekend Allocation", price: 150 }]);
    showToast(`Quote "${title}" successfully drafted & published!`);
  };

  const handleCopyQuoteLink = (quoteId: string) => {
    playClick();
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/quote/${quoteId}`
      : `https://ovel.app/quote/${quoteId}`;
    navigator.clipboard?.writeText(url);
    setCopiedId(quoteId);
    setTimeout(() => setCopiedId(null), 2500);
    showToast("Interactive quote URL copied to clipboard");
  };

  const handleDeleteQuote = (quoteId: string) => {
    playClick();
    deleteQuote(quoteId, wsId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
            Quotes &amp; Proposals Pipeline
          </h1>
          <p className="text-xs text-[#3A9295] mt-1">
            Create interactive proposals with optional client add-ons, digital signature, and automated deposit collection.
          </p>
        </div>

        <button
          onClick={() => {
            playClick();
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Quote</span>
        </button>
      </div>

      {/* Quotes List */}
      {quotes.length === 0 ? (
        <div className="p-12 rounded-3xl border border-black/5 bg-white text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#C8E6E2]/40 text-[#105F68] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-medium text-[#105F68]">No quotes drafted yet</h3>
            <p className="text-xs text-[#3A9295] max-w-md mx-auto">
              Draft professional estimates and interactive proposals. Clients can review line items, toggle optional upgrades, and e-sign online.
            </p>
          </div>
          <button
            onClick={() => {
              playClick();
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Quote</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((q) => (
            <div
              key={q.id}
              className="p-6 rounded-3xl border border-black/5 bg-white shadow-sm space-y-4 text-xs transition-all hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className="text-base font-semibold text-[#105F68]">{q.title}</h4>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase font-semibold ${
                        q.status === "accepted"
                          ? "bg-emerald-100 text-emerald-800"
                          : q.status === "sent"
                          ? "bg-blue-100 text-blue-800"
                          : q.status === "converted"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                  <p className="text-[#3A9295]">
                    Client: <b className="text-[#105F68]">{q.clientName}</b> • {q.clientEmail} {q.clientPhone && `• ${q.clientPhone}`}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-lg font-bold text-[#105F68]">
                    ${(q.totalCents / 100).toFixed(2)}
                  </span>
                  <span className="text-[11px] text-[#3A9295] block mt-0.5">
                    Deposit: ${(q.depositCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Line items summary */}
              <div className="p-3.5 rounded-2xl bg-[#F6FAF9] border border-black/5 flex flex-wrap items-center justify-between gap-3 text-[11px]">
                <div className="flex items-center gap-2 text-[#3A9295]">
                  <span>{q.lineItems.length} line item(s)</span>
                  {q.optionalAddOns && q.optionalAddOns.length > 0 && (
                    <span>• {q.optionalAddOns.length} optional upgrade(s)</span>
                  )}
                  {q.expiresAt && (
                    <span>• Expires: {new Date(q.expiresAt).toLocaleDateString()}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyQuoteLink(q.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#105F68]/20 bg-white hover:bg-[#105F68]/5 text-[#105F68] transition-all"
                  >
                    {copiedId === q.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === q.id ? "Link Copied" : "Copy Link"}</span>
                  </button>

                  <Link
                    href={`/quote/${q.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#105F68] text-white hover:bg-[#0D4F57] transition-all font-medium"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open Proposal</span>
                  </Link>

                  <button
                    onClick={() => handleDeleteQuote(q.id)}
                    title="Delete quote"
                    className="p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Quote Creation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#C8E6E2]/40 text-[#105F68] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#105F68]">Create Quote / Proposal</h3>
                  <p className="text-xs text-[#3A9295]">Draft an interactive proposal with digital e-signing.</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-black hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="space-y-5 text-xs">
              {/* Proposal Title */}
              <div>
                <label className="text-[#3A9295] font-medium block mb-1">
                  Proposal Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  placeholder="e.g. Bespoke Consulting & Strategy Architecture"
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] font-medium focus:outline-none focus:border-[#105F68]"
                />
              </div>

              {/* Client Details */}
              <div className="p-4 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-[#105F68]">Client Information</h4>
                  {clients.length > 0 && (
                    <select
                      onChange={(e) => handleSelectClient(e.target.value)}
                      defaultValue=""
                      className="text-[11px] px-2.5 py-1 rounded-lg border border-black/10 bg-white text-[#105F68] focus:outline-none"
                    >
                      <option value="" disabled>Autofill from saved clients...</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] text-[#3A9295] font-medium block mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#3A9295] font-medium block mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="client@domain.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#3A9295] font-medium block mb-1">Phone</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-[#105F68]">Line Items &amp; Services</h4>
                  {services.length > 0 && (
                    <select
                      onChange={(e) => {
                        handleQuickAddService(e.target.value);
                        e.target.value = "";
                      }}
                      defaultValue=""
                      className="text-[11px] px-2.5 py-1 rounded-lg border border-black/10 bg-white text-[#105F68] focus:outline-none"
                    >
                      <option value="" disabled>+ Add from service catalog...</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} (${(s.priceCents / 100).toFixed(2)})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Item or service description"
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[idx].description = e.target.value;
                          setLineItems(updated);
                        }}
                        className="flex-1 px-3 py-2 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                      />
                      <div className="w-28 relative">
                        <span className="absolute left-3 top-2 text-[#3A9295] font-mono">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={item.price}
                          onChange={(e) => {
                            const updated = [...lineItems];
                            updated[idx].price = Number(e.target.value);
                            setLineItems(updated);
                          }}
                          className="w-full pl-7 pr-3 py-2 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] font-mono focus:outline-none focus:border-[#105F68]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(idx)}
                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#105F68] hover:text-[#0D4F57] pt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              {/* Optional Upgrades / Add-ons */}
              <div className="space-y-3 pt-2 border-t border-black/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-[#105F68]">Interactive Add-Ons (Optional)</h4>
                    <p className="text-[10px] text-slate-400">Clients can toggle these upgrades when accepting proposal.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAddOn}
                    className="flex items-center gap-1 text-xs text-[#105F68] hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Upgrade</span>
                  </button>
                </div>

                {optionalAddOns.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. VIP Concierge Support or Extended Warranty"
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...optionalAddOns];
                        updated[idx].description = e.target.value;
                        setOptionalAddOns(updated);
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                    />
                    <div className="w-28 relative">
                      <span className="absolute left-3 top-2 text-[#3A9295] font-mono">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.price}
                        onChange={(e) => {
                          const updated = [...optionalAddOns];
                          updated[idx].price = Number(e.target.value);
                          setOptionalAddOns(updated);
                        }}
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] font-mono focus:outline-none focus:border-[#105F68]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAddOn(idx)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Deposit, Expiry & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-black/5">
                <div>
                  <label className="text-[11px] text-[#3A9295] font-medium block mb-1">Required Deposit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] font-mono focus:outline-none focus:border-[#105F68]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#3A9295] font-medium block mb-1">Validity (Days)</label>
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none"
                  >
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days (Standard)</option>
                    <option value={30}>30 Days</option>
                    <option value={60}>60 Days</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#3A9295] font-medium block mb-1">Initial Status</label>
                  <select
                    value={quoteStatus}
                    onChange={(e) => setQuoteStatus(e.target.value as "draft" | "sent")}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none"
                  >
                    <option value="sent">Published / Sent</option>
                    <option value="draft">Internal Draft</option>
                  </select>
                </div>
              </div>

              {/* Summary Bar */}
              <div className="p-4 rounded-2xl bg-[#C8E6E2]/20 border border-[#105F68]/15 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Total Base Proposal:</span>
                  <span className="text-base font-bold text-[#105F68]">${subtotal.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Deposit Due at Signature:</span>
                  <span className="text-sm font-semibold text-[#105F68]">${Number(depositAmount).toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-full border border-black/10 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#105F68] text-white font-semibold hover:bg-[#0D4F57] transition-all shadow-md"
                >
                  Create &amp; Publish Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#105F68] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs">
          <Check className="w-4 h-4 text-[#63C1BB]" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}
