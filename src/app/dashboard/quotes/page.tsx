"use client";

import React, { useState, useMemo, useCallback } from "react";
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
  ShoppingBag,
  Package,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Send,
  CheckCircle2,
  Landmark,
  CreditCard,
  Coins
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  getQuotes, 
  INITIAL_QUOTES,
  createQuote, 
  deleteQuote, 
  saveQuotes,
  getClientProfiles, 
  INITIAL_CLIENT_PROFILES,
  getServices, 
  INITIAL_SERVICES,
  getProducts,
  INITIAL_PRODUCTS,
  getPaymentAccounts,
  INITIAL_PAYMENT_ACCOUNTS,
  PaymentAccount,
  deductInventoryForLineItems,
  QuoteProposal, 
  ClientProfile, 
  ServiceItem,
  ProductItem,
  InvoiceLineItem,
  formatServicePrice
} from "@/lib/platform-store";
import { useClientStore } from "@/lib/use-client-store";
import { useAuth } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";
import { formatCurrency, formatCurrencyRaw, getCurrencySymbol, DEFAULT_CURRENCY } from "@/lib/currency";
import { getOvelink } from "@/lib/ovelink-store";
import { Dialog, DialogContent, DialogClose } from "@/components/arc/dialog/dialog";
import Toast from "@/components/arc/toast/toast";
import Alert from "@/components/arc/alert/alert";
import { ArcBadge } from "@/components/ui/ArcBadge";
import { Combobox, ComboboxOption } from "@/components/arc/combobox/combobox";
import { Select } from "@/components/arc/select/select";
import { SortableDataTable, type DataColumn } from "@/components/arc/sortable-data-table/sortable-data-table";
import { Stepper, StepperStep } from "@/components/arc/stepper/stepper";

interface LineItemState {
  id: string;
  type: "product" | "service" | "custom";
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  stockCount?: number;
}

