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
  Package,
  Layers,
  User,
  ArrowUpRight,
  Send,
  Coins,
  Receipt,
  Calendar,
  History,
  AlertTriangle
} from "lucide-react";
import { Combobox, ComboboxOption } from "@/components/arc/combobox/combobox";
import { Select } from "@/components/arc/select/select";
import { 
  getInvoices, 
  INITIAL_INVOICES,
  createInvoice, 
  deleteInvoice, 
  updateInvoiceStatus, 
  recordInvoicePayment,
  calculateDueDate,
  PaymentCreditTerms,
  PaymentEntry,
  getClientProfiles, 
  INITIAL_CLIENT_PROFILES,
  getServices,
  INITIAL_SERVICES,
  getProducts,
  INITIAL_PRODUCTS,
  deductInventoryForLineItems,
  formatServicePrice,
  InvoiceRecord, 
  InvoiceLineItem,
  ClientProfile, 
  ServiceItem,
  ProductItem
} from "@/lib/platform-store";
import { useClientStore } from "@/lib/use-client-store";
import { useAudio } from "@/components/AudioController";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatCurrencyRaw, getCurrencySymbol, DEFAULT_CURRENCY } from "@/lib/currency";
import { getOvelink, PRESET_OVELINKS } from "@/lib/ovelink-store";
import { Dialog, DialogContent, DialogClose } from "@/components/arc/dialog/dialog";
import { ArcBadge } from "@/components/ui/ArcBadge";
import { SortableDataTable, type DataColumn } from "@/components/arc/sortable-data-table/sortable-data-table";

