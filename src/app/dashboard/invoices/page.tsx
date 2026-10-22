"use client";

import React, { useState, useMemo } from "react";
import { 
  CreditCard, 
  Check, 
  Plus, 
  Trash2, 
  Download, 
  Search, 
  Filter, 
  X, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  ShoppingBag,
  User,
  ArrowUpRight
} from "lucide-react";
import { 
  getInvoices, 
  INITIAL_INVOICES,
  createInvoice, 
  deleteInvoice, 
  updateInvoiceStatus, 
  getClientProfiles, 
  INITIAL_CLIENT_PROFILES,
  getServices,
  INITIAL_SERVICES,
  InvoiceRecord, 
  ClientProfile, 
  ServiceItem 
} from "@/lib/platform-store";
import { useClientStore } from "@/lib/use-client-store";
import { useAudio } from "@/components/AudioController";
import { useAuth } from "@/lib/auth-context";
import { generateInvoicePDF } from "@/lib/invoice-pdf";

export default function DashboardInvoicesPage() {
  const { profile, isLoading } = useAuth();
  const { playSuccess, playClick } = useAudio();
  const wsId = profile?.organizationId;
  const invoices = useClientStore(() => getInvoices(wsId), () => INITIAL_INVOICES);
  const clients = useClientStore(() => getClientProfiles(wsId), () => INITIAL_CLIENT_PROFILES);
  const services = useClientStore(() => getServices(wsId), () => INITIAL_SERVICES);

  // Modals & UI state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "sent" | "draft">("all");
  const [notification, setNotification] = useState<string | null>(null);

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [status, setStatus] = useState<"paid" | "sent" | "draft">("paid");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card / Terminal");
  const [lineItems, setLineItems] = useState<{ description: string; price: number }[]>([
    { description: "Standard Service Consultation & Delivery", price: 150 },
  ]);
  const [depositCredited, setDepositCredited] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [notes, setNotes] = useState("");

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };



  // Financial Calculations for Form
  const subtotal = useMemo(() => {
    return lineItems.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
  }, [lineItems]);

  const taxAmount = useMemo(() => {
    return Math.round(subtotal * (Number(taxPercent) || 0)) / 100;
  }, [subtotal, taxPercent]);

  const balanceDue = useMemo(() => {
    const deposit = Number(depositCredited) || 0;
    const computed = subtotal - deposit + taxAmount;
    return computed < 0 ? 0 : computed;
  }, [subtotal, depositCredited, taxAmount]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalCollectedCents = invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + i.balanceDueCents + (i.depositCreditedCents || 0), 0);

    const outstandingCents = invoices
      .filter((i) => i.status === "sent")
      .reduce((sum, i) => sum + i.balanceDueCents, 0);

    const paidCount = invoices.filter((i) => i.status === "paid").length;
    const sentCount = invoices.filter((i) => i.status === "sent").length;
    const draftCount = invoices.filter((i) => i.status === "draft").length;

    return {
      totalCollected: (totalCollectedCents / 100).toFixed(2),
      outstanding: (outstandingCents / 100).toFixed(2),
      paidCount,
      sentCount,
      draftCount,
      totalCount: invoices.length,
    };
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        inv.clientEmail.toLowerCase().includes(q) ||
        (inv.itemsSummary && inv.itemsSummary.toLowerCase().includes(q));

      return matchesStatus && matchesQuery;
    });
  }, [invoices, statusFilter, searchQuery]);

  // Client Selection Autofill
  const handleSelectClient = (clientId: string) => {
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setClientName(found.name);
      setClientEmail(found.email);
    }
  };

  // Add / Remove line items
  const handleAddLineItem = () => {
    playClick();
    setLineItems([...lineItems, { description: "", price: 50 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    playClick();
    if (lineItems.length <= 1) {
      showToast("Invoice must contain at least one line item.");
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleQuickAddService = (serviceId: string) => {
    const srv = services.find((s) => s.id === serviceId);
    if (srv) {
      playClick();
      setLineItems([...lineItems, { description: srv.name, price: srv.priceCents / 100 }]);
      showToast(`Added "${srv.name}" to invoice items`);
    }
  };

  // Create Invoice / Record Sale
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim()) {
      showToast("Please provide both client name and email.");
      return;
    }

    playSuccess();

    const itemsSummary = lineItems
      .filter((i) => i.description.trim())
      .map((i) => i.description.trim())
      .join(", ");

    const subtotalCents = Math.round(subtotal * 100);
    const depositCreditedCents = Math.round((Number(depositCredited) || 0) * 100);
    const taxCents = Math.round(taxAmount * 100);
    const balanceDueCents = Math.round(balanceDue * 100);

    const generatedNumber =
      invoiceNumber.trim() ||
      "INV-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);

    createInvoice(
      {
        bookingId: `manual_${Date.now()}`,
        invoiceNumber: generatedNumber,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        itemsSummary: itemsSummary || "Direct Service Sale",
        notes: notes.trim() || undefined,
        paymentMethod: status === "paid" ? paymentMethod : undefined,
        subtotalCents,
        depositCreditedCents,
        taxCents,
        balanceDueCents,
        status,
        paidAt: status === "paid" ? new Date().toISOString() : undefined,
      },
      wsId
    );

    setIsCreateOpen(false);
    // Reset form
    setClientName("");
    setClientEmail("");
    setInvoiceNumber("");
    setStatus("paid");
    setPaymentMethod("Credit Card / Terminal");
    setLineItems([{ description: "Standard Service Consultation & Delivery", price: 150 }]);
    setDepositCredited(0);
    setTaxPercent(0);
    setNotes("");

    showToast(`Invoice ${generatedNumber} recorded successfully!`);
  };

  const handleToggleStatus = (inv: InvoiceRecord, newStatus: InvoiceRecord["status"]) => {
    playClick();
    updateInvoiceStatus(inv.id, newStatus, wsId);
    showToast(`Invoice ${inv.invoiceNumber} updated to ${newStatus.toUpperCase()}`);
  };

  const handleDelete = (inv: InvoiceRecord) => {
    playClick();
    deleteInvoice(inv.id, wsId);
    showToast(`Invoice ${inv.invoiceNumber} removed.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
            Sales &amp; Invoicing Ledger
          </h1>
          <p className="text-xs text-[#3A9295] mt-1">
            Record manual sales, generate custom client invoices, settle outstanding balances, and track merchant cash flow.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-block text-xs text-[#105F68] font-medium bg-[#C8E6E2]/40 px-3 py-1.5 rounded-full border border-[#9ED5D1]/60">
            Stripe Direct Settlement: 0% Platform Fees
          </div>

          <button
            onClick={() => {
              playClick();
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice / Record Sale</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-black/5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#3A9295]">
            <span>Total Collected Revenue</span>
            <CheckCircle2 className="w-4 h-4 text-[#105F68]" />
          </div>
          <div className="text-2xl font-semibold text-[#105F68]">
            ${stats.totalCollected}
          </div>
          <p className="text-[11px] text-[#3A9295]">
            {stats.paidCount} paid transactions settled
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-black/5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#3A9295]">
            <span>Awaiting Settlement</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-semibold text-amber-600">
            ${stats.outstanding}
          </div>
          <p className="text-[11px] text-[#3A9295]">
            {stats.sentCount} outstanding open invoices
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-black/5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#3A9295]">
            <span>Total Sales Logged</span>
            <FileText className="w-4 h-4 text-[#63C1BB]" />
          </div>
          <div className="text-2xl font-semibold text-[#105F68]">
            {stats.totalCount}
          </div>
          <p className="text-[11px] text-[#3A9295]">
            {stats.draftCount} drafts in pipeline
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-black/5 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === "all"
                ? "bg-[#105F68] text-white shadow-sm"
                : "text-[#3A9295] hover:bg-[#F6FAF9]"
            }`}
          >
            All ({stats.totalCount})
          </button>
          <button
            onClick={() => setStatusFilter("paid")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === "paid"
                ? "bg-[#105F68] text-white shadow-sm"
                : "text-[#3A9295] hover:bg-[#F6FAF9]"
            }`}
          >
            Paid Sales ({stats.paidCount})
          </button>
          <button
            onClick={() => setStatusFilter("sent")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === "sent"
                ? "bg-[#105F68] text-white shadow-sm"
                : "text-[#3A9295] hover:bg-[#F6FAF9]"
            }`}
          >
            Awaiting ({stats.sentCount})
          </button>
          <button
            onClick={() => setStatusFilter("draft")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === "draft"
                ? "bg-[#105F68] text-white shadow-sm"
                : "text-[#3A9295] hover:bg-[#F6FAF9]"
            }`}
          >
            Drafts ({stats.draftCount})
          </button>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#3A9295]" />
          <input
            type="text"
            placeholder="Search by client or invoice #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#F6FAF9] rounded-xl text-xs text-[#105F68] placeholder-[#3A9295]/60 border border-transparent focus:border-[#105F68]/30 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <div className="p-12 rounded-3xl border border-black/5 bg-white text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#C8E6E2]/40 text-[#105F68] flex items-center justify-center mx-auto">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-light text-[#105F68]">No invoices or sales found</h3>
            <p className="text-xs text-[#3A9295] max-w-md mx-auto mt-1">
              {searchQuery || statusFilter !== "all"
                ? "No records match your active search and filter criteria."
                : "Record immediate sales, itemized client bills, or manual receipts anytime."}
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#105F68] text-white text-xs font-medium hover:bg-[#0D4F57] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Invoice / Sale</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              className="p-5 rounded-2xl border border-black/5 bg-white shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
            >
              {/* Left Column: Number, Client, Date & Description */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-semibold text-[#105F68]">
                    {inv.invoiceNumber}
                  </span>
                  
                  {inv.status === "paid" && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                      PAID SALE
                    </span>
                  )}
                  {inv.status === "sent" && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                      AWAITING PAYMENT
                    </span>
                  )}
                  {inv.status === "draft" && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-gray-100 text-gray-700 border border-gray-200">
                      DRAFT
                    </span>
                  )}

                  {inv.paymentMethod && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#F6FAF9] text-[#3A9295] border border-black/5">
                      {inv.paymentMethod}
                    </span>
                  )}
                  <span className="text-[11px] text-[#3A9295]/80">
                    {new Date(inv.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="text-[#105F68] font-medium">
                  Client: <span className="font-semibold">{inv.clientName}</span>{" "}
                  <span className="text-[#3A9295] font-normal">({inv.clientEmail})</span>
                </div>

                {inv.itemsSummary && (
                  <p className="text-[11px] text-[#3A9295] truncate">
                    <span className="font-medium text-[#105F68]/70">Items:</span> {inv.itemsSummary}
                  </p>
                )}

                {inv.notes && (
                  <p className="text-[11px] text-[#3A9295]/90 italic">
                    Note: {inv.notes}
                  </p>
                )}
              </div>

              {/* Middle Column: Financial Breakdown */}
              <div className="flex flex-col md:items-end justify-center min-w-[140px] border-t md:border-t-0 md:border-l border-black/5 pt-3 md:pt-0 md:pl-5">
                <div className="space-y-0.5 text-right">
                  {inv.depositCreditedCents > 0 && (
                    <span className="text-[11px] text-[#3A9295] block">
                      Deposit Credited: -${(inv.depositCreditedCents / 100).toFixed(2)}
                    </span>
                  )}
                  {inv.taxCents > 0 && (
                    <span className="text-[11px] text-[#3A9295] block">
                      Tax: +${(inv.taxCents / 100).toFixed(2)}
                    </span>
                  )}
                  <div className="text-sm font-semibold text-[#105F68] mt-1">
                    {inv.status === "paid" ? "Total Paid: " : "Balance Due: "}
                    <span className="text-base text-[#105F68]">
                      ${(inv.balanceDueCents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="flex items-center gap-2 border-t md:border-t-0 border-black/5 pt-3 md:pt-0">
                {/* Status Toggle Button */}
                {inv.status !== "paid" ? (
                  <button
                    onClick={() => handleToggleStatus(inv, "paid")}
                    className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] transition-all flex items-center gap-1 shadow-sm"
                    title="Mark invoice as settled / paid"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark Paid</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleStatus(inv, "sent")}
                    className="px-3 py-1.5 rounded-full border border-black/10 hover:bg-black/5 text-[#3A9295] text-[11px] transition-all"
                    title="Mark as awaiting payment"
                  >
                    Set Unpaid
                  </button>
                )}

                {/* Download Real PDF Button */}
                <button
                  onClick={() => {
                    playSuccess();
                    try {
                      generateInvoicePDF(inv, {
                        name: profile?.organizationName || "Merchant Workspace",
                        email: profile?.email,
                        slug: profile?.organizationSlug || "store",
                      });
                      showToast(`Downloaded official PDF for ${inv.invoiceNumber}`);
                    } catch (err: unknown) {
                      showToast(`Failed to generate PDF: ${(err as Error)?.message || "Error"}`);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-full border border-[#105F68]/20 hover:bg-[#105F68]/5 text-[#105F68] transition-all flex items-center gap-1.5"
                  title="Download official PDF statement"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px] font-medium">PDF</span>
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(inv)}
                  className="p-2 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition-all"
                  title="Delete Invoice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Creation / Record Sale Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-black/5 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div>
                <h2 className="text-xl font-light text-[#105F68]">
                  Record Sale / Generate Invoice
                </h2>
                <p className="text-xs text-[#3A9295] mt-0.5">
                  Issue a direct sale or generate an itemized invoice for client balance settlement.
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-2 rounded-full hover:bg-black/5 text-[#3A9295] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-6">
              {/* Type / Status Selector */}
              <div>
                <label className="text-xs font-semibold text-[#105F68] block mb-2">
                  Transaction Type &amp; Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus("paid")}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                      status === "paid"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm"
                        : "border-black/10 text-[#3A9295] hover:bg-black/5"
                    }`}
                  >
                    ✓ Paid Sale (Settled)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("sent")}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                      status === "sent"
                        ? "bg-amber-50 border-amber-500 text-amber-800 shadow-sm"
                        : "border-black/10 text-[#3A9295] hover:bg-black/5"
                    }`}
                  >
                    ✉ Sent (Awaiting Pay)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("draft")}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                      status === "draft"
                        ? "bg-gray-100 border-gray-400 text-gray-800 shadow-sm"
                        : "border-black/10 text-[#3A9295] hover:bg-black/5"
                    }`}
                  >
                    Draft Only
                  </button>
                </div>
              </div>

              {/* Client Information */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#105F68] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Client Details</span>
                  </label>
                  {clients.length > 0 && (
                    <div className="text-[11px] text-[#3A9295] flex items-center gap-1">
                      <span>Autofill:</span>
                      <select
                        onChange={(e) => handleSelectClient(e.target.value)}
                        defaultValue=""
                        className="bg-[#F6FAF9] border border-black/10 rounded-lg px-2 py-0.5 text-xs text-[#105F68] focus:outline-none"
                      >
                        <option value="" disabled>
                          Select saved client...
                        </option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Client Full Name *"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F6FAF9] border border-black/10 focus:border-[#105F68] text-[#105F68] focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Client Email Address *"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F6FAF9] border border-black/10 focus:border-[#105F68] text-[#105F68] focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Invoice & Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#105F68] block mb-1">
                    Invoice # (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave blank for auto INV-2026-XXXX"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F6FAF9] border border-black/10 focus:border-[#105F68] text-[#105F68] focus:outline-none transition-all"
                  />
                </div>

                {status === "paid" && (
                  <div>
                    <label className="text-xs font-semibold text-[#105F68] block mb-1">
                      Payment Tender / Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F6FAF9] border border-black/10 focus:border-[#105F68] text-[#105F68] focus:outline-none transition-all"
                    >
                      <option value="Credit Card / Terminal">Credit Card / Terminal</option>
                      <option value="Stripe Online Checkout">Stripe Online Checkout</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Wire / Transfer">Bank Wire / Transfer</option>
                      <option value="Check / Cheque">Check / Cheque</option>
                      <option value="Gift Card / Voucher">Gift Card / Voucher</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Line Items & Catalog Quick-Add */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#105F68] flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Line Items / Services</span>
                  </label>
                  {services.length > 0 && (
                    <div className="text-[11px] text-[#3A9295] flex items-center gap-1">
                      <span>Quick Catalog:</span>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleQuickAddService(e.target.value);
                            e.target.value = "";
                          }
                        }}
                        defaultValue=""
                        className="bg-[#F6FAF9] border border-black/10 rounded-lg px-2 py-0.5 text-xs text-[#105F68] focus:outline-none"
                      >
                        <option value="" disabled>
                          + Insert catalog item...
                        </option>
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (${(s.priceCents / 100).toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {lineItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Description of service or product"
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[index].description = e.target.value;
                          setLineItems(updated);
                        }}
                        className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-[#F6FAF9] border border-black/10 focus:border-[#105F68] text-[#105F68] focus:outline-none transition-all"
                      />
                      <div className="relative w-28">
                        <span className="absolute left-3 top-2 text-xs text-[#3A9295]">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={item.price || ""}
                          onChange={(e) => {
                            const updated = [...lineItems];
                            updated[index].price = parseFloat(e.target.value) || 0;
                            setLineItems(updated);
                          }}
                          className="w-full pl-6 pr-3 py-2 rounded-xl text-xs bg-[#F6FAF9] border border-black/10 focus:border-[#105F68] text-[#105F68] focus:outline-none transition-all text-right"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="text-xs text-[#105F68] font-medium hover:underline flex items-center gap-1 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add another line item</span>
                </button>
              </div>

              {/* Financial Calculation Adjustments */}
              <div className="p-4 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-2 text-xs">
                <div className="flex justify-between items-center text-[#3A9295]">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-[#105F68]">${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-[#3A9295]">
                  <span>Deposit Credited / Deduction ($):</span>
                  <div className="relative w-28">
                    <span className="absolute left-3 top-1.5 text-xs text-[#3A9295]">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={depositCredited || ""}
                      onChange={(e) => setDepositCredited(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full pl-6 pr-2 py-1 bg-white border border-black/10 rounded-lg text-xs text-right focus:outline-none focus:border-[#105F68]"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[#3A9295]">
                  <span>Tax Rate (%):</span>
                  <div className="relative w-28">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={taxPercent || ""}
                      onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                      placeholder="0%"
                      className="w-full px-2 py-1 bg-white border border-black/10 rounded-lg text-xs text-right focus:outline-none focus:border-[#105F68]"
                    />
                  </div>
                </div>

                {taxAmount > 0 && (
                  <div className="flex justify-between items-center text-[#3A9295]">
                    <span>Calculated Tax:</span>
                    <span className="text-[#105F68]">+${taxAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-black/5 pt-2 flex justify-between items-center text-sm font-semibold text-[#105F68]">
                  <span>{status === "paid" ? "Total Settled Amount:" : "Net Balance Due:"}</span>
                  <span className="text-base text-[#105F68] font-bold">
                    ${balanceDue.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Optional Memo / Notes */}
              <div>
                <label className="text-xs font-semibold text-[#105F68] block mb-1">
                  Memo / Internal Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., In-person POS checkout, client requested email receipt..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F6FAF9] border border-black/10 focus:border-[#105F68] text-[#105F68] focus:outline-none transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-full border border-black/10 text-xs font-medium text-[#3A9295] hover:bg-black/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all shadow-sm"
                >
                  {status === "paid" ? "Record Paid Sale" : "Issue Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#105F68] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs animate-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-[#63C1BB]" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}
