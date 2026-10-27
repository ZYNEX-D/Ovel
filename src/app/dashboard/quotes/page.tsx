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
  Coins,
  Briefcase,
  Truck,
  Building2,
  MapPin,
  Percent,
  Receipt,
  FileCheck,
  Layers,
  Clock,
  ShieldCheck,
  User
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
  QuoteFulfillmentType,
  ClientProfile,
  ServiceItem,
  ProductItem,
  InvoiceLineItem,
  formatServicePrice,
  convertQuoteToInvoice,
  PaymentCreditTerms,
  calculateDueDate
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
import { RadioCards, type RadioCardOption } from "@/components/arc/radio-cards/radio-cards";

interface LineItemState {
  id: string;
  type: "product" | "service" | "custom";
  itemId?: string;
  description: string;
  unit?: string;
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

  // Quote -> Invoice Conversion Dialog State
  const [convertingQuote, setConvertingQuote] = useState<QuoteProposal | null>(null);
  const [convertCreditTerms, setConvertCreditTerms] = useState<PaymentCreditTerms>("net_30");
  const [convertCreditDays, setConvertCreditDays] = useState<number>(30);
  const [convertInitialPayment, setConvertInitialPayment] = useState<number>(0);
  const [convertPaymentMethod, setConvertPaymentMethod] = useState<string>("Bank Transfer");
  const [convertNotes, setConvertNotes] = useState<string>("");

  // Form State: Proposal Identity & Scope
  const [title, setTitle] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<QuoteFulfillmentType>("project");
  const [requiresScheduling, setRequiresScheduling] = useState(false);
  const [scopeDescription, setScopeDescription] = useState("");

  // Client Details & Autosuggest
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [highlightedClientIndex, setHighlightedClientIndex] = useState(-1);