export default function DashboardInvoicesPage() {
  const { profile, isLoading } = useAuth();
  const { playSuccess, playClick } = useAudio();
  const wsId = profile?.organizationId;
  const invoices = useClientStore(() => getInvoices(wsId), () => INITIAL_INVOICES);

  const defaultSlug = profile?.organizationSlug || "my-brand";
  const activeOvelink = useClientStore(
    () => getOvelink(defaultSlug, profile?.organizationName, wsId),
    () => PRESET_OVELINKS[defaultSlug] || PRESET_OVELINKS.leclat
  );
  const currency = activeOvelink?.currency || DEFAULT_CURRENCY;
  const symbol = getCurrencySymbol(currency);
  const clients = useClientStore(() => getClientProfiles(wsId), () => INITIAL_CLIENT_PROFILES);
  const services = useClientStore(() => getServices(wsId), () => INITIAL_SERVICES);
  const products = useClientStore(() => getProducts(wsId), () => INITIAL_PRODUCTS);

  // Modals & UI state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<InvoiceRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "partial" | "sent" | "overdue" | "draft">("all");
  const [notification, setNotification] = useState<string | null>(null);

  // Credit Period & Payment Terms Form State
  const [creditTerms, setCreditTerms] = useState<PaymentCreditTerms>("net_30");
  const [creditPeriodDays, setCreditPeriodDays] = useState<number>(30);

  // Partial Payment Modal State
  const [recordingPaymentInvoice, setRecordingPaymentInvoice] = useState<InvoiceRecord | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>("Bank Transfer");
  const [payDate, setPayDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [payReference, setPayReference] = useState<string>("");
  const [payNote, setPayNote] = useState<string>("");

  // Payment Installment History Modal State
  const [historyInvoice, setHistoryInvoice] = useState<InvoiceRecord | null>(null);

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
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

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [status, setStatus] = useState<"paid" | "sent" | "draft">("paid");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card / Terminal");
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      description: "Standard Consultation & Service Delivery",
      quantity: 1,
      unitPrice: 150,
      priceCents: 15000,
      type: "service",
    },
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
    return lineItems.reduce((acc, curr) => acc + (Number(curr.quantity || 1) * Number(curr.unitPrice || 0)), 0);
  }, [lineItems]);

  const taxAmount = useMemo(() => {
    return Math.round(subtotal * (Number(taxPercent) || 0)) / 100;
  }, [subtotal, taxPercent]);

  const balanceDue = useMemo(() => {
    const deposit = Number(depositCredited) || 0;
    const computed = subtotal - deposit + taxAmount;
    return computed < 0 ? 0 : computed;
  }, [subtotal, depositCredited, taxAmount]);

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

  // Overall Statistics
  const stats = useMemo(() => {
    const totalCollectedCents = invoices.reduce((sum, i) => {
      if (i.status === "paid") {
        return sum + (i.totalCents || (i.subtotalCents + i.taxCents));
      }
      return sum + (i.paidAmountCents || i.depositCreditedCents || 0);
    }, 0);

    const outstandingCents = invoices
      .filter((i) => i.status !== "paid")
      .reduce((sum, i) => sum + (i.balanceDueCents || 0), 0);

    const paidCount = invoices.filter((i) => i.status === "paid").length;
    const partialCount = invoices.filter((i) => i.status === "partial").length;
    const overdueCount = invoices.filter((i) => {
      return (
        i.status !== "paid" &&
        i.dueDate &&
        new Date(i.dueDate).getTime() < Date.now()
      );
    }).length;
    const sentCount = invoices.filter((i) => i.status === "sent").length;
    const draftCount = invoices.filter((i) => i.status === "draft").length;

    return {
      totalCollected: formatCurrency(totalCollectedCents, currency),
      outstanding: formatCurrency(outstandingCents, currency),
      paidCount,
      partialCount,
      overdueCount,
      sentCount,
      draftCount,
      totalCount: invoices.length,
    };
  }, [invoices, currency]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const isOverdue =
        inv.status !== "paid" &&
        inv.dueDate &&
        new Date(inv.dueDate).getTime() < Date.now();

      let matchesStatus = true;
      if (statusFilter === "overdue") {
        matchesStatus = Boolean(isOverdue);
      } else if (statusFilter !== "all") {
        matchesStatus = inv.status === statusFilter;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        inv.clientEmail.toLowerCase().includes(q) ||
        (inv.itemsSummary && inv.itemsSummary.toLowerCase().includes(q)) ||
        (inv.quoteNumber && inv.quoteNumber.toLowerCase().includes(q));

      return matchesStatus && matchesQuery;
    });
  }, [invoices, statusFilter, searchQuery]);

  // Client Selection Autosuggest
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
    setShowClientSuggestions(false);
    setHighlightedClientIndex(-1);
  };

  // Add / Remove line items
  const handleAddLineItem = () => {
    playClick();
    setLineItems([
      ...lineItems,
      {
        description: "",
        quantity: 1,
        unitPrice: 50,
        priceCents: 5000,
        type: "custom",
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    playClick();
    if (lineItems.length <= 1) {
      showToast("Invoice must contain at least one line item.");
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleAddServiceItem = (serviceId: string) => {
    const srv = services.find((s) => s.id === serviceId);
    if (srv) {
      playClick();
      const unitPrice = srv.priceCents / 100;
      setLineItems([
        ...lineItems,
        {
          itemId: srv.id,
          type: "service",
          description: srv.name,
          quantity: 1,
          unitPrice,
          priceCents: srv.priceCents,
        },
      ]);
      showToast(`Added service "${srv.name}" to line items`);
    }
  };

  const handleAddProductItem = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      playClick();
      const unitPrice = prod.priceCents / 100;
      setLineItems([
        ...lineItems,
        {
          itemId: prod.id,
          type: "product",
          description: prod.name + (prod.sku ? ` (${prod.sku})` : ""),
          quantity: 1,
          unitPrice,
          priceCents: prod.priceCents,
        },
      ]);
      showToast(`Added product "${prod.name}" (Stock: ${prod.stockCount})`);
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
      .map((i) => `${(i.quantity ?? 1) > 1 ? `${i.quantity}x ` : ""}${i.description.trim()}`)
      .join(", ");

    const subtotalCents = Math.round(subtotal * 100);
    const depositCreditedCents = Math.round((Number(depositCredited) || 0) * 100);
    const taxCents = Math.round(taxAmount * 100);
    const totalCents = subtotalCents + taxCents;
    const balanceDueCents = Math.max(0, totalCents - depositCreditedCents);

    const generatedNumber =
      invoiceNumber.trim() ||
      "INV-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);

    const issueDate = new Date().toISOString().split("T")[0];
    const computedDueDate = calculateDueDate(issueDate, creditTerms, creditPeriodDays);

    // Initial payments array if deposit or paid
    const initialPayments: PaymentEntry[] = [];
    let initialPaidAmountCents = 0;

    if (status === "paid") {
      deductInventoryForLineItems(lineItems, wsId);
      initialPaidAmountCents = totalCents;
      initialPayments.push({
        id: `pay_${Date.now()}`,
        amountCents: totalCents,
        paidAt: new Date().toISOString(),
        paymentMethod: paymentMethod,
        note: "Full payment upon invoice creation",
      });
    } else if (depositCreditedCents > 0) {
      initialPaidAmountCents = depositCreditedCents;
      initialPayments.push({
        id: `pay_dep_${Date.now()}`,
        amountCents: depositCreditedCents,
        paidAt: new Date().toISOString(),
        paymentMethod: "Deposit / Retainer",
        reference: "Upfront Deposit",
        note: "Initial deposit credited to invoice",
      });
    }

    const finalStatus: InvoiceRecord["status"] =
      status === "paid"
        ? "paid"
        : depositCreditedCents > 0 && balanceDueCents > 0
        ? "partial"
        : status;

    createInvoice(
      {
        bookingId: `manual_${Date.now()}`,
        invoiceNumber: generatedNumber,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        itemsSummary: itemsSummary || "Direct Service Sale",
        lineItems: lineItems.map((item) => ({
          ...item,
          priceCents: Math.round((item.quantity || 1) * (item.unitPrice || 0) * 100),
        })),
        notes: notes.trim() || undefined,
        paymentMethod: status === "paid" ? paymentMethod : undefined,
        subtotalCents,
        depositCreditedCents,
        taxCents,
        taxPercent: Number(taxPercent) || 0,
        totalCents,
        balanceDueCents: status === "paid" ? 0 : balanceDueCents,
        paidAmountCents: initialPaidAmountCents,
        creditTerms,
        creditPeriodDays: creditTerms === "custom" ? creditPeriodDays : undefined,
        issueDate,
        dueDate: computedDueDate,
        payments: initialPayments,
        status: finalStatus,
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
    setCreditTerms("net_30");
    setCreditPeriodDays(30);
    setLineItems([
      {
        description: "Standard Consultation & Service Delivery",
        quantity: 1,
        unitPrice: 150,
        priceCents: 15000,
        type: "service",
      },
    ]);
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

  const handleOpenRecordPayment = (inv: InvoiceRecord) => {
    playClick();
    setRecordingPaymentInvoice(inv);
    const remaining = (inv.balanceDueCents ?? 0) / 100;
    setPayAmount(remaining > 0 ? remaining : 0);
    setPayMethod(inv.paymentMethod || "Bank Wire / Transfer");
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayReference("");
    setPayNote("");
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingPaymentInvoice) return;
    if (payAmount <= 0) {
      showToast("Payment amount must be greater than zero.");
      return;
    }
    playSuccess();
    const amountCents = Math.round(payAmount * 100);
    recordInvoicePayment(
      recordingPaymentInvoice.id,
      {
        amountCents,
        paidAt: new Date(payDate).toISOString(),
        paymentMethod: payMethod,
        reference: payReference.trim() || undefined,
        note: payNote.trim() || undefined,
      },
      wsId
    );
    showToast(`Payment of ${formatCurrency(amountCents, currency)} recorded successfully!`);
    setRecordingPaymentInvoice(null);
  };

  const confirmDelete = () => {
    if (!deletingInvoice) return;
    playClick();
    deleteInvoice(deletingInvoice.id, wsId);
    showToast(`Invoice ${deletingInvoice.invoiceNumber} removed.`);
    setDeletingInvoice(null);
  };

  const invoiceColumns = useMemo<DataColumn<InvoiceRecord & Record<string, unknown>>[]>(() => [
    {
      key: "invoiceNumber",
      label: "Invoice #",
      sortable: true,
      render: (_val, inv) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-semibold text-[#105F68]">{inv.invoiceNumber}</span>
            {inv.quoteNumber && (
              <span className="px-1.5 py-0.2 text-[9px] font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200" title={`Converted from Quote ${inv.quoteNumber}`}>
                Quote
              </span>
            )}
          </div>
          {inv.itemsSummary && (
            <p className="text-[11px] text-slate-500 max-w-xs truncate mt-0.5" title={inv.itemsSummary}>
              {inv.itemsSummary}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "clientName",
      label: "Client",
      sortable: true,
      render: (_val, inv) => (
        <div>
          <div className="text-xs font-semibold text-slate-800">{inv.clientName}</div>
          <div className="text-[11px] text-slate-400">{inv.clientEmail}</div>
        </div>
      ),
    },
    {
      key: "creditTerms",
      label: "Terms & Due Date",
      sortable: true,
      render: (_val, inv) => {
        const isOverdue =
          inv.status !== "paid" &&
          inv.dueDate &&
          new Date(inv.dueDate).getTime() < Date.now();

        const termLabel =
          inv.creditTerms === "due_on_receipt"
            ? "Immediate"
            : inv.creditTerms === "net_7"
            ? "Net 7"
            : inv.creditTerms === "net_15"
            ? "Net 15"
            : inv.creditTerms === "net_30"
            ? "Net 30"
            : inv.creditTerms === "net_60"
            ? "Net 60"
            : inv.creditTerms === "custom"
            ? `${inv.creditPeriodDays || 0} Days`
            : "Net 30";

        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {termLabel}
              </span>
              {isOverdue && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>Overdue</span>
                </span>
              )}
            </div>
            {inv.dueDate ? (
              <p className={`text-[11px] ${isOverdue ? "text-rose-600 font-medium" : "text-slate-500"}`}>
                Due: {new Date(inv.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">
                {new Date(inv.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "balanceDueCents",
      label: "Balance / Paid",
      sortable: true,
      numeric: true,
      render: (_val, inv) => {
        const total = inv.totalCents || (inv.subtotalCents + (inv.taxCents || 0));
        const paid = inv.paidAmountCents || inv.depositCreditedCents || (inv.status === "paid" ? total : 0);
        const balance = inv.status === "paid" ? 0 : (inv.balanceDueCents ?? Math.max(0, total - paid));
        const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : (inv.status === "paid" ? 100 : 0);

        return (
          <div className="text-right space-y-1">
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-[10px] text-slate-400">Due:</span>
              <span className={`font-mono font-semibold ${balance > 0 ? "text-[#105F68]" : "text-emerald-700"}`}>
                {formatCurrency(balance, currency)}
              </span>
            </div>
            <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-500">
              <span>Paid: {formatCurrency(paid, currency)}</span>
              <span>•</span>
              <span>Total: {formatCurrency(total, currency)}</span>
            </div>
            {total > 0 && (
              <div className="w-24 ml-auto bg-slate-100 rounded-full h-1.5 overflow-hidden border border-black/5">
                <div
                  className={`h-full transition-all duration-300 ${
                    percent >= 100 ? "bg-emerald-500" : percent > 0 ? "bg-[#105F68]" : "bg-transparent"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (_val, inv) => {
        const isOverdue =
          inv.status !== "paid" &&
          inv.dueDate &&
          new Date(inv.dueDate).getTime() < Date.now();

        if (inv.status === "paid") {
          return (
            <ArcBadge variant="emerald" size="xs">
              Paid Sale
            </ArcBadge>
          );
        }

        if (isOverdue) {
          return (
            <ArcBadge variant="rose" size="xs">
              Overdue
            </ArcBadge>
          );
        }

        if (inv.status === "partial") {
          return (
            <ArcBadge variant="teal" size="xs">
              Partially Paid
            </ArcBadge>
          );
        }

        if (inv.status === "sent") {
          return (
            <ArcBadge variant="amber" size="xs">
              Awaiting Payment
            </ArcBadge>
          );
        }

        return (
          <ArcBadge variant="neutral" size="xs">
            Draft
          </ArcBadge>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_val, inv) => {
        const isFullyPaid = inv.status === "paid";
        const hasPayments = (inv.payments && inv.payments.length > 0) || (inv.depositCreditedCents && inv.depositCreditedCents > 0);

        return (
          <div className="flex items-center gap-1.5 justify-end">
            {!isFullyPaid && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenRecordPayment(inv);
                }}
                className="px-2.5 py-1 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white font-medium text-[11px] transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                title="Record partial or full payment"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Pay</span>
              </button>
            )}

            {!isFullyPaid ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleStatus(inv, "paid");
                }}
                className="px-2 py-1 rounded-full border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-[11px] font-medium transition-all flex items-center gap-0.5 cursor-pointer"
                title="Quick mark invoice as fully settled"
              >
                <Check className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Settle</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleStatus(inv, "sent");
                }}
                className="px-2 py-1 rounded-full border border-black/10 hover:bg-black/5 text-[#3A9295] text-[11px] transition-all cursor-pointer"
                title="Mark as awaiting payment"
              >
                Unpaid
              </button>
            )}

            {hasPayments && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playClick();
                  setHistoryInvoice(inv);
                }}
                className="p-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                title="View installment & payment history"
              >
                <History className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                playSuccess();
                try {
                  const { generateInvoicePDF } = await import("@/lib/invoice-pdf");
                  await generateInvoicePDF(inv, {
                    name: profile?.organizationName || "Merchant Workspace",
                    email: profile?.email,
                    slug: profile?.organizationSlug || "store",
                    currency,
                  });
                  showToast(`Downloaded official PDF for ${inv.invoiceNumber}`);
                } catch (err: unknown) {
                  showToast(`Failed to generate PDF: ${(err as Error)?.message || "Error"}`);
                }
              }}
              className="px-2 py-1 rounded-full border border-[#105F68]/20 hover:bg-[#105F68]/5 text-[#105F68] transition-all flex items-center gap-1 text-[11px] font-medium cursor-pointer"
              title="Download official PDF statement"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingInvoice(inv);
              }}
              className="p-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition-all cursor-pointer"
              title="Delete Invoice"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
  ], [currency, profile, playSuccess, playClick, handleToggleStatus, handleOpenRecordPayment, showToast]);

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
            Direct Settlement: 0% Platform Fees
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
            {stats.totalCollected}
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
            {stats.outstanding}
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
            Paid ({stats.paidCount})
          </button>
          <button
            onClick={() => setStatusFilter("partial")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === "partial"
                ? "bg-[#105F68] text-white shadow-sm"
                : "text-[#3A9295] hover:bg-[#F6FAF9]"
            }`}
          >
            Partial ({stats.partialCount})
          </button>
          <button
            onClick={() => setStatusFilter("overdue")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === "overdue"
                ? "bg-[#105F68] text-white shadow-sm"
                : "text-[#3A9295] hover:bg-[#F6FAF9]"
            }`}
          >
            Overdue ({stats.overdueCount})
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
        <div className="p-8 sm:p-12 rounded-3xl border border-black/5 bg-white text-center space-y-3 select-none">
          <img
            src="/animations/emptyfiles.svg"
            alt="No results"
            className="w-32 h-32 mx-auto object-contain pointer-events-none mb-1"
          />
          <div>
            <h3 className="text-base font-medium text-[#105F68]">No invoices or sales found</h3>
            <p className="text-xs text-[#3A9295] max-w-md mx-auto mt-1">
              {searchQuery || statusFilter !== "all"
                ? "No records match your active search and filter criteria."
                : "Record immediate sales, itemized client bills, or manual receipts anytime."}
            </p>
          </div>
          <div className="pt-1">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#105F68] text-white text-xs font-medium hover:bg-[#0D4F57] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Invoice / Sale</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-2 sm:p-4 overflow-hidden">
          <SortableDataTable
            rows={filteredInvoices as unknown as (InvoiceRecord & Record<string, unknown>)[]}
            rowKey="id"
            caption="Sales & Invoices"
            columns={invoiceColumns}
            defaultSort={{ key: "createdAt", direction: "desc" }}
            selectable
            itemName={{ one: "invoice", other: "invoices" }}
            emptyMessage="No matching invoices found"
          />
        </div>
      )}

      {/* Manual Creation / Record Sale Arc UI Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent
          title="Record Sale / Generate Invoice"
          description="Issue a direct sale or generate an itemized invoice with connected catalog items and automated inventory tracking."
          size="3xl"
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <form onSubmit={handleCreateInvoice} className="space-y-6 pt-2">
            {/* Type / Status Selector */}
            <div>
              <label className="text-xs font-semibold text-[#105F68] block mb-1">
                Transaction Type &amp; Status
              </label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as "paid" | "sent" | "draft")}
                options={[
                  {
                    value: "sent",
                    label: "Send to Client (Awaiting Pay)",
                    icon: <Send className="w-3.5 h-3.5 text-amber-600" />,
                  },
                  {
                    value: "paid",
                    label: "Paid Sale (Settled & Deduct Stock)",
                    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
                  },
                  {
                    value: "draft",
                    label: "Internal Draft Only",
                    icon: <FileText className="w-3.5 h-3.5 text-slate-500" />,
                  },
                ]}
                className="w-full"
                triggerClassName="min-h-[38px] bg-white border border-[#105F68]/20 shadow-2xs"
              />
            </div>

            {/* Client Information */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#105F68] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Client Details</span>
                </label>
                <span className="text-[11px] text-slate-400 font-normal">
                  Type name to autosuggest saved customers
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Client Full Name *"
                    required
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
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F6FAF9] border border-black/10 focus:border-[#105F68] text-[#105F68] focus:outline-none transition-all"
                  />

                  {/* Customer Autosuggest Dropdown */}
                  {showClientSuggestions && clientSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1 overflow-hidden max-h-64 overflow-y-auto animate-in fade-in duration-150">
                      <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-slate-400 tracking-wider flex items-center justify-between border-b border-slate-100 bg-slate-50/70">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#105F68]" />
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
                                <div className="min-w-0 text-left">
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

            {/* Invoice & Payment / Credit Details */}
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

              {status === "paid" ? (
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
                    <option value="Online Checkout">Online Checkout</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Wire / Transfer">Bank Wire / Transfer</option>
                    <option value="Check / Cheque">Check / Cheque</option>
                    <option value="Gift Card / Voucher">Gift Card / Voucher</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-[#105F68] block mb-1">
                    Credit Period &amp; Payment Terms
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={creditTerms}
                      onChange={(e) => setCreditTerms(e.target.value as PaymentCreditTerms)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-[#F6FAF9] border border-black/10 focus:border-[#105F68] text-[#105F68] focus:outline-none transition-all"
                    >
                      <option value="net_30">Net 30 Days (Standard)</option>
                      <option value="due_on_receipt">Due Upon Receipt (Immediate)</option>
                      <option value="net_7">Net 7 Days</option>
                      <option value="net_15">Net 15 Days</option>
                      <option value="net_60">Net 60 Days</option>
                      <option value="custom">Custom Credit Days</option>
                    </select>

                    {creditTerms === "custom" ? (
                      <input
                        type="number"
                        min="1"
                        max="365"
                        placeholder="Credit Days"
                        value={creditPeriodDays || ""}
                        onChange={(e) => setCreditPeriodDays(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-[#F6FAF9] border border-black/10 focus:border-[#105F68] text-[#105F68] focus:outline-none"
                      />
                    ) : (
                      <div className="px-3 py-2 rounded-xl bg-slate-50 border border-black/5 text-[11px] text-slate-600 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#3A9295]" />
                        <span>
                          Due: {calculateDueDate(new Date().toISOString().split("T")[0], creditTerms, creditPeriodDays)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Line Items & Catalog Quick-Add */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold text-[#105F68] flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Line Items &amp; Catalog Offerings</span>
                </label>
                
                <div className="w-80 max-w-full">
                  <Combobox
                    options={catalogOptions}
                    value=""
                    onValueChange={(val) => {
                      if (!val) return;
                      const [type, id] = val.split(":");
                      if (type === "product") handleAddProductItem(id);
                      else if (type === "service") handleAddServiceItem(id);
                    }}
                    placeholder="Type to filter &amp; insert product or service..."
                    controlClassName="min-h-[34px] py-1 text-xs bg-white rounded-lg border-black/10 shadow-2xs"
                  />
                </div>
              </div>

              {/* Line items table / rows */}
              <div className="space-y-2">
                {lineItems.map((item, index) => {
                  const lineTotal = (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
                  return (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-xl bg-[#F6FAF9] border border-black/5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {item.type === "product" && (
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                              <Package className="w-2.5 h-2.5" /> Product
                            </span>
                          )}
                          {item.type === "service" && (
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <Layers className="w-2.5 h-2.5" /> Service
                            </span>
                          )}
                          {item.type === "custom" && (
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              Custom
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Description of product or service..."
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...lineItems];
                            updated[index].description = e.target.value;
                            setLineItems(updated);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg text-xs bg-white border border-black/10 focus:border-[#105F68] text-[#105F68] focus:outline-none"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="w-16">
                        <label className="text-[10px] text-[#3A9295] block mb-0.5">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity || 1}
                          onChange={(e) => {
                            const updated = [...lineItems];
                            const qty = Math.max(1, parseInt(e.target.value) || 1);
                            updated[index].quantity = qty;
                            updated[index].priceCents = Math.round(qty * (updated[index].unitPrice || 0) * 100);
                            setLineItems(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-white border border-black/10 rounded-lg text-xs text-center focus:outline-none focus:border-[#105F68]"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="w-24">
                        <label className="text-[10px] text-[#3A9295] block mb-0.5">Unit ({symbol})</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice ?? ""}
                          onChange={(e) => {
                            const updated = [...lineItems];
                            const up = parseFloat(e.target.value) || 0;
                            updated[index].unitPrice = up;
                            updated[index].priceCents = Math.round((updated[index].quantity || 1) * up * 100);
                            setLineItems(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-white border border-black/10 rounded-lg text-xs text-right focus:outline-none focus:border-[#105F68]"
                        />
                      </div>

                      {/* Line Total */}
                      <div className="w-24 text-right pt-4 pr-1">
                        <span className="text-xs font-semibold text-[#105F68]">
                          {formatCurrencyRaw(lineTotal, currency)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(index)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all mt-4"
                        title="Remove line item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleAddLineItem}
                className="text-xs text-[#105F68] font-medium hover:underline flex items-center gap-1 mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add custom line item</span>
              </button>
            </div>

            {/* Financial Calculation Adjustments */}
            <div className="p-4 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-[#3A9295]">
                <span>Subtotal:</span>
                <span className="font-semibold text-[#105F68]">{formatCurrencyRaw(subtotal, currency)}</span>
              </div>

              <div className="flex justify-between items-center text-[#3A9295]">
                <span>Deposit Credited / Deduction ({symbol}):</span>
                <div className="relative w-28">
                  <span className="absolute left-3 top-1.5 text-xs text-[#3A9295]">{symbol}</span>
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
                  <span className="text-[#105F68]">+{formatCurrencyRaw(taxAmount, currency)}</span>
                </div>
              )}

              <div className="border-t border-black/5 pt-2 flex justify-between items-center text-sm font-semibold text-[#105F68]">
                <span>{status === "paid" ? "Total Settled Amount:" : "Net Balance Due:"}</span>
                <span className="text-base text-[#105F68] font-bold">
                  {formatCurrencyRaw(balanceDue, currency)}
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
                placeholder="e.g., In-person checkout, client requested email receipt, tracking notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F6FAF9] border border-black/10 focus:border-[#105F68] text-[#105F68] focus:outline-none transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <DialogClose className="px-4 py-2 rounded-full border border-black/10 text-xs font-medium text-[#3A9295] hover:bg-black/5 transition-all">
                Cancel
              </DialogClose>
              <button
                type="submit"
                className="px-6 py-2 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all shadow-sm"
              >
                {status === "paid" ? "Record Paid Sale & Settle" : "Issue Invoice"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Arc UI Dialog */}
      <Dialog open={!!deletingInvoice} onOpenChange={(open) => !open && setDeletingInvoice(null)}>
        <DialogContent title="Delete Invoice Confirmation" className="max-w-md">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                Delete Invoice {deletingInvoice?.invoiceNumber}?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                This will permanently delete this invoice record from your ledger. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <DialogClose className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all">
                Cancel
              </DialogClose>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
              >
                Delete Invoice
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Partial / Full Payment Arc UI Dialog */}
      <Dialog open={!!recordingPaymentInvoice} onOpenChange={(open) => !open && setRecordingPaymentInvoice(null)}>
        <DialogContent
          title="Record Payment / Installment"
          description={`Record a partial or full payment installment for invoice ${recordingPaymentInvoice?.invoiceNumber || ""}`}
          size="lg"
          className="max-w-lg"
        >
          {recordingPaymentInvoice && (
            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 pt-2">
              {/* Financial summary overview */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F6FAF9] to-[#E9F4F2] border border-[#105F68]/15 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Client:</span>
                  <span className="font-semibold text-slate-900">{recordingPaymentInvoice.clientName}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Invoice Total:</span>
                  <span className="font-mono font-medium text-slate-800">
                    {formatCurrency(
                      recordingPaymentInvoice.totalCents ||
                      (recordingPaymentInvoice.subtotalCents + (recordingPaymentInvoice.taxCents || 0)),
                      currency
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Already Paid:</span>
                  <span className="font-mono text-emerald-700">
                    {formatCurrency(
                      recordingPaymentInvoice.paidAmountCents ||
                      recordingPaymentInvoice.depositCreditedCents || 0,
                      currency
                    )}
                  </span>
                </div>
                <div className="border-t border-black/10 pt-2 flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#105F68]">Remaining Balance Due:</span>
                  <span className="font-mono text-sm text-[#105F68]">
                    {formatCurrency(recordingPaymentInvoice.balanceDueCents ?? 0, currency)}
                  </span>
                </div>
              </div>

              {/* Payment Amount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#105F68]">
                    Payment Amount ({symbol}) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setPayAmount((recordingPaymentInvoice.balanceDueCents ?? 0) / 100)}
                    className="text-[11px] text-[#105F68] font-medium hover:underline cursor-pointer"
                  >
                    Pay Remaining in Full
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2 text-xs font-semibold text-[#3A9295]">{symbol}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={((recordingPaymentInvoice.balanceDueCents ?? 0) / 100) || undefined}
                    required
                    value={payAmount || ""}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3.5 py-2 rounded-xl text-xs bg-[#F6FAF9] border border-black/10 focus:border-[#105F68] text-[#105F68] font-mono font-semibold focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter any partial installment amount or the full remaining balance.
                </p>
              </div>

              {/* Payment Date & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#105F68] block mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F6FAF9] border border-black/10 focus:border-[#105F68] text-[#105F68] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#105F68] block mb-1">
                    Payment Method
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F6FAF9] border border-black/10 focus:border-[#105F68] text-[#105F68] focus:outline-none"
                  >
                    <option value="Bank Wire / Transfer">Bank Wire / Transfer</option>
                    <option value="Credit Card / Terminal">Credit Card / Terminal</option>
                    <option value="Cash">Cash</option>
                    <option value="Check / Cheque">Check / Cheque</option>
                    <option value="Online Checkout">Online Checkout</option>
                    <option value="Deposit / Retainer">Deposit / Retainer</option>
                  </select>
                </div>
              </div>

              {/* Reference Number */}
              <div>
                <label className="text-xs font-semibold text-[#105F68] block mb-1">
                  Transaction / Slip Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Bank slip #, Wire ref, Auth code, Cheque #"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F6FAF9] border border-black/10 focus:border-[#105F68] text-[#105F68] focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-[#105F68] block mb-1">
                  Payment Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., 50% upfront project milestone, received via transfer"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F6FAF9] border border-black/10 focus:border-[#105F68] text-[#105F68] focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5">
                <DialogClose className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                  Cancel
                </DialogClose>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Apply Payment</span>
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Installment History Arc UI Dialog */}
      <Dialog open={!!historyInvoice} onOpenChange={(open) => !open && setHistoryInvoice(null)}>
        <DialogContent
          title="Payment &amp; Installment History"
          description={`Audit trail and payment logs for ${historyInvoice?.invoiceNumber || ""}`}
          size="lg"
          className="max-w-lg"
        >
          {historyInvoice && (() => {
            const total = historyInvoice.totalCents || (historyInvoice.subtotalCents + (historyInvoice.taxCents || 0));
            const paid = historyInvoice.paidAmountCents || historyInvoice.depositCreditedCents || (historyInvoice.status === "paid" ? total : 0);
            const balance = historyInvoice.status === "paid" ? 0 : (historyInvoice.balanceDueCents ?? Math.max(0, total - paid));
            const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 100;
            const payments = historyInvoice.payments || [];

            return (
              <div className="space-y-4 pt-2">
                {/* Summary Card with Progress */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-black/5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Payment Status:</span>
                    <ArcBadge
                      variant={
                        historyInvoice.status === "paid"
                          ? "emerald"
                          : historyInvoice.status === "partial"
                          ? "teal"
                          : historyInvoice.status === "overdue"
                          ? "rose"
                          : "amber"
                      }
                      size="xs"
                    >
                      {historyInvoice.status === "paid"
                        ? "Fully Settled"
                        : historyInvoice.status === "partial"
                        ? "Partially Paid"
                        : historyInvoice.status === "overdue"
                        ? "Overdue"
                        : "Awaiting Payment"}
                    </ArcBadge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-black/5">
                    <div>
                      <p className="text-[10px] text-slate-400">Total Billed</p>
                      <p className="font-mono text-xs font-semibold text-slate-800 mt-0.5">
                        {formatCurrency(total, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Paid to Date</p>
                      <p className="font-mono text-xs font-semibold text-emerald-700 mt-0.5">
                        {formatCurrency(paid, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Remaining Due</p>
                      <p className="font-mono text-xs font-semibold text-[#105F68] mt-0.5">
                        {formatCurrency(balance, currency)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                      <span>Collection Progress</span>
                      <span>{percent}% Paid</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${percent >= 100 ? "bg-emerald-500" : "bg-[#105F68]"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Installments List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-[#105F68] flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Recorded Installments ({payments.length})</span>
                  </h4>

                  {payments.length === 0 ? (
                    <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      No individual payments logged yet for this invoice.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {payments.map((p, idx) => (
                        <div
                          key={p.id || idx}
                          className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between text-xs hover:border-[#105F68]/30 transition-all"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">
                                {formatCurrency(p.amountCents, currency)}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                {p.paymentMethod || "Direct Payment"}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>{new Date(p.paidAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                              {p.reference && <span>• Ref: {p.reference}</span>}
                            </div>
                            {p.note && (
                              <p className="text-[11px] text-slate-600 italic">
                                &ldquo;{p.note}&rdquo;
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 text-emerald-600 ml-3">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-black/5">
                  {balance > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setHistoryInvoice(null);
                        handleOpenRecordPayment(historyInvoice);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Record Another Payment</span>
                    </button>
                  ) : (
                    <div className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Invoice is completely settled</span>
                    </div>
                  )}

                  <DialogClose className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                    Close
                  </DialogClose>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

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
