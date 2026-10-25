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
  Send
} from "lucide-react";
import { Combobox, ComboboxOption } from "@/components/arc/combobox/combobox";
import { Select } from "@/components/arc/select/select";
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
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "sent" | "draft">("all");
  const [notification, setNotification] = useState<string | null>(null);

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
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
      totalCollected: formatCurrency(totalCollectedCents, currency),
      outstanding: formatCurrency(outstandingCents, currency),
      paidCount,
      sentCount,
      draftCount,
      totalCount: invoices.length,
    };
  }, [invoices, currency]);

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
    const balanceDueCents = Math.round(balanceDue * 100);

    const generatedNumber =
      invoiceNumber.trim() ||
      "INV-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);

    // If paid upon creation, deduct inventory for physical products right now!
    if (status === "paid") {
      deductInventoryForLineItems(lineItems, wsId);
    }

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
          <span className="font-mono font-semibold text-[#105F68]">{inv.invoiceNumber}</span>
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
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (val) => (
        <span className="text-xs text-slate-600">
          {new Date(String(val)).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "balanceDueCents",
      label: "Balance / Paid",
      sortable: true,
      numeric: true,
      render: (_val, inv) => (
        <div className="text-right">
          <div className="font-mono font-semibold text-[#105F68]">
            {formatCurrency(inv.balanceDueCents, currency)}
          </div>
          {inv.depositCreditedCents > 0 && (
            <div className="text-[10px] text-[#3A9295]">
              Deposit: -{formatCurrency(inv.depositCreditedCents, currency)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "paymentMethod",
      label: "Payment Method",
      sortable: true,
      render: (val) => (
        <span className="text-xs text-slate-600">
          {val ? String(val) : "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (_val, inv) => (
        <ArcBadge
          variant={
            inv.status === "paid"
              ? "emerald"
              : inv.status === "sent"
              ? "amber"
              : "neutral"
          }
          size="xs"
        >
          {inv.status === "paid" ? "Paid Sale" : inv.status === "sent" ? "Awaiting Payment" : "Draft"}
        </ArcBadge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_val, inv) => (
        <div className="flex items-center gap-1.5 justify-end">
          {inv.status !== "paid" ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleStatus(inv, "paid");
              }}
              className="px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] transition-all flex items-center gap-1 shadow-xs cursor-pointer"
              title="Mark invoice as settled / paid"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Paid</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleStatus(inv, "sent");
              }}
              className="px-2.5 py-1 rounded-full border border-black/10 hover:bg-black/5 text-[#3A9295] text-[11px] transition-all cursor-pointer"
              title="Mark as awaiting payment"
            >
              Unpaid
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
            className="px-2.5 py-1 rounded-full border border-[#105F68]/20 hover:bg-[#105F68]/5 text-[#105F68] transition-all flex items-center gap-1 text-[11px] font-medium cursor-pointer"
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
      ),
    },
  ], [currency, profile, playSuccess, handleToggleStatus, showToast]);

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
        <DialogContent title="Record Sale / Generate Invoice" className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-black/5 pb-4">
            <div>
              <h2 className="text-xl font-light text-[#105F68]">
                Record Sale / Generate Invoice
              </h2>
              <p className="text-xs text-[#3A9295] mt-0.5">
                Issue a direct sale or generate an itemized invoice with connected catalog items and automated inventory tracking.
              </p>
            </div>
            <DialogClose className="p-2 rounded-full hover:bg-black/5 text-[#3A9295] transition-all">
              <X className="w-5 h-5" />
            </DialogClose>
          </div>

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
                    <option value="Online Checkout">Online Checkout</option>
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
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all shadow-sm"
              >
                Delete Invoice
              </button>
            </div>
          </div>
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