  const clientSuggestions = useMemo(() => {
    const q = clientName.trim().toLowerCase();
    if (!q) return [];
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    ).slice(0, 6);
  }, [clients, clientName]);

  // Line items & Catalog
  const [searchCatalogValue, setSearchCatalogValue] = useState("");
  const [lineItems, setLineItems] = useState<LineItemState[]>([
    {
      id: "li_init",
      type: "custom",
      description: "Project Deliverable / Consulting Scope",
      unit: "deliverable",
      quantity: 1,
      unitPrice: 250,
    },
  ]);
  const [optionalAddOns, setOptionalAddOns] = useState<{ description: string; price: number }[]>([
    { description: "Priority Expedited Turnaround & Direct Support", price: 150 },
  ]);

  // Financial adjustments
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [depositMode, setDepositMode] = useState<"none" | "percentage" | "fixed" | "full">("percentage");
  const [depositPercentage, setDepositPercentage] = useState<number>(25);
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [expiresInDays, setExpiresInDays] = useState<number>(14);
  const [requireSignature, setRequireSignature] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>("");
  const [selectedPaymentAccountId, setSelectedPaymentAccountId] = useState<string>("any");
  const [termsAndConditions, setTermsAndConditions] = useState<string>(
    "1. Scope: Deliverables correspond strictly to itemized deliverables and project milestones.\n2. Validity: Quotation rates remain firm for 14 calendar days from issuance.\n3. Settlement: Invoicing and payments follow agreed schedule without mandatory calendar appointment.\n4. Revisions: Out-of-scope alterations will be billed under a separate change order."
  );
  const [quoteStatus, setQuoteStatus] = useState<"draft" | "sent" | "accepted">("sent");

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Step Validation & Stepper Config
  const isStep0Valid = Boolean(title.trim() && clientName.trim() && clientEmail.trim());
  const isStep2Valid = lineItems.some(
    (item) => item.description.trim() && Number(item.unitPrice) >= 0 && Number(item.quantity) > 0
  );

  const quoteSteps: StepperStep[] = [
    {
      id: "client",
      label: "Proposal & Client",
      description: "Title, scope & contacts",
      error: attemptedSteps.includes(0) && !isStep0Valid ? "Required fields missing" : undefined,
    },
    {
      id: "model",
      label: "Delivery Model",
      description: "Fulfillment & kickoff slot",
    },
    {
      id: "items",
      label: "Line Items",
      description: "Products, services & units",
      error: attemptedSteps.includes(2) && !isStep2Valid ? "Add at least 1 item" : undefined,
    },
    {
      id: "terms",
      label: "Pricing & Terms",
      description: "Deposit, discounts & account",
    },
    {
      id: "review",
      label: "Review & Publish",
      description: "Summary & publication",
    },
  ];

  const handleOpenCreateModal = () => {
    playClick();
    const nextQtNum = `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setQuoteNumber(nextQtNum);
    setFulfillmentType("project");
    setRequiresScheduling(false);
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
    } else if (quoteStep === 2) {
      if (!isStep2Valid) {
        if (!attemptedSteps.includes(2)) setAttemptedSteps((prev) => [...prev, 2]);
        showToast("Please add at least one line item with a description.");
        return;
      }
    }
    playClick();
    setQuoteStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    playClick();
    setQuoteStep((prev) => Math.max(prev - 1, 0));
  };

  // Financial Computations
  const itemsSubtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + (Number(item.quantity || 1) * (Number(item.unitPrice) || 0)), 0);
  }, [lineItems]);

  const discountAmount = useMemo(() => {
    if (discountType === "percentage") {
      return (itemsSubtotal * (Number(discountValue) || 0)) / 100;
    }
    return Math.min(Number(discountValue) || 0, itemsSubtotal);
  }, [itemsSubtotal, discountType, discountValue]);

  const taxableAmount = Math.max(0, itemsSubtotal - discountAmount);
  const taxAmount = (taxableAmount * (Number(taxRate) || 0)) / 100;
  const totalAmount = taxableAmount + taxAmount;

  const calculatedDeposit = useMemo(() => {
    if (depositMode === "none") return 0;
    if (depositMode === "full") return totalAmount;
    if (depositMode === "percentage") return (totalAmount * (Number(depositPercentage) || 0)) / 100;
    return Math.min(Number(depositAmount) || 0, totalAmount);
  }, [depositMode, totalAmount, depositPercentage, depositAmount]);

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
      handleSelectClientProfile(found);
    }
  };

  const handleSelectClientProfile = (found: ClientProfile) => {
    playSuccess();
    setClientName(found.name);
    setClientEmail(found.email);
    setClientPhone(found.phone || "");
    if (found.formulasOrNotes && !scopeDescription) {
      setScopeDescription(found.formulasOrNotes);
    }
    setShowClientSuggestions(false);
    setHighlightedClientIndex(-1);
  };

  const handleFulfillmentChange = (type: QuoteFulfillmentType) => {
    playClick();
    setFulfillmentType(type);
    if (type === "appointment") {
      setRequiresScheduling(true);
      setTermsAndConditions(
        "1. Scope: Calendar booking reservations and scheduled specialist sessions.\n2. Validity: Quotation rates remain firm for 14 calendar days.\n3. Upfront Deposit: Due upon signing to secure the reserved appointment slot.\n4. Cancellation: Cancellations made under 24 hours prior to scheduled kickoff are subject to deposit forfeiture."
      );
    } else if (type === "delivery") {
      setRequiresScheduling(false);
      setTermsAndConditions(
        "1. Supply & Delivery: Physical goods will be dispatched or prepared for pickup upon order confirmation.\n2. Inspection: Client agrees to inspect received inventory within 48 hours of delivery.\n3. Returns: Return requests for damaged or incorrect items are honored within 7 business days."
      );
    } else if (type === "project") {
      setRequiresScheduling(false);
      setTermsAndConditions(
        "1. Scope: Deliverables correspond strictly to itemized deliverables and project milestones.\n2. Validity: Quotation rates remain firm for 14 calendar days from issuance.\n3. Settlement: Invoicing and payments follow agreed schedule without mandatory calendar appointment.\n4. Revisions: Out-of-scope alterations will be billed under a separate change order."
      );
    } else {
      setRequiresScheduling(false);
      setTermsAndConditions(
        "1. Scope: Deliverables correspond strictly to itemized line items.\n2. Validity: Quotation rates remain firm for 14 calendar days from issuance.\n3. Settlement: Invoicing proceeds upon client digital acceptance."
      );
    }
  };

  const handleAddLineItem = (type: "custom" | "product" | "service" = "custom") => {
    playClick();
    setLineItems([
      ...lineItems,
      {
        id: "li_" + Math.random().toString(36).slice(2, 8),
        type,
        description: "",
        unit: type === "service" ? "hrs" : type === "product" ? "items" : "unit",
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

  const handleAddCatalogItem = (compositeKey: string) => {
    if (!compositeKey) return;
    const [type, id] = compositeKey.split(":");
    if (!type || !id) return;

    if (type === "product") {
      const prod = products.find((p) => p.id === id);
      if (prod) {
        setLineItems((prev) => {
          const isInitialEmpty =
            prev.length === 1 &&
            prev[0].id === "li_init" &&
            prev[0].description === "Project Deliverable / Consulting Scope" &&
            prev[0].unitPrice === 250;
          const base = isInitialEmpty ? [] : prev;
          return [
            ...base,
            {
              id: "li_" + Math.random().toString(36).slice(2, 8),
              type: "product",
              itemId: prod.id,
              description: prod.name,
              unit: "items",
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
            prev[0].description === "Project Deliverable / Consulting Scope" &&
            prev[0].unitPrice === 250;
          const base = isInitialEmpty ? [] : prev;
          return [
            ...base,
            {
              id: "li_" + Math.random().toString(36).slice(2, 8),
              type: "service",
              itemId: srv.id,
              description: srv.name,
              unit: `${srv.durationMinutes}m session`,
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

    const totalCents = Math.round(totalAmount * 100);
    const depositCents = Math.round(calculatedDeposit * 100);

    const formattedLineItems: InvoiceLineItem[] = lineItems
      .filter((item) => item.description.trim())
      .map((item) => ({
        id: item.id,
        type: item.type,
        itemId: item.itemId,
        description: item.unit ? `${item.description} (${item.unit})` : item.description,
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
        quoteNumber: quoteNumber.trim() || `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        fulfillmentType,
        requiresScheduling,
        clientName,
        clientEmail,
        clientPhone,
        clientCompany: clientCompany.trim() || undefined,
        clientAddress: clientAddress.trim() || undefined,
        scopeDescription: scopeDescription.trim() || undefined,
        lineItems: formattedLineItems.length > 0 ? formattedLineItems : [{ description: title, priceCents: totalCents }],
        optionalAddOns: formattedAddOns,
        subtotalCents: Math.round(itemsSubtotal * 100),
        discountCents: Math.round(discountAmount * 100),
        discountPercentage: discountType === "percentage" ? discountValue : undefined,
        taxCents: Math.round(taxAmount * 100),
        taxRate: taxRate > 0 ? taxRate : undefined,
        totalCents,
        depositCents,
        requireDeposit: depositCents > 0,
        requireSignature,
        notes: notes.trim() || undefined,
        termsAndConditions: termsAndConditions.trim() || undefined,
        paymentMethodId: selectedAcc ? selectedAcc.id : undefined,
        paymentMethodName: selectedAcc
          ? selectedAcc.name
          : selectedPaymentAccountId === "any"
            ? "Client's Choice (All Active Channels)"
            : undefined,
        paymentMethodDetails: selectedAcc
          ? selectedAcc.type === "bank_transfer"
            ? `${selectedAcc.bankName || "Bank"} • A/C No: ${selectedAcc.accountNumber || ""} (${selectedAcc.accountName || ""})${selectedAcc.branchName ? ` • ${selectedAcc.branchName}` : ""
            }`
            : selectedAcc.instructions || selectedAcc.type
          : undefined,
        status: quoteStatus,
        expiresAt: expiryDate.toISOString(),
      },
      wsId
    );

    setIsCreateOpen(false);
    // Reset defaults
    setTitle("");
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setClientCompany("");
    setClientAddress("");
    setScopeDescription("");
    setLineItems([
      {
        id: "li_init",
        type: "custom",
        description: "Project Deliverable / Consulting Scope",
        quantity: 1,
        unitPrice: 250,
      },
    ]);
    setOptionalAddOns([{ description: "Priority Expedited Turnaround", price: 150 }]);
    showToast(`Quotation "${title}" created & customized successfully!`);
  };

  const handleOpenConvertDialog = (quote: QuoteProposal) => {
    playClick();
    setConvertingQuote(quote);
    setConvertCreditTerms("net_30");
    setConvertCreditDays(30);
    setConvertInitialPayment((quote.depositCents || 0) / 100);
    setConvertPaymentMethod(quote.paymentMethodName || "Bank Transfer");
    setConvertNotes(`Generated from accepted quotation ${quote.quoteNumber || quote.title}`);
  };

  const handleGenerateInvoiceFromQuote = () => {
    if (!convertingQuote) return;
    playSuccess();
    const created = convertQuoteToInvoice(
      convertingQuote.id,
      {
        creditTerms: convertCreditTerms,
        creditPeriodDays: convertCreditTerms === "custom" ? convertCreditDays : undefined,
        initialPaymentCents: Math.round(Number(convertInitialPayment || 0) * 100),
        initialPaymentMethod: convertPaymentMethod,
        notes: convertNotes,
      },
      wsId
    );
    setConvertingQuote(null);
    if (created) {
      showToast(`Invoice ${created.invoiceNumber} generated! Check Invoices dashboard.`);
    }
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

    // When quotation is accepted, immediately prompt the option to create invoice
    if (nextStatus === "accepted") {
      handleOpenConvertDialog(quote);
    }
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
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-900">{quote.title}</span>
            {quote.quoteNumber && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                {quote.quoteNumber}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span>{quote.lineItems?.length || 0} {quote.lineItems?.length === 1 ? "item" : "items"}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="inline-flex items-center gap-1 font-medium text-[#3A9295]">
              {quote.fulfillmentType === "appointment" ? (
                <>
                  <Calendar className="w-3 h-3 text-[#105F68]" />
                  <span>Appointment</span>
                </>
              ) : quote.fulfillmentType === "delivery" ? (
                <>
                  <Package className="w-3 h-3 text-[#105F68]" />
                  <span>Products / Order</span>
                </>
              ) : quote.fulfillmentType === "project" ? (
                <>
                  <Briefcase className="w-3 h-3 text-[#105F68]" />
                  <span>Project Deliverables</span>
                </>
              ) : (
                <>
                  <FileText className="w-3 h-3 text-[#105F68]" />
                  <span>General</span>
                </>
              )}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "clientName",
      label: "Client & Company",
      sortable: true,
      render: (_val, quote) => (
        <div>
          <div className="text-xs font-semibold text-slate-800">{quote.clientName}</div>
          <div className="text-[11px] text-slate-500">
            {quote.clientCompany ? `${quote.clientCompany} • ` : ""}{quote.clientEmail}
          </div>
        </div>
      ),
    },
    {
      key: "totalCents",
      label: "Total Value",
      sortable: true,
      numeric: true,
      render: (val) => (
        <span className="font-mono font-semibold text-[#103438]">
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
          {Number(val) > 0 ? formatCurrency(Number(val), currency) : "None (0%)"}
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
              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Mark proposal accepted manually"
            >
              <Check className="w-3 h-3" />
              <span>Accept</span>
            </button>
          )}

          {quote.status === "accepted" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenConvertDialog(quote);
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Create invoice for this accepted quotation"
            >
              <Receipt className="w-3 h-3" />
              <span>Create Invoice</span>
            </button>
          )}

          {quote.status === "converted" && (
            <Link
              href="/dashboard/invoices"
              onClick={(e) => e.stopPropagation()}
              className="px-2.5 py-1 rounded-lg bg-[#105F68]/10 text-[#105F68] border border-[#105F68]/20 hover:bg-[#105F68]/15 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="View generated invoice in Invoices"
            >
              <FileCheck className="w-3 h-3 text-[#105F68]" />
              <span>Invoice</span>
            </Link>
          )}

          <Link
            href={`/quote/${quote.id}`}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-slate-400 hover:text-[#105F68] rounded-md transition-colors"
            title="Open Interactive Proposal"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeletingQuoteId(quote.id);
            }}
            className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
            title="Delete Quote"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ], [currency, copiedId]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-['Kaleko_105',sans-serif]">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <div className="fixed top-5 right-5 z-50">
            <Toast title="Quotation Update" description={notification} />
          </div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
              Quotations &amp; Proposals
            </h1>
            <ArcBadge variant="teal" size="xs">
              0% Take-rate
            </ArcBadge>
          </div>
          <p className="text-xs sm:text-sm text-[#3A9295] mt-1 max-w-2xl leading-relaxed">
            Create tailored estimates, contracts, and proposals for appointments, physical wholesale products, retainers, or custom client projects with digital signatures.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs sm:text-sm font-medium tracking-wide transition-all shadow-sm hover:scale-[1.01] cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#63C1BB]" />
          <span>Create New Quotation</span>
        </button>
      </div>

      {/* Quote List presentation with SortableDataTable */}
      {quotes.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3 select-none">
          <img
            src="/animations/emptyfiles.svg"
            alt="No results"
            className="w-32 h-32 mx-auto object-contain pointer-events-none mb-1"
          />
          <h3 className="text-base font-semibold text-slate-800">No Quotes or Proposals Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Draft interactive estimates with select products, services, optional add-ons, or custom terms to send to prospective clients.
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
        <SortableDataTable
          rows={quotes as unknown as (QuoteProposal & Record<string, unknown>)[]}
          rowKey="id"
          caption="Quotes & Proposals"
          columns={quoteColumns}
          defaultSort={{ key: "createdAt", direction: "desc" }}
          selectable
          itemName={{ one: "proposal", other: "proposals" }}
          emptyMessage="No matching proposals found"
        />
      )}

      {/* =========================================================================
          ARC UI MULTI-STEP DIALOG: CREATE & CUSTOMIZE QUOTATION
         ========================================================================= */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent
          title="Create & Customize Quotation"
          description="Customize scope, line items, pricing units, deposit terms, and fulfillment mode."
          size="3xl"
          className="max-w-4xl max-h-[92vh] overflow-y-auto"
          headerExtra={
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#105F68]/10 text-[#105F68] font-bold border border-[#105F68]/20">
              {quoteNumber || "QT-NEW"}
            </span>
          }
        >
          <div className="space-y-6">
            {/* Stepper Navigation */}
            <div className="p-3 sm:p-4 rounded-2xl bg-[#F6FAF9]/80 border border-[#105F68]/15 shadow-2xs">
              <Stepper
                steps={quoteSteps}
                current={quoteStep}
                onStepSelect={(idx) => {
                  if (idx > quoteStep) {
                    if (quoteStep === 0 && !isStep0Valid) {
                      setAttemptedSteps((prev) => [...prev, 0]);
                      showToast("Please complete required proposal & client fields first.");
                      return;
                    }
                    if ((quoteStep === 2 || idx > 2) && !isStep2Valid) {
                      setAttemptedSteps((prev) => [...prev, 2]);
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

            <form onSubmit={handleCreateQuote} className="space-y-6 text-xs sm:text-sm">
              <AnimatePresence mode="wait">
                {/* STEP 0: PROPOSAL PURPOSE & CLIENT DETAILS */}
                {quoteStep === 0 && (
                  <motion.div
                    key="step-0"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-6"
                  >
                    {/* Proposal Title & Number */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Proposal Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Website Overhaul & Digital Commerce Setup"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs sm:text-sm text-[#103438] placeholder:text-slate-400 focus:outline-none focus:border-[#105F68] focus:bg-white transition-all font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Quote Reference / Number
                        </label>
                        <input
                          type="text"
                          value={quoteNumber}
                          onChange={(e) => setQuoteNumber(e.target.value)}
                          placeholder="QT-2026-1001"
                          className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs sm:text-sm font-mono text-[#103438] focus:outline-none focus:border-[#105F68] focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    {/* Scope / Deliverables Executive Summary */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Executive Summary &amp; Scope of Work <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Outline project deliverables, objectives, milestones, or shipment schedule for the client..."
                        value={scopeDescription}
                        onChange={(e) => setScopeDescription(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs sm:text-sm text-[#103438] leading-relaxed focus:outline-none focus:border-[#105F68] focus:bg-white resize-none transition-all placeholder:text-slate-400"
                      />
                    </div>

                    {/* Client Information */}
                    <div className="p-5 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-[#105F68] flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>Client &amp; Organization Details</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          Type full name to search &amp; autofill saved customers
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div className="relative">
                          <label className="text-xs text-slate-600 font-medium block mb-1">
                            Full Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Alex Morgan"
                            value={clientName}
                            onChange={(e) => {
                              setClientName(e.target.value);
                              setShowClientSuggestions(true);
                              setHighlightedClientIndex(-1);
                            }}
                            onFocus={() => {
                              if (clientName.trim() && clientSuggestions.length > 0) {
                                setShowClientSuggestions(true);
                              }
                            }}
                            onBlur={() => {
                              setTimeout(() => setShowClientSuggestions(false), 220);
                            }}
                            onKeyDown={(e) => {
                              if (!showClientSuggestions || clientSuggestions.length === 0) return;
                              if (e.key === "ArrowDown") {
                                e.preventDefault();
                                setHighlightedClientIndex((prev) => (prev + 1) % clientSuggestions.length);
                              } else if (e.key === "ArrowUp") {
                                e.preventDefault();
                                setHighlightedClientIndex((prev) => (prev - 1 + clientSuggestions.length) % clientSuggestions.length);
                              } else if (e.key === "Enter" && highlightedClientIndex >= 0) {
                                e.preventDefault();
                                handleSelectClientProfile(clientSuggestions[highlightedClientIndex]);
                              } else if (e.key === "Escape") {
                                setShowClientSuggestions(false);
                              }
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-xs sm:text-sm text-[#103438] focus:outline-none focus:border-[#105F68] transition-all"
                          />

                          {/* Customer Autosuggest Dropdown */}
                          {showClientSuggestions && clientSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1 overflow-hidden max-h-64 overflow-y-auto animate-in fade-in duration-150">
                              <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-slate-400 tracking-wider flex items-center justify-between border-b border-slate-100 bg-slate-50/70">
                                <span className="flex items-center gap-1.5">
                                  <User className="w-3 h-3 text-[#105F68]" />
                                  <span>Matching Customers</span>
                                </span>
                                <span className="text-[10px] text-[#105F68] font-medium">{clientSuggestions.length} found</span>
                              </div>
                              <div className="py-1">
                                {clientSuggestions.map((c, idx) => {
                                  const isHighlighted = idx === highlightedClientIndex;
                                  const initials = c.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .substring(0, 2)
                                    .toUpperCase();

                                  return (
                                    <div
                                      key={c.id}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelectClientProfile(c);
                                      }}
                                      onMouseEnter={() => setHighlightedClientIndex(idx)}
                                      className={`px-3 py-2 flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                                        isHighlighted ? "bg-[#105F68]/10 text-[#105F68]" : "hover:bg-slate-50 text-slate-800"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-full bg-[#105F68]/15 text-[#105F68] font-bold text-[11px] flex items-center justify-center shrink-0 border border-[#105F68]/20">
                                          {initials}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-semibold truncate leading-tight">{c.name}</p>
                                          <p className="text-[10.5px] text-slate-500 truncate leading-tight mt-0.5">{c.email}</p>
                                        </div>
                                      </div>

                                      <div className="text-right shrink-0">
                                        {c.phone && (
                                          <span className="text-[10.5px] text-slate-500 font-mono block">
                                            {c.phone}
                                          </span>
                                        )}
                                        {c.reliabilityScore ? (
                                          <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                                            {c.reliabilityScore}%
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 font-medium block mb-1">Email Address <span className="text-rose-500">*</span></label>
                          <input
                            type="email"
                            required
                            placeholder="alex@example.com"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-xs sm:text-sm text-[#103438] focus:outline-none focus:border-[#105F68]"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 font-medium block mb-1">Phone Number</label>
                          <input
                            type="tel"
                            placeholder="+1 555-0199"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-xs sm:text-sm text-[#103438] focus:outline-none focus:border-[#105F68]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-black/5">
                        <div>
                          <label className="text-xs text-slate-600 font-medium block mb-1">Company / Studio (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Morgan Creative Ltd."
                            value={clientCompany}
                            onChange={(e) => setClientCompany(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-xs sm:text-sm text-[#103438] focus:outline-none focus:border-[#105F68]"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 font-medium block mb-1">Billing / Delivery Address (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. 100 Main St, Suite 4B, New York, NY"
                            value={clientAddress}
                            onChange={(e) => setClientAddress(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-xs sm:text-sm text-[#103438] focus:outline-none focus:border-[#105F68]"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 1: QUOTATION PURPOSE & DELIVERY MODEL */}
                {quoteStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-6"
                  >
                    <div className="p-5 sm:p-6 rounded-3xl bg-[#F6FAF9]/90 border border-black/5 space-y-5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h3 className="font-semibold text-sm sm:text-base text-[#105F68]">
                            Quotation Purpose &amp; Delivery Model
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            Select what this quote is for so the client proposal behaves correctly.
                          </p>
                        </div>
                        <span className="text-xs font-medium text-slate-500 px-3 py-1 rounded-full bg-white border border-black/10 shadow-2xs">
                          Choose model
                        </span>
                      </div>

                      {/* Delivery Model RadioCards */}
                      <RadioCards
                        aria-label="Quotation purpose and delivery model"
                        name="fulfillmentType"
                        value={fulfillmentType}
                        onValueChange={(val) => handleFulfillmentChange(val as QuoteFulfillmentType)}
                        layout="grid"
                        minColumnWidth={180}
                        options={[
                          {
                            value: "project",
                            label: "Project Scope",
                            description: "Deliverables, phased milestones & contractual work.",
                            meta: "Milestones",
                            icon: <Briefcase className="w-4 h-4" />,
                          },
                          {
                            value: "delivery",
                            label: "Products / Order",
                            description: "Physical goods, equipment & inventory dispatch.",
                            meta: "Physical Supply",
                            icon: <Truck className="w-4 h-4" />,
                          },
                          {
                            value: "appointment",
                            label: "Appointment",
                            description: "Calendar consultation, onboarding or kickoff slot.",
                            meta: "Scheduled Slot",
                            icon: <Calendar className="w-4 h-4" />,
                          },
                          {
                            value: "none",
                            label: "General Agreement",
                            description: "Direct estimate, fast digital review & terms.",
                            meta: "Standard Terms",
                            icon: <FileText className="w-4 h-4" />,
                          },
                        ]}
                      />

                      {/* Interactive Scheduling Toggle - Can be selected & unselected freely */}
                      <div
                        onClick={() => {
                          playClick();
                          setRequiresScheduling((prev) => !prev);
                        }}
                        className={`p-4.5 rounded-2xl  transition-all cursor-pointer flex items-center justify-between gap-4 ${requiresScheduling
                          ? " "
                          : ""
                          }`}
                      >
                        <div className="flex items-center justify-start gap-3">
                          <div
                            className={`p-2 rounded-xl shrink-0 transition-colors ${requiresScheduling ? "bg-[#105F68] text-white" : "bg-slate-100 text-slate-500"
                              }`}
                          >
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="font-semibold text-xs sm:text-sm text-[#105F68] flex items-center gap-2">
                              <span>Require Appointment Kickoff Slot on Acceptance?</span>
                              <ArcBadge variant={requiresScheduling ? "emerald" : "neutral"} size="xs">
                                {requiresScheduling ? "Active" : "Unselected"}
                              </ArcBadge>
                            </div>
                            <p className="text-xs text-slate-500">
                              {requiresScheduling
                                ? "Client will be prompted to pick a calendar appointment slot upon signing."
                                : "No appointment required. Client can review, e-sign, and authorize agreement directly."}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={requiresScheduling}
                          onClick={(e) => {
                            e.stopPropagation();
                            playClick();
                            setRequiresScheduling((prev) => !prev);
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${requiresScheduling ? "bg-[#105F68]" : "bg-slate-200"
                            }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${requiresScheduling ? "translate-x-5" : "translate-x-0"
                              }`}
                          />
                        </button>
                      </div>

                      {/* Helpful Delivery Behavior Info Callout */}
                      <div className="p-3.5 rounded-xl bg-white/80 border border-[#105F68]/10 text-xs text-slate-600 flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#105F68] shrink-0" />
                        <span>
                          {fulfillmentType === "project" && "Project deliverables model: Milestones and deliverables with clear scope acceptance."}
                          {fulfillmentType === "delivery" && "Products & physical goods model: Invoicing and dispatch preparation upon order authorization."}
                          {fulfillmentType === "appointment" && (requiresScheduling ? "Appointment kickoff model: Client selects an onboarding or kickoff time slot right after signing." : "Appointment model (scheduling optional): Client can e-sign immediately; calendar booking can be coordinated later.")}
                          {fulfillmentType === "none" && "General terms model: Fast e-signature and immediate payment processing."}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: LINE ITEMS (PRODUCTS, SERVICES & CUSTOM DELIVERABLES) */}
                {quoteStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-[#105F68] flex items-center gap-2 text-sm">
                          <ShoppingBag className="w-4 h-4" />
                          <span>Line Items &amp; Deliverables</span>
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Quick-add products or services from your catalog, or specify custom line items with unit pricing.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddLineItem("custom")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#105F68]/10 text-xs font-semibold text-[#105F68] hover:bg-[#105F68]/20 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Custom Item</span>
                      </button>
                    </div>

                    {/* Quick Catalog Search */}
                    <div className="p-4 rounded-2xl bg-white border border-[#105F68]/20 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#105F68] block">
                          Catalog Quick Add (Products &amp; Services)
                        </label>
                        <span className="text-xs text-slate-400">
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
                        controlClassName="min-h-[42px] py-1.5 text-xs sm:text-sm bg-[#F6FAF9] rounded-xl border-black/10 focus-within:border-[#105F68]"
                      />
                    </div>

                    {/* Line Items List */}
                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                      {lineItems.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl bg-[#F6FAF9] border border-dashed border-black/15 text-xs text-slate-400 space-y-2">
                          <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-medium text-slate-600 text-sm">No line items added yet.</p>
                          <p className="text-xs">Use the search bar above or click "Add Custom Item" to customize your proposal scope.</p>
                        </div>
                      ) : (
                        <>
                          <div className="hidden sm:grid grid-cols-12 gap-2.5 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            <div className="col-span-5">Item Description</div>
                            <div className="col-span-2">Unit</div>
                            <div className="col-span-2">Quantity</div>
                            <div className="col-span-3 text-right">Unit Price</div>
                          </div>

                          {lineItems.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="p-3.5 sm:p-4 rounded-xl bg-white border border-black/10 space-y-3 shadow-xs transition-all hover:border-black/20"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextType: "custom" | "product" | "service" =
                                        item.type === "custom" ? "product" : item.type === "product" ? "service" : "custom";
                                      const updated = [...lineItems];
                                      updated[idx].type = nextType;
                                      setLineItems(updated);
                                    }}
                                    className="cursor-pointer"
                                    title="Click to toggle type: Custom / Product / Service"
                                  >
                                    {item.type === "product" ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                                        <Package className="w-3.5 h-3.5" />
                                        <span>Product</span>
                                      </span>
                                    ) : item.type === "service" ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                                        <ShoppingBag className="w-3.5 h-3.5" />
                                        <span>Service</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>Custom Item</span>
                                      </span>
                                    )}
                                  </button>
                                  <span className="text-xs font-medium text-slate-400">
                                    Item #{idx + 1}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveLineItem(idx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Remove Line Item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="grid grid-cols-12 gap-2.5 items-center">
                                <div className="col-span-12 sm:col-span-5">
                                  <input
                                    type="text"
                                    required
                                    placeholder="Deliverable or product title"
                                    value={item.description}
                                    onChange={(e) => {
                                      const updated = [...lineItems];
                                      updated[idx].description = e.target.value;
                                      setLineItems(updated);
                                    }}
                                    className="w-full px-3 py-2 rounded-lg bg-[#F6FAF9] border border-black/10 text-xs sm:text-sm text-[#103438] focus:outline-none focus:border-[#105F68] focus:bg-white"
                                  />
                                </div>

                                <div className="col-span-4 sm:col-span-2">
                                  <input
                                    type="text"
                                    placeholder="Unit (e.g. hrs)"
                                    value={item.unit || ""}
                                    onChange={(e) => {
                                      const updated = [...lineItems];
                                      updated[idx].unit = e.target.value;
                                      setLineItems(updated);
                                    }}
                                    className="w-full px-2.5 py-2 rounded-lg bg-[#F6FAF9] border border-black/10 text-xs sm:text-sm text-[#103438] text-center focus:outline-none focus:border-[#105F68] focus:bg-white"
                                  />
                                </div>

                                <div className="col-span-4 sm:col-span-2 flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min="0.1"
                                    step="any"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const updated = [...lineItems];
                                      updated[idx].quantity = Math.max(0.1, Number(e.target.value));
                                      setLineItems(updated);
                                    }}
                                    className="w-full px-2.5 py-2 rounded-lg bg-[#F6FAF9] border border-black/10 text-xs sm:text-sm font-mono text-[#103438] focus:outline-none focus:border-[#105F68] focus:bg-white"
                                  />
                                </div>

                                <div className="col-span-4 sm:col-span-3 flex items-center gap-1.5">
                                  <span className="text-xs text-slate-400 font-semibold">{symbol}</span>
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
                                    className="w-full px-2.5 py-2 rounded-lg bg-[#F6FAF9] border border-black/10 text-xs sm:text-sm font-mono text-[#103438] focus:outline-none focus:border-[#105F68] focus:bg-white"
                                  />
                                </div>
                              </div>

                              {/* Subtotal row */}
                              <div className="flex items-center justify-between text-xs px-1 pt-2 border-t border-black/5">
                                {item.type === "product" && item.stockCount != null ? (
                                  <span className={item.quantity > item.stockCount ? "text-amber-600 font-semibold text-xs inline-flex items-center gap-1" : "text-emerald-700 text-xs inline-flex items-center gap-1"}>
                                    {item.quantity > item.stockCount ? (
                                      <>
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        <span>{item.quantity} exceeds inventory stock ({item.stockCount} available)</span>
                                      </>
                                    ) : (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span>In Stock: {item.stockCount} units available</span>
                                      </>
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-xs">
                                    {formatCurrencyRaw(item.unitPrice, currency)} / {item.unit || "unit"}
                                  </span>
                                )}
                                <span className="text-[#105F68] font-mono font-semibold text-xs sm:text-sm">
                                  Total: {formatCurrencyRaw(item.quantity * item.unitPrice, currency)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    {/* Subtotal summary card */}
                    <div className="p-4 rounded-xl bg-[#F6FAF9] border border-black/5 flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-slate-600 font-medium">Estimated Items Subtotal:</span>
                      <span className="font-bold text-[#105F68] font-mono text-base">{formatCurrencyRaw(itemsSubtotal, currency)}</span>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: PRICING ADJUSTMENTS, ADD-ONS & TERMS */}
                {quoteStep === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-5 max-h-[500px] overflow-y-auto pr-1"
                  >
                    {/* Financial Adjustments: Discount & Tax */}
                    <div className="p-5 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-4">
                      <span className="font-semibold text-xs sm:text-sm text-[#105F68] flex items-center gap-2">
                        <Receipt className="w-4 h-4" />
                        <span>Discounts &amp; Tax Customization</span>
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-slate-600 font-medium block mb-1">
                            Discount ({discountType === "percentage" ? "%" : symbol})
                          </label>
                          <div className="flex items-center gap-2">
                            <select
                              value={discountType}
                              onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
                              className="px-3 py-2 rounded-xl bg-white border border-black/10 text-xs sm:text-sm text-[#103438]"
                            >
                              <option value="percentage">% Percent</option>
                              <option value="fixed">{symbol} Fixed</option>
                            </select>
                            <input
                              type="number"
                              min="0"
                              value={discountValue}
                              onChange={(e) => setDiscountValue(Number(e.target.value))}
                              placeholder="0"
                              className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs sm:text-sm font-mono text-[#103438]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-slate-600 font-medium block mb-1">
                            Tax Rate (%)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={taxRate}
                              onChange={(e) => setTaxRate(Number(e.target.value))}
                              placeholder="0"
                              className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs sm:text-sm font-mono text-[#103438]"
                            />
                            <span className="text-xs text-slate-500 font-mono shrink-0 whitespace-nowrap">
                              Tax: {formatCurrencyRaw(taxAmount, currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Upfront Deposit Mode Customization */}
                    <div className="p-5 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-xs sm:text-sm text-[#105F68] block">
                            Upfront Deposit Due on Signing
                          </span>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Configure how much is required to lock in this proposal.
                          </p>
                        </div>
                        <span className="font-mono font-bold text-[#105F68] text-sm">
                          {formatCurrencyRaw(calculatedDeposit, currency)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setDepositMode("none")}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${depositMode === "none"
                            ? "bg-[#105F68] text-white border-[#105F68] shadow-sm ring-2 ring-[#105F68]/20"
                            : "bg-white text-slate-700 border-black/10 hover:border-[#105F68]/30"
                            }`}
                        >
                          <div className="font-semibold text-xs sm:text-sm">No Deposit</div>
                          <div className={`text-[11px] mt-0.5 ${depositMode === "none" ? "text-white/80" : "text-slate-400"}`}>0% (Invoice later)</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDepositMode("percentage");
                            setDepositPercentage(25);
                          }}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${depositMode === "percentage" && depositPercentage === 25
                            ? "bg-[#105F68] text-white border-[#105F68] shadow-sm ring-2 ring-[#105F68]/20"
                            : "bg-white text-slate-700 border-black/10 hover:border-[#105F68]/30"
                            }`}
                        >
                          <div className="font-semibold text-xs sm:text-sm">25% Retainer</div>
                          <div className={`text-[11px] mt-0.5 ${depositMode === "percentage" && depositPercentage === 25 ? "text-white/80" : "text-slate-400"}`}>Quarter value</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDepositMode("percentage");
                            setDepositPercentage(50);
                          }}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${depositMode === "percentage" && depositPercentage === 50
                            ? "bg-[#105F68] text-white border-[#105F68] shadow-sm ring-2 ring-[#105F68]/20"
                            : "bg-white text-slate-700 border-black/10 hover:border-[#105F68]/30"
                            }`}
                        >
                          <div className="font-semibold text-xs sm:text-sm">50% Half</div>
                          <div className={`text-[11px] mt-0.5 ${depositMode === "percentage" && depositPercentage === 50 ? "text-white/80" : "text-slate-400"}`}>Half upfront</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDepositMode("full")}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${depositMode === "full"
                            ? "bg-[#105F68] text-white border-[#105F68] shadow-sm ring-2 ring-[#105F68]/20"
                            : "bg-white text-slate-700 border-black/10 hover:border-[#105F68]/30"
                            }`}
                        >
                          <div className="font-semibold text-xs sm:text-sm">100% Full</div>
                          <div className={`text-[11px] mt-0.5 ${depositMode === "full" ? "text-white/80" : "text-slate-400"}`}>Full settlement</div>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-black/5">
                        <div>
                          <label className="text-xs text-slate-600 font-medium block mb-1">
                            Custom Deposit Amount ({symbol})
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={depositAmount}
                            onChange={(e) => {
                              setDepositMode("fixed");
                              setDepositAmount(Number(e.target.value));
                            }}
                            className="w-full px-3.5 py-2 rounded-xl bg-white border border-black/10 text-xs sm:text-sm font-mono text-[#103438]"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 font-medium block mb-1">
                            Validity Period (Days)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={expiresInDays}
                            onChange={(e) => setExpiresInDays(Number(e.target.value))}
                            className="w-full px-3.5 py-2 rounded-xl bg-white border border-black/10 text-xs sm:text-sm font-mono text-[#103438]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Optional Add-ons */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-xs sm:text-sm text-[#105F68] block">Optional Upsell Add-ons</span>
                          <p className="text-xs text-slate-500">Clients can toggle these optional additions on during proposal review.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddAddOn}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#105F68]/10 text-xs font-semibold text-[#105F68] hover:bg-[#105F68]/20 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Option</span>
                        </button>
                      </div>

                      {optionalAddOns.length > 0 && (
                        <div className="space-y-2.5">
                          {optionalAddOns.map((addon, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-[#F6FAF9] border border-black/5">
                              <input
                                type="text"
                                placeholder="e.g. Priority Delivery / Extended Care"
                                value={addon.description}
                                onChange={(e) => {
                                  const updated = [...optionalAddOns];
                                  updated[idx].description = e.target.value;
                                  setOptionalAddOns(updated);
                                }}
                                className="flex-1 px-3 py-2 rounded-lg bg-white border border-black/10 text-xs sm:text-sm text-[#103438] focus:outline-none focus:border-[#105F68]"
                              />
                              <div className="flex items-center gap-1.5 w-32 shrink-0">
                                <span className="text-xs text-slate-400 font-semibold">{symbol}</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={addon.price}
                                  onChange={(e) => {
                                    const updated = [...optionalAddOns];
                                    updated[idx].price = Number(e.target.value);
                                    setOptionalAddOns(updated);
                                  }}
                                  className="w-full px-2.5 py-2 rounded-lg bg-white border border-black/10 text-xs sm:text-sm font-mono text-[#103438]"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveAddOn(idx)}
                                className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* E-Signature Requirement Toggle */}
                    <div className="p-4 rounded-xl bg-white border border-black/10 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-xs sm:text-sm text-[#105F68] flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-[#105F68]" />
                          <span>Require Digital E-Signature?</span>
                        </span>
                        <p className="text-xs text-slate-500">
                          When enabled, clients must draw or type an electronic signature to accept.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={requireSignature}
                        onChange={(e) => setRequireSignature(e.target.checked)}
                        className="w-4 h-4 rounded text-[#105F68] accent-[#105F68] cursor-pointer"
                      />
                    </div>

                    {/* Terms & Conditions */}
                    <div className="p-5 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <label className="text-xs sm:text-sm font-semibold text-[#105F68] block">
                            Terms &amp; Conditions (Fully Customizable)
                          </label>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Set contract clauses, milestone timelines, or return and delivery terms.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() =>
                              setTermsAndConditions(
                                "1. Scope: Deliverables correspond strictly to itemized deliverables and project milestones.\n2. Validity: Quotation rates remain firm for 14 calendar days from issuance.\n3. Settlement: Invoicing and payments follow agreed schedule without mandatory calendar appointment.\n4. Revisions: Out-of-scope alterations will be billed under a separate change order."
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-white border border-black/10 text-xs text-slate-600 hover:text-[#105F68] hover:border-[#105F68]/30 transition-colors"
                          >
                            Project
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setTermsAndConditions(
                                "1. Supply & Delivery: Physical goods will be dispatched or prepared for pickup upon order confirmation.\n2. Inspection: Client agrees to inspect received inventory within 48 hours of delivery.\n3. Returns: Return requests for damaged or incorrect items are honored within 7 business days."
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-white border border-black/10 text-xs text-slate-600 hover:text-[#105F68] hover:border-[#105F68]/30 transition-colors"
                          >
                            Supply
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setTermsAndConditions(
                                "1. Scope: Calendar booking reservations and scheduled specialist sessions.\n2. Validity: Quotation rates remain firm for 14 calendar days.\n3. Upfront Deposit: Due upon signing to secure the reserved appointment slot.\n4. Cancellation: Cancellations made under 24 hours prior to scheduled kickoff are subject to deposit forfeiture."
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-white border border-black/10 text-xs text-slate-600 hover:text-[#105F68] hover:border-[#105F68]/30 transition-colors"
                          >
                            Session
                          </button>
                          <button
                            type="button"
                            onClick={() => setTermsAndConditions("")}
                            className="px-2.5 py-1 rounded-lg bg-white border border-black/10 text-xs text-slate-400 hover:text-rose-500 hover:border-rose-300 transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={4}
                        placeholder="Type terms and conditions for this quote..."
                        value={termsAndConditions}
                        onChange={(e) => setTermsAndConditions(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-black/10 text-xs sm:text-sm text-[#103438] leading-relaxed focus:outline-none focus:border-[#105F68]"
                      />
                    </div>

                    {/* Designated Payment Account */}
                    <div className="p-5 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-2">
                      <label className="text-xs sm:text-sm font-semibold text-[#105F68] block">
                        Designated Settlement Account
                      </label>
                      <select
                        value={selectedPaymentAccountId}
                        onChange={(e) => setSelectedPaymentAccountId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-xs sm:text-sm text-[#103438] focus:outline-none focus:border-[#105F68]"
                      >
                        <option value="any">Client's Choice (All Active Channels: Card, Bank, Cash)</option>
                        {paymentAccounts
                          .filter((acc) => acc.isActive)
                          .map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name} ({acc.type.replace("_", " ")})
                            </option>
                          ))}
                      </select>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: REVIEW & PUBLISH */}
                {quoteStep === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-5"
                  >
                    {/* Proposal Summary Card */}
                    <div className="p-5 rounded-2xl bg-white border border-black/10 shadow-xs space-y-4">
                      <div className="flex items-start justify-between border-b border-black/5 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Proposal Summary</span>
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-[#105F68] font-bold">
                              {quoteNumber || "QT-NEW"}
                            </span>
                          </div>
                          <h4 className="text-base font-semibold text-[#105F68] mt-1">{title || "Untitled Proposal"}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {clientName || "Unnamed Client"} {clientCompany ? `(${clientCompany})` : ""} • {clientEmail}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Total Quotation Value</span>
                          <span className="text-xl font-bold text-[#105F68] font-mono">{formatCurrencyRaw(totalAmount, currency)}</span>
                        </div>
                      </div>

                      <div className="space-y-2.5 text-xs sm:text-sm">
                        <div className="flex justify-between text-slate-600">
                          <span>Fulfillment Model:</span>
                          <span className="font-semibold text-[#105F68] capitalize">
                            {fulfillmentType} {requiresScheduling ? "(With Appointment Booking)" : "(No Appointment Required)"}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Line Items:</span>
                          <span className="font-medium text-slate-800">{lineItems.length} items (Subtotal: {formatCurrencyRaw(itemsSubtotal, currency)})</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Discount:</span>
                            <span className="font-medium">-{formatCurrencyRaw(discountAmount, currency)}</span>
                          </div>
                        )}
                        {taxAmount > 0 && (
                          <div className="flex justify-between text-slate-600">
                            <span>Tax ({taxRate}%):</span>
                            <span className="font-medium">{formatCurrencyRaw(taxAmount, currency)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-600 border-t border-black/5 pt-2 font-semibold">
                          <span>Deposit Due on Signing:</span>
                          <span className="font-mono text-[#105F68]">
                            {calculatedDeposit > 0 ? formatCurrencyRaw(calculatedDeposit, currency) : "None (0% Deposit)"}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Digital E-Signature:</span>
                          <span className="font-medium">{requireSignature ? "Required" : "Optional / Instant Confirmation"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Picker with Arc UI Select */}
                    <div className="p-5 rounded-2xl bg-[#105F68]/10 border border-[#105F68]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <span className="font-semibold text-xs sm:text-sm text-[#105F68] block">Publication Status</span>
                        <span className="text-xs text-slate-600 block mt-0.5">
                          Choose whether to issue this quote directly to the client or keep as draft.
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
                              label: "Accepted Directly",
                              icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
                            },
                          ]}
                          className="w-full sm:w-60"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Actions */}
              <div className="pt-4 border-t border-black/10 flex items-center justify-between">
                {quoteStep > 0 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 hover:text-[#105F68] hover:bg-black/5 transition-colors cursor-pointer text-xs sm:text-sm font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                ) : (
                  <DialogClose asChild>
                    <button
                      type="button"
                      className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-xs sm:text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </DialogClose>
                )}

                {quoteStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] text-white font-semibold transition-all shadow-sm cursor-pointer text-xs sm:text-sm"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4 text-[#63C1BB]" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] text-white font-semibold transition-all shadow-sm cursor-pointer text-xs sm:text-sm"
                  >
                    <span>Publish &amp; Issue Quotation</span>
                    <ArrowRight className="w-4 h-4 text-[#63C1BB]" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      {deletingQuoteId && (
        <Dialog open={true} onOpenChange={() => setDeletingQuoteId(null)}>
          <DialogContent title="Delete Proposal" className="max-w-md">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h4 className="font-semibold text-slate-900 text-sm">Delete this quote proposal?</h4>
              </div>
              <p className="text-xs text-slate-500">
                This will permanently remove the proposal and deactivate the interactive client URL.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingQuoteId(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteQuote(deletingQuoteId)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Invoice for Accepted Quotation Modal */}
      {convertingQuote && (
        <Dialog open={true} onOpenChange={() => setConvertingQuote(null)}>
          <DialogContent
            title="Create Invoice from Quotation"
            description="Generate an itemized invoice, define credit payment terms, and record partial/advance deposits."
            size="2xl"
            className="max-w-2xl max-h-[90vh] overflow-y-auto"
            headerExtra={
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                {convertingQuote.quoteNumber || "QT-ACCEPTED"}
              </span>
            }
          >
            <div className="space-y-5 pt-1">
              {/* Proposal Summary Card */}
              <div className="p-4 rounded-2xl bg-[#F6FAF9] border border-[#105F68]/15 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[#103438]">{convertingQuote.title}</h4>
                    <p className="text-xs text-[#3A9295] mt-0.5">
                      Client: <span className="font-medium text-[#103438]">{convertingQuote.clientName}</span> ({convertingQuote.clientEmail})
                    </p>
                  </div>
                  <ArcBadge variant="emerald" size="xs">Accepted</ArcBadge>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#105F68]/10 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Total Value</span>
                    <span className="font-mono font-semibold text-[#103438]">
                      {formatCurrency(convertingQuote.totalCents || 0, currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Deposit Credited</span>
                    <span className="font-mono font-medium text-emerald-700">
                      {formatCurrency(convertingQuote.depositCents || 0, currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Balance Due</span>
                    <span className="font-mono font-semibold text-[#105F68]">
                      {formatCurrency(
                        Math.max(0, (convertingQuote.totalCents || 0) - (convertingQuote.depositCents || 0)),
                        currency
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Credit Period & Payment Terms Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#105F68] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Credit Period &amp; Payment Terms</span>
                  </label>
                  <span className="text-[11px] text-[#3A9295]">
                    Due Date:{" "}
                    <strong className="text-[#103438]">
                      {new Date(
                        calculateDueDate(
                          new Date().toISOString(),
                          convertCreditTerms,
                          convertCreditDays
                        )
                      ).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "due_on_receipt", label: "Due on Receipt", desc: "Immediate payment required" },
                    { id: "net_7", label: "Net 7 Days", desc: "1 week credit" },
                    { id: "net_15", label: "Net 15 Days", desc: "Bi-weekly credit" },
                    { id: "net_30", label: "Net 30 Days", desc: "Standard business credit" },
                    { id: "net_60", label: "Net 60 Days", desc: "Extended 2 months" },
                    { id: "custom", label: "Custom Period", desc: "Custom days schedule" },
                  ].map((term) => {
                    const isSelected = convertCreditTerms === term.id;
                    return (
                      <button
                        key={term.id}
                        type="button"
                        onClick={() => setConvertCreditTerms(term.id as PaymentCreditTerms)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${isSelected
                          ? "bg-[#105F68]/10 border-[#105F68] text-[#103438] ring-1 ring-[#105F68]"
                          : "bg-white border-black/10 hover:border-black/20 text-slate-700"
                          }`}
                      >
                        <div className="text-xs font-semibold">{term.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{term.desc}</div>
                      </button>
                    );
                  })}
                </div>

                {convertCreditTerms === "custom" && (
                  <div className="flex items-center gap-2 pt-1">
                    <label className="text-xs text-slate-600">Custom Credit Days:</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={convertCreditDays}
                      onChange={(e) => setConvertCreditDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 px-2.5 py-1 text-xs border border-black/10 rounded-lg bg-white focus:outline-none focus:border-[#105F68]"
                    />
                    <span className="text-xs text-slate-500">days after issue</span>
                  </div>
                )}
              </div>

              {/* Partial / Advance Payment Recording */}
              <div className="space-y-3 pt-2 border-t border-black/5">
                <label className="text-xs font-semibold text-[#105F68] flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  <span>Initial Partial / Advance Payment</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">
                      Amount Paid Upfront ({symbol})
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-mono">{symbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={(convertingQuote.totalCents || 0) / 100}
                        value={convertInitialPayment}
                        onChange={(e) => setConvertInitialPayment(parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-1.5 text-xs font-mono border border-black/10 rounded-xl bg-white focus:outline-none focus:border-[#105F68]"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Payment Method</label>
                    <select
                      value={convertPaymentMethod}
                      onChange={(e) => setConvertPaymentMethod(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-black/10 rounded-xl bg-white focus:outline-none focus:border-[#105F68]"
                    >
                      <option value="Bank Transfer">Bank Transfer / Wire</option>
                      <option value="Credit Card">Credit Card / POS</option>
                      <option value="Cash">Cash Settlement</option>
                      <option value="Online Gateway">Online Payment Gateway</option>
                      <option value="Cheque">Company Cheque</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-[#105F68] block mb-1">Invoice Notes / Reference</label>
                <input
                  type="text"
                  value={convertNotes}
                  onChange={(e) => setConvertNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-black/10 rounded-xl bg-white focus:outline-none focus:border-[#105F68]"
                  placeholder="Notes for client on invoice statement..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setConvertingQuote(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerateInvoiceFromQuote}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5 text-[#63C1BB]" />
                  <span>Generate Official Invoice</span>
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