export default function DashboardQuotesPage() {
  const { profile, isLoading } = useAuth();
  const { playClick, playSuccess } = useAudio();
  const wsId = profile?.organizationId || profile?.organizationSlug;

  const readQuotes = useCallback(() => getQuotes(wsId), [wsId]);
  const quotes = useClientStore(readQuotes, () => INITIAL_QUOTES);

  const readClients = useCallback(() => getClientProfiles(wsId), [wsId]);
  const clients = useClientStore(readClients, () => INITIAL_CLIENT_PROFILES);

  const readServices = useCallback(() => getServices(wsId), [wsId]);
  const services = useClientStore(readServices, () => INITIAL_SERVICES);

  const readProducts = useCallback(() => getProducts(wsId), [wsId]);
  const products = useClientStore(readProducts, () => INITIAL_PRODUCTS);

  const readPaymentAccounts = useCallback(() => getPaymentAccounts(wsId), [wsId]);
  const paymentAccounts = useClientStore(readPaymentAccounts, () => INITIAL_PAYMENT_ACCOUNTS);

  const defaultSlug = profile?.organizationSlug || profile?.organizationId || "my-brand";
  const activeOvelink = useClientStore(
    () => getOvelink(defaultSlug, profile?.organizationName, wsId),
    () => getOvelink(defaultSlug, profile?.organizationName, wsId)
  );
  const currency = activeOvelink?.currency || DEFAULT_CURRENCY;
  const symbol = getCurrencySymbol(currency);

  // Modals & Notifications
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [quoteStep, setQuoteStep] = useState(0);
  const [attemptedSteps, setAttemptedSteps] = useState<number[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [searchCatalogValue, setSearchCatalogValue] = useState("");
  const [lineItems, setLineItems] = useState<LineItemState[]>([
    {
      id: "li_init",
      type: "custom",
      description: "Consultation & Project Deliverable",
      quantity: 1,
      unitPrice: 250,
    },
  ]);
  const [optionalAddOns, setOptionalAddOns] = useState<{ description: string; price: number }[]>([
    { description: "Priority Weekend Allocation & Expedited Turnaround", price: 150 },
  ]);
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [expiresInDays, setExpiresInDays] = useState<number>(14);
  const [selectedPaymentAccountId, setSelectedPaymentAccountId] = useState<string>("any");
  const [termsAndConditions, setTermsAndConditions] = useState<string>(
    "1. Scope: Deliverables correspond strictly to itemized line items.\n2. Validity: Quotation rates remain firm for 14 calendar days from issuance.\n3. Deposit & Settlement: Upfront deposit is due upon signing to reserve specialist scheduling.\n4. Cancellation: Cancellations made under 24 hours prior to scheduled kickoff are subject to deposit forfeiture."
  );
  const [quoteStatus, setQuoteStatus] = useState<"draft" | "sent" | "accepted">("sent");

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Step Validation & Stepper Config
  const isStep0Valid = Boolean(title.trim() && clientName.trim() && clientEmail.trim());
  const isStep1Valid = lineItems.some(
    (item) => item.description.trim() && Number(item.unitPrice) >= 0 && Number(item.quantity) > 0
  );

  const quoteSteps: StepperStep[] = [
    {
      id: "client",
      label: "Proposal & Client",
      description: "Title and client contact",
      error: attemptedSteps.includes(0) && !isStep0Valid ? "Required fields missing" : undefined,
    },
    {
      id: "items",
      label: "Line Items",
      description: "Products & services",
      error: attemptedSteps.includes(1) && !isStep1Valid ? "Add at least 1 item" : undefined,
    },
    {
      id: "terms",
      label: "Add-ons & Terms",
      description: "Deposit & validity",
    },
    {
      id: "review",
      label: "Review & Publish",
      description: "Summary & status",
    },
  ];

  const handleOpenCreateModal = () => {
    playClick();
    setQuoteStep(0);
    setAttemptedSteps([]);
    setIsCreateOpen(true);
  };

  const handleNextStep = () => {
    if (quoteStep === 0) {
      if (!isStep0Valid) {
        if (!attemptedSteps.includes(0)) setAttemptedSteps((prev) => [...prev, 0]);
        showToast("Please provide proposal title, client name, and email.");
        return;
      }
    } else if (quoteStep === 1) {
      if (!isStep1Valid) {
        if (!attemptedSteps.includes(1)) setAttemptedSteps((prev) => [...prev, 1]);
        showToast("Please add at least one line item with a description.");
        return;
      }
    }
    playClick();
    setQuoteStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    playClick();
    setQuoteStep((prev) => Math.max(prev - 1, 0));
  };

  // Form Computations
  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + (Number(item.quantity || 1) * (Number(item.unitPrice) || 0)), 0);
  }, [lineItems]);

  const catalogOptions: ComboboxOption[] = useMemo(() => {
    const prods: ComboboxOption[] = (products || []).map((p) => ({
      value: `product:${p.id}`,
      label: p.name,
      group: "Physical Products",
      badge: `Stock: ${p.stockCount}`,
      subtext: `${p.category || "Products"}${p.sku ? ` • SKU: ${p.sku}` : ""} • ${formatCurrency(p.priceCents, currency)}`,
      keywords: [p.name, p.category || "", p.sku || "", "product"],
      renderItem: () => (
        <div className="flex items-center justify-between w-full py-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              PRODUCT
            </span>
            <div className="truncate">
              <span className="font-medium text-xs text-slate-800 truncate block">{p.name}</span>
              <span className="text-[10px] text-slate-400 block truncate">
                {p.category || "Products"}{p.sku ? ` • SKU: ${p.sku}` : ""}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0 pl-2">
            <span className="text-xs font-semibold text-[#105F68] font-mono block">
              {formatCurrency(p.priceCents, currency)}
            </span>
            <span className={`text-[10px] ${p.stockCount > 0 ? "text-emerald-600 font-medium" : "text-rose-500 font-semibold"}`}>
              {p.stockCount > 0 ? `${p.stockCount} in stock` : "Out of stock"}
            </span>
          </div>
        </div>
      ),
    }));

    const srvs: ComboboxOption[] = (services || []).map((s) => ({
      value: `service:${s.id}`,
      label: s.name,
      group: "Services",
      badge: s.pricingType === "range" ? "Range" : `${s.durationMinutes}m`,
      subtext: `${s.category || "Services"} • ${formatServicePrice(s, currency)}`,
      keywords: [s.name, s.category || "", "service"],
      renderItem: () => (
        <div className="flex items-center justify-between w-full py-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              SERVICE
            </span>
            <div className="truncate">
              <span className="font-medium text-xs text-slate-800 truncate block">{s.name}</span>
              <span className="text-[10px] text-slate-400 block truncate">
                {s.category || "Services"} • {s.durationMinutes} mins
              </span>
            </div>
          </div>
          <div className="text-right shrink-0 pl-2">
            <span className="text-xs font-semibold text-[#105F68] font-mono block">
              {formatServicePrice(s, currency)}
            </span>
          </div>
        </div>
      ),
    }));

    return [...prods, ...srvs];
  }, [products, services, currency]);

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
    setLineItems([
      ...lineItems,
      {
        id: "li_" + Math.random().toString(36).slice(2, 8),
        type: "custom",
        description: "",
        quantity: 1,
        unitPrice: 50,
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    playClick();
    if (lineItems.length <= 1) {
      showToast("Quote requires at least one line item.");
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleAddCatalogItem = (selectedValue: string) => {
    if (!selectedValue) return;
    const [type, id] = selectedValue.split(":");

    if (type === "product") {
      const prod = products.find((p) => p.id === id);
      if (prod) {
        setLineItems((prev) => {
          const isInitialEmpty =
            prev.length === 1 &&
            prev[0].id === "li_init" &&
            prev[0].description === "Consultation & Project Deliverable" &&
            prev[0].unitPrice === 250;
          const base = isInitialEmpty ? [] : prev;
          return [
            ...base,
            {
              id: "li_" + Math.random().toString(36).slice(2, 8),
              type: "product",
              itemId: prod.id,
              description: prod.name,
              quantity: 1,
              unitPrice: prod.priceCents / 100,
              stockCount: prod.stockCount,
            },
          ];
        });
        playClick();
        showToast(`Added product "${prod.name}" (Stock: ${prod.stockCount})`);
      }
    } else if (type === "service") {
      const srv = services.find((s) => s.id === id);
      if (srv) {
        setLineItems((prev) => {
          const isInitialEmpty =
            prev.length === 1 &&
            prev[0].id === "li_init" &&
            prev[0].description === "Consultation & Project Deliverable" &&
            prev[0].unitPrice === 250;
          const base = isInitialEmpty ? [] : prev;
          return [
            ...base,
            {
              id: "li_" + Math.random().toString(36).slice(2, 8),
              type: "service",
              itemId: srv.id,
              description: srv.name,
              quantity: 1,
              unitPrice: srv.priceCents / 100,
            },
          ];
        });
        playClick();
        showToast(`Added service "${srv.name}"`);
      }
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

    const formattedLineItems: InvoiceLineItem[] = lineItems
      .filter((item) => item.description.trim())
      .map((item) => ({
        id: item.id,
        type: item.type,
        itemId: item.itemId,
        description: item.description,
        quantity: item.quantity,
        unitPriceCents: Math.round(item.unitPrice * 100),
        priceCents: Math.round(item.quantity * item.unitPrice * 100),
      }));

    const formattedAddOns = optionalAddOns
      .filter((add) => add.description.trim())
      .map((add, idx) => ({
        id: `addon_${Date.now()}_${idx}`,
        description: add.description,
        priceCents: Math.round((Number(add.price) || 0) * 100),
        selected: false,
      }));

    // If marked accepted right away, deduct inventory for physical products
    if (quoteStatus === "accepted") {
      const itemsToDeduct = formattedLineItems
        .filter((i) => i.type === "product" && i.itemId)
        .map((i) => ({ itemId: i.itemId, quantity: i.quantity || 1 }));
      if (itemsToDeduct.length > 0) {
        deductInventoryForLineItems(itemsToDeduct, wsId);
        showToast("Product inventory stock updated");
      }
    }

    const selectedAcc = paymentAccounts.find((a) => a.id === selectedPaymentAccountId);

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
        termsAndConditions: termsAndConditions.trim() || undefined,
        paymentMethodId: selectedAcc ? selectedAcc.id : undefined,
        paymentMethodName: selectedAcc
          ? selectedAcc.name
          : selectedPaymentAccountId === "any"
          ? "Client's Choice (All Active Channels)"
          : undefined,
        paymentMethodDetails: selectedAcc
          ? selectedAcc.type === "bank_transfer"
            ? `${selectedAcc.bankName || "Bank"} • A/C No: ${selectedAcc.accountNumber || ""} (${selectedAcc.accountName || ""})${
                selectedAcc.branchName ? ` • ${selectedAcc.branchName}` : ""
              }`
            : selectedAcc.instructions || selectedAcc.type
          : undefined,
        status: quoteStatus,
        expiresAt: expiryDate.toISOString(),
      },
      wsId
    );

    setIsCreateOpen(false);
    setQuoteStep(0);
    setAttemptedSteps([]);
    setTitle("");
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setSearchCatalogValue("");
    setLineItems([
      {
        id: "li_init",
        type: "custom",
        description: "Consultation & Project Deliverable",
        quantity: 1,
        unitPrice: 250,
      },
    ]);
    setOptionalAddOns([{ description: "Priority Weekend Allocation", price: 150 }]);
    showToast(`Quote "${title}" successfully drafted & published!`);
  };

  const handleUpdateQuoteStatus = (quote: QuoteProposal, nextStatus: "sent" | "accepted" | "converted") => {
    playClick();
    if (nextStatus === "accepted" || nextStatus === "converted") {
      // Deduct inventory
      const itemsToDeduct = (quote.lineItems || [])
        .filter((i) => i.type === "product" && i.itemId)
        .map((i) => ({ itemId: i.itemId, quantity: i.quantity || 1 }));
      if (itemsToDeduct.length > 0) {
        deductInventoryForLineItems(itemsToDeduct, wsId);
        showToast("Product inventory stock decremented for confirmed items");
      }
    }

    const updated = quotes.map((q) => (q.id === quote.id ? { ...q, status: nextStatus } : q));
    saveQuotes(updated, wsId);
    showToast(`Quote updated to "${nextStatus}"`);
  };

  const handleCopyQuoteLink = (quoteId: string) => {
    playClick();
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/quote/${quoteId}`
      : `https://ovel.lk/quote/${quoteId}`;
    navigator.clipboard?.writeText(url);
    setCopiedId(quoteId);
    setTimeout(() => setCopiedId(null), 2500);
    showToast("Interactive quote URL copied to clipboard");
  };

  const handleDeleteQuote = (quoteId: string) => {
    playClick();
    deleteQuote(quoteId, wsId);
    setDeletingQuoteId(null);
    showToast("Quote deleted");
  };

  const quoteColumns = useMemo<DataColumn<QuoteProposal & Record<string, unknown>>[]>(() => [
    {
      key: "title",
      label: "Proposal / Quote",
      sortable: true,
      render: (_val, quote) => (
        <div>
          <div className="font-medium text-slate-900">{quote.title}</div>
          <div className="text-xs text-slate-500">{quote.lineItems?.length || 0} line {quote.lineItems?.length === 1 ? "item" : "items"}</div>
        </div>
      ),
    },
    {
      key: "clientName",
      label: "Client",
      sortable: true,
      render: (_val, quote) => (
        <div>
          <div className="text-xs font-medium text-slate-800">{quote.clientName}</div>
          <div className="text-[11px] text-slate-400">{quote.clientEmail}</div>
        </div>
      ),
    },
    {
      key: "totalCents",
      label: "Total Value",
      sortable: true,
      numeric: true,
      render: (val) => (
        <span className="font-mono font-medium text-[#103438]">
          {formatCurrency(Number(val) || 0, currency)}
        </span>
      ),
    },
    {
      key: "depositCents",
      label: "Deposit",
      sortable: true,
      numeric: true,
      render: (val) => (
        <span className="font-mono text-xs text-slate-600">
          {Number(val) > 0 ? formatCurrency(Number(val), currency) : "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (_val, quote) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <ArcBadge
            variant={
              quote.status === "accepted" || quote.status === "converted"
                ? "emerald"
                : quote.status === "sent"
                ? "teal"
                : "neutral"
            }
            size="xs"
          >
            {quote.status}
          </ArcBadge>
          {quote.signatureData && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Signed
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_val, quote) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyQuoteLink(quote.id);
            }}
            className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
            title="Copy interactive quote link"
          >
            <Copy className="w-3 h-3 text-[#105F68]" />
            <span>{copiedId === quote.id ? "Copied" : "Link"}</span>
          </button>

          {quote.status === "sent" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateQuoteStatus(quote, "accepted");
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium hover:bg-emerald-100 flex items-center gap-1 cursor-pointer transition-colors"
              title="Accept quote & deduct product stock"
            >
              <Check className="w-3 h-3" />
              <span>Accept</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playClick();
              setDeletingQuoteId(quote.id);
            }}
            className="p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete quote"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ], [currency, copiedId, handleCopyQuoteLink, handleUpdateQuoteStatus, playClick]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
            Quotes &amp; Proposals Pipeline
          </h1>
          <p className="text-xs text-[#3A9295] mt-1">
            Create interactive proposals linking services and physical products with automatic inventory management upon confirmation.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Quote</span>
        </button>
      </div>

      {/* Quote List presentation with SortableDataTable */}
      {quotes.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#C8E6E2]/40 text-[#105F68] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No Quotes or Proposals Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Draft interactive estimates with select products, services, and optional add-ons to send to prospective clients.
          </p>
          <div className="pt-2">
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Quote</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-2 sm:p-4 overflow-hidden">
          <SortableDataTable
            rows={quotes as unknown as (QuoteProposal & Record<string, unknown>)[]}
            rowKey="id"
            caption="Quotes & Proposals"
            columns={quoteColumns}
            defaultSort={{ key: "createdAt", direction: "desc" }}
            selectable
            itemName={{ one: "quote", other: "quotes" }}
            emptyMessage="No quotes or proposals yet"
          />
        </div>
      )}

      {/* =========================================================================
          ARC UI ANIMATED DIALOG: CREATE QUOTE WITH STEPPER TABS
         ========================================================================= */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent
          title="Create Quote / Proposal"
          description="Draft an interactive estimate linking catalog items, custom terms, and live inventory reservation."
          className="!max-w-[720px]"
        >
          <div className="pt-2">
            {/* ARC UI STEPPER: TAB NAVIGATION */}
            <div className="mb-6 pt-1 pb-4 border-b border-black/5">
              <Stepper
                steps={quoteSteps}
                current={quoteStep}
                onStepSelect={(idx) => {
                  if (idx > quoteStep) {
                    if (quoteStep === 0 && !isStep0Valid) {
                      if (!attemptedSteps.includes(0)) setAttemptedSteps((prev) => [...prev, 0]);
                      showToast("Please complete client details first.");
                      return;
                    }
                    if (quoteStep === 1 && !isStep1Valid) {
                      if (!attemptedSteps.includes(1)) setAttemptedSteps((prev) => [...prev, 1]);
                      showToast("Please add at least 1 line item.");
                      return;
                    }
                  }
                  playClick();
                  setQuoteStep(idx);
                }}
                details="current"
                className="w-full"
              />
            </div>

            <form onSubmit={handleCreateQuote} className="space-y-4 text-xs">
              <AnimatePresence mode="wait">
                {/* STEP 0: PROPOSAL & CLIENT DETAILS */}
                {quoteStep === 0 && (
                  <motion.div
                    key="step-0"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-slate-700 font-semibold block mb-1.5">
                        Proposal Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Comprehensive Solution & Product Package"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438] focus:outline-none focus:border-[#105F68] focus:bg-white transition-all font-medium"
                      />
                      {attemptedSteps.includes(0) && !title.trim() && (
                        <p className="text-[11px] text-rose-500 mt-1">Please enter a proposal title.</p>
                      )}
                    </div>

                    {/* Client Information */}
                    <div className="p-4 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#105F68]">Client Information</span>
                        {clients.length > 0 && (
                          <select
                            onChange={(e) => handleSelectClient(e.target.value)}
                            defaultValue=""
                            className="text-[11px] px-2.5 py-1 rounded-lg border border-black/10 bg-white text-[#105F68] font-medium hover:border-[#105F68] transition-colors"
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
                          <label className="text-[11px] text-slate-500 block mb-1">Full Name <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Alex Morgan"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs text-[#103438] focus:outline-none focus:border-[#105F68]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 block mb-1">Email Address <span className="text-rose-500">*</span></label>
                          <input
                            type="email"
                            required
                            placeholder="alex@example.com"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs text-[#103438] focus:outline-none focus:border-[#105F68]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 block mb-1">Phone Number</label>
                          <input
                            type="tel"
                            placeholder="+1 555-0199 (Optional)"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs text-[#103438] focus:outline-none focus:border-[#105F68]"
                          />
                        </div>
                      </div>
                      {attemptedSteps.includes(0) && (!clientName.trim() || !clientEmail.trim()) && (
                        <p className="text-[11px] text-rose-500">Please provide both client name and email.</p>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-100/80 flex items-start gap-2.5 text-xs text-[#105F68]">
                      <Sparkles className="w-4 h-4 text-[#105F68] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-xs text-[#105F68]">Interactive Client Experience</p>
                        <p className="text-[11px] text-[#3A9295] mt-0.5">
                          When published, clients view an interactive proposal portal where they can inspect deliverables, select optional add-ons, and e-sign.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 1: LINE ITEMS (PRODUCTS & SERVICES) */}
                {quoteStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-[#105F68] flex items-center gap-1.5 text-xs">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Line Items (Products &amp; Services)</span>
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Search catalog to instantly add deliverables, or create a custom item.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddLineItem}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#105F68]/10 text-[11px] font-semibold text-[#105F68] hover:bg-[#105F68]/20 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Custom Item</span>
                      </button>
                    </div>

                    {/* SINGLE SEARCH / SELECT COMBOBOX BAR AT TOP */}
                    <div className="p-3 rounded-2xl bg-white border border-[#105F68]/20 shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-[#105F68] block">
                          Catalog Search &amp; Quick Add
                        </label>
                        <span className="text-[10px] text-slate-400">
                          {products.length} products • {services.length} services
                        </span>
                      </div>
                      <Combobox
                        options={catalogOptions}
                        value={searchCatalogValue}
                        onValueChange={(val) => {
                          handleAddCatalogItem(val);
                          setSearchCatalogValue("");
                        }}
                        placeholder="Search product or service from catalog to add..."
                        controlClassName="min-h-[38px] py-1 text-xs bg-[#F6FAF9] rounded-xl border-black/10 focus-within:border-[#105F68]"
                      />
                    </div>

                    {/* ADDED LINE ITEMS LIST */}
                    <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                      {lineItems.length === 0 ? (
                        <div className="p-6 text-center rounded-2xl bg-[#F6FAF9] border border-dashed border-black/15 text-xs text-slate-400 space-y-1">
                          <p className="font-medium text-slate-600">No line items added yet.</p>
                          <p className="text-[11px]">Use the search bar above to pick items from your catalog, or click "Add Custom Item".</p>
                        </div>
                      ) : (
                        lineItems.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="p-3 rounded-xl bg-white border border-black/10 space-y-2 shadow-xs transition-all hover:border-black/20"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {item.type === "product" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200/60">
                                    <Package className="w-3 h-3" />
                                    <span>Product</span>
                                  </span>
                                ) : item.type === "service" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-semibold border border-teal-200/60">
                                    <ShoppingBag className="w-3 h-3" />
                                    <span>Service</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                    <FileText className="w-3 h-3" />
                                    <span>Custom</span>
                                  </span>
                                )}
                                <span className="text-[10px] font-medium text-slate-400">
                                  #{idx + 1}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(idx)}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
                                title="Remove Line Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-6">
                                <input
                                  type="text"
                                  required
                                  placeholder="Description / custom name"
                                  value={item.description}
                                  onChange={(e) => {
                                    const updated = [...lineItems];
                                    updated[idx].description = e.target.value;
                                    setLineItems(updated);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#F6FAF9] border border-black/10 text-xs text-[#103438] focus:outline-none focus:border-[#105F68] focus:bg-white"
                                />
                              </div>

                              <div className="col-span-3 flex items-center gap-1">
                                <label className="text-[10px] text-slate-400 shrink-0">Qty:</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const updated = [...lineItems];
                                    updated[idx].quantity = Math.max(1, Number(e.target.value));
                                    setLineItems(updated);
                                  }}
                                  className="w-full px-2 py-1.5 rounded-lg bg-[#F6FAF9] border border-black/10 text-xs font-mono text-[#103438] focus:outline-none focus:border-[#105F68] focus:bg-white"
                                />
                              </div>

                              <div className="col-span-3 flex items-center gap-1">
                                <span className="text-[10px] text-slate-400">{symbol}</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  required
                                  value={item.unitPrice}
                                  onChange={(e) => {
                                    const updated = [...lineItems];
                                    updated[idx].unitPrice = Number(e.target.value);
                                    setLineItems(updated);
                                  }}
                                  className="w-full px-2 py-1.5 rounded-lg bg-[#F6FAF9] border border-black/10 text-xs font-mono text-[#103438] focus:outline-none focus:border-[#105F68] focus:bg-white"
                                />
                              </div>
                            </div>

                            {/* Stock Warning & Subtotal Row */}
                            <div className="flex items-center justify-between text-[10px] px-1 pt-1 border-t border-black/5">
                              {item.type === "product" && item.stockCount != null ? (
                                <span className={item.quantity > item.stockCount ? "text-amber-600 font-semibold" : "text-emerald-700"}>
                                  {item.quantity > item.stockCount
                                    ? `⚠️ Requested ${item.quantity} exceeds available stock of ${item.stockCount} units`
                                    : `✓ In Stock: ${item.stockCount} units available`}
                                </span>
                              ) : (
                                <span className="text-slate-400">Unit: {formatCurrencyRaw(item.unitPrice, currency)}</span>
                              )}
                              <span className="text-[#105F68] font-mono font-semibold">
                                Subtotal: {formatCurrencyRaw(item.quantity * item.unitPrice, currency)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {attemptedSteps.includes(1) && !isStep1Valid && (
                      <p className="text-[11px] text-rose-500">Please provide a description and price for at least one item.</p>
                    )}

                    {/* Subtotal summary card */}
                    <div className="p-3.5 rounded-xl bg-[#F6FAF9] border border-black/5 flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Estimated Items Subtotal:</span>
                      <span className="font-bold text-[#105F68] font-mono text-sm">{formatCurrencyRaw(subtotal, currency)}</span>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: ADD-ONS, TERMS & PAYMENT METHOD */}
                {quoteStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4 max-h-[460px] overflow-y-auto pr-1"
                  >
                    {/* Optional Add-ons */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-[#105F68] block">Optional Upsell Add-ons</span>
                          <p className="text-[11px] text-slate-500">Clients can toggle these optional additions on during proposal review.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddAddOn}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#105F68]/10 text-[11px] font-semibold text-[#105F68] hover:bg-[#105F68]/20 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Option</span>
                        </button>
                      </div>

                      {optionalAddOns.length === 0 ? (
                        <div className="p-3.5 rounded-xl bg-[#F6FAF9] border border-dashed border-black/10 text-center text-slate-400 text-xs">
                          No optional add-ons configured. Click "Add Option" to offer clients additional services.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {optionalAddOns.map((addon, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F6FAF9] border border-black/5">
                              <input
                                type="text"
                                placeholder="e.g. Priority Delivery / Extended Care"
                                value={addon.description}
                                onChange={(e) => {
                                  const updated = [...optionalAddOns];
                                  updated[idx].description = e.target.value;
                                  setOptionalAddOns(updated);
                                }}
                                className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-black/10 text-xs text-[#103438] focus:outline-none focus:border-[#105F68]"
                              />
                              <div className="flex items-center gap-1 w-28 shrink-0">
                                <span className="text-[10px] text-slate-400">{symbol}</span>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="50"
                                  value={addon.price}
                                  onChange={(e) => {
                                    const updated = [...optionalAddOns];
                                    updated[idx].price = Number(e.target.value);
                                    setOptionalAddOns(updated);
                                  }}
                                  className="w-full px-2 py-1.5 rounded-lg bg-white border border-black/10 text-xs font-mono text-[#103438] focus:outline-none focus:border-[#105F68]"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveAddOn(idx)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
                                title="Remove Add-on"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Deposit & Expiration */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F6FAF9] border border-black/5">
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                          Upfront Deposit Due at Signing ({symbol})
                        </label>
                        <p className="text-[10px] text-slate-400 mb-1.5">Hold amount charged when client accepts and signs.</p>
                        <input
                          type="number"
                          min="0"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs font-mono text-[#103438] focus:outline-none focus:border-[#105F68]"
                        />
                      </div>
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                          Proposal Validity (Days)
                        </label>
                        <p className="text-[10px] text-slate-400 mb-1.5">Days before this estimate expires automatically.</p>
                        <input
                          type="number"
                          min="1"
                          value={expiresInDays}
                          onChange={(e) => setExpiresInDays(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs font-mono text-[#103438] focus:outline-none focus:border-[#105F68]"
                        />
                      </div>
                    </div>

                    {/* MANUAL TERMS AND CONDITIONS */}
                    <div className="p-4 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-semibold text-[#105F68] block">
                            Terms &amp; Conditions (Manual &amp; Editable)
                          </label>
                          <p className="text-[10px] text-slate-400">
                            Type custom terms, milestones, cancellation rules, or warranty terms manually for this proposal.
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setTermsAndConditions(
                                "1. Scope: Deliverables correspond strictly to itemized line items.\n2. Validity: Quotation rates remain firm for 14 calendar days from issuance.\n3. Deposit & Settlement: Upfront deposit is due upon signing to reserve specialist scheduling.\n4. Cancellation: Cancellations made under 24 hours prior to scheduled kickoff are subject to deposit forfeiture."
                              )
                            }
                            className="px-2 py-0.5 rounded-md bg-white border border-black/10 text-[10px] text-slate-600 hover:text-[#105F68] cursor-pointer"
                          >
                            Standard
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setTermsAndConditions(
                                "1. Strict 50% Retainer: Work commences solely upon settlement confirmation.\n2. Non-Refundable Deposit: Upfront deposit covers allocated specialist slots and reserved inventory.\n3. Change Orders: Any alterations to deliverables will be billed separately."
                              )
                            }
                            className="px-2 py-0.5 rounded-md bg-white border border-black/10 text-[10px] text-slate-600 hover:text-[#105F68] cursor-pointer"
                          >
                            Strict
                          </button>
                          <button
                            type="button"
                            onClick={() => setTermsAndConditions("")}
                            className="px-2 py-0.5 rounded-md bg-white border border-black/10 text-[10px] text-slate-400 hover:text-rose-500 cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={4}
                        placeholder="Type terms and conditions manually for this quote..."
                        value={termsAndConditions}
                        onChange={(e) => setTermsAndConditions(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs text-[#103438] leading-relaxed focus:outline-none focus:border-[#105F68]"
                      />
                    </div>

                    {/* SELECT PAYMENT METHOD */}
                    <div className="p-4 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-semibold text-[#105F68] block">
                            Designated Payment Method &amp; Account
                          </label>
                          <p className="text-[10px] text-slate-400">
                            Choose how the client should settle this quote deposit &amp; balance.
                          </p>
                        </div>
                        <Link
                          href="/dashboard/payments"
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[10px] text-[#3A9295] hover:text-[#105F68] hover:underline"
                        >
                          <span>Manage Accounts</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </div>

                      <select
                        value={selectedPaymentAccountId}
                        onChange={(e) => setSelectedPaymentAccountId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs text-[#103438] focus:outline-none focus:border-[#105F68]"
                      >
                        <option value="any">Client's Choice (All Active Channels: Card, Bank, Cash)</option>
                        {paymentAccounts
                          .filter((acc) => acc.isActive)
                          .map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name} ({acc.type === "bank_transfer" ? `${acc.bankName || "Bank"} - ${acc.accountNumber || ""}` : acc.type.replace("_", " ")})
                              {acc.isDefault ? " [Default]" : ""}
                            </option>
                          ))}
                      </select>

                      {/* Selected Account Details Preview */}
                      {(() => {
                        const sel = paymentAccounts.find((a) => a.id === selectedPaymentAccountId);
                        if (!sel) return null;

                        return (
                          <div className="p-3 rounded-xl bg-white border border-[#105F68]/20 space-y-1.5 text-xs shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#105F68] flex items-center gap-1.5">
                                {sel.type === "bank_transfer" ? (
                                  <Landmark className="w-3.5 h-3.5 text-emerald-600" />
                                ) : sel.type === "online_gateway" ? (
                                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                                ) : (
                                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                                )}
                                <span>{sel.name}</span>
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#105F68]/10 text-[#105F68] font-medium capitalize">
                                {sel.type.replace("_", " ")}
                              </span>
                            </div>

                            {sel.type === "bank_transfer" && (
                              <div className="text-[11px] text-slate-600 space-y-0.5 font-mono pt-1 border-t border-black/5">
                                <p>Bank: {sel.bankName} • Branch: {sel.branchName || "Main"}</p>
                                <p>Account Name: {sel.accountName}</p>
                                <p className="font-bold text-[#105F68]">A/C Number: {sel.accountNumber}</p>
                              </div>
                            )}

                            {sel.instructions && (
                              <p className="text-[10px] text-slate-500 italic pt-1 border-t border-black/5">
                                "{sel.instructions}"
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: REVIEW & PUBLISH */}
                {quoteStep === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >
                    {/* Proposal Summary Card */}
                    <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-xs space-y-3">
                      <div className="flex items-start justify-between border-b border-black/5 pb-3">
                        <div>
                          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Proposal Summary</span>
                          <h4 className="text-sm font-semibold text-[#105F68] mt-0.5">{title || "Untitled Proposal"}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{clientName || "Unnamed Client"} • {clientEmail}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Total Base Value</span>
                          <span className="text-lg font-bold text-[#105F68] font-mono">{formatCurrencyRaw(subtotal, currency)}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Line Items Count:</span>
                          <span className="font-medium text-slate-800">{lineItems.length} {lineItems.length === 1 ? "item" : "items"}</span>
                        </div>
                        {optionalAddOns.length > 0 && (
                          <div className="flex justify-between text-slate-600">
                            <span>Optional Add-ons Available:</span>
                            <span className="font-medium text-slate-800">{optionalAddOns.length} {optionalAddOns.length === 1 ? "option" : "options"}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-600">
                          <span>Upfront Deposit Required:</span>
                          <span className="font-mono font-medium text-[#105F68]">{formatCurrencyRaw(depositAmount, currency)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Designated Payment Method:</span>
                          <span className="font-medium text-slate-800">
                            {selectedPaymentAccountId === "any"
                              ? "Client's Choice (All Active Channels)"
                              : paymentAccounts.find((a) => a.id === selectedPaymentAccountId)?.name || "Specific Method"}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Valid Until:</span>
                          <span className="font-medium text-slate-800">
                            {new Date(Date.now() + (Number(expiresInDays) || 14) * 86400000).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })} ({expiresInDays} days)
                          </span>
                        </div>
                        {termsAndConditions.trim() && (
                          <div className="pt-2 border-t border-black/5">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                              Custom Terms &amp; Conditions:
                            </span>
                            <p className="text-[11px] text-slate-600 whitespace-pre-line line-clamp-3 bg-[#F6FAF9] p-2 rounded-lg">
                              {termsAndConditions}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Picker with Arc UI Select */}
                    <div className="p-4 rounded-2xl bg-[#105F68]/10 border border-[#105F68]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <span className="font-semibold text-xs text-[#105F68] block">Publication Status</span>
                        <span className="text-[11px] text-slate-600 block mt-0.5">
                          Choose whether to issue this quote directly to the client or keep as internal draft.
                        </span>
                      </div>
                      <div className="shrink-0 w-full sm:w-auto">
                        <Select
                          value={quoteStatus}
                          onValueChange={(val) => setQuoteStatus(val as "draft" | "sent" | "accepted")}
                          options={[
                            {
                              value: "sent",
                              label: "Send to Client",
                              icon: <Send className="w-3.5 h-3.5 text-[#105F68]" />,
                            },
                            {
                              value: "draft",
                              label: "Internal Draft",
                              icon: <FileText className="w-3.5 h-3.5 text-slate-500" />,
                            },
                            {
                              value: "accepted",
                              label: "Accepted (Deduct Stock Now)",
                              icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
                            },
                          ]}
                          className="w-full sm:w-60"
                          triggerClassName="min-h-[36px] py-1 text-xs bg-white border border-[#105F68]/20 shadow-2xs"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* STEP CONTROLS FOOTER */}
              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100">
                {quoteStep > 0 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2 rounded-full border border-black/10 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                ) : (
                  <DialogClose asChild>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-full border border-black/10 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </DialogClose>
                )}

                <div className="flex items-center gap-2">
                  {quoteStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-5 py-2 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Create &amp; Publish Quote</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={Boolean(deletingQuoteId)} onOpenChange={(open) => { if (!open) setDeletingQuoteId(null); }}>
        <DialogContent
          title="Delete Quote?"
          description="Are you sure you want to remove this proposal? The interactive signing link will no longer function."
        >
          <div className="pt-2 space-y-4">
            <Alert tone="danger" title="Proposal Removal">
              This action cannot be undone.
            </Alert>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <DialogClose asChild>
                <button
                  type="button"
                  className="px-4 py-2 rounded-full text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </DialogClose>
              <button
                type="button"
                onClick={() => deletingQuoteId && handleDeleteQuote(deletingQuoteId)}
                className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
              >
                Delete Quote
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <Toast
            key={notification || "idle"}
            open={Boolean(notification)}
            onOpenChange={(open) => { if (!open) setNotification(null); }}
            title={notification || ""}
            duration={3000}
          />
        </div>
      </div>
    </div>
  );
}
