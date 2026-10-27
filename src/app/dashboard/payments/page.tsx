"use client";

import React, { useState, useCallback } from "react";
import {
  Landmark,
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  Check,
  Copy,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Coins,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  PaymentAccount,
  PaymentMethodType,
  getPaymentAccounts,
  savePaymentAccounts,
  INITIAL_PAYMENT_ACCOUNTS
} from "@/lib/platform-store";
import { useClientStore } from "@/lib/use-client-store";
import { useAuth } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";
import { Dialog, DialogContent, DialogClose } from "@/components/arc/dialog/dialog";
import Toast from "@/components/arc/toast/toast";
import { ArcBadge } from "@/components/ui/ArcBadge";

export default function DashboardPaymentsPage() {
  const { profile } = useAuth();
  const { playClick, playSuccess } = useAudio();
  const wsId = profile?.organizationId || profile?.organizationSlug;

  const readAccounts = useCallback(() => getPaymentAccounts(wsId), [wsId]);
  const accounts = useClientStore(readAccounts, () => INITIAL_PAYMENT_ACCOUNTS);

  // Notifications
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters
  const [activeFilter, setActiveFilter] = useState<"all" | PaymentMethodType>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState<PaymentMethodType>("bank_transfer");
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [branchName, setBranchName] = useState("");
  const [swiftOrRouting, setSwiftOrRouting] = useState("");
  const [gatewayProvider, setGatewayProvider] = useState("Stripe");
  const [instructions, setInstructions] = useState("");

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCopyText = (text: string, id: string) => {
    playClick();
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
    showToast("Copied to clipboard");
  };

  const openCreateModal = () => {
    playClick();
    setEditingAccount(null);
    setName("");
    setType("bank_transfer");
    setIsActive(true);
    setIsDefault(accounts.length === 0);
    setBankName("");
    setAccountName("");
    setAccountNumber("");
    setBranchName("");
    setSwiftOrRouting("");
    setGatewayProvider("Stripe");
    setInstructions("");
    setIsModalOpen(true);
  };

  const openEditModal = (acc: PaymentAccount) => {
    playClick();
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setIsActive(acc.isActive);
    setIsDefault(!!acc.isDefault);
    setBankName(acc.bankName || "");
    setAccountName(acc.accountName || "");
    setAccountNumber(acc.accountNumber || "");
    setBranchName(acc.branchName || "");
    setSwiftOrRouting(acc.swiftOrRouting || "");
    setGatewayProvider(acc.gatewayProvider || "Stripe");
    setInstructions(acc.instructions || "");
    setIsModalOpen(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Please provide an account or method name.");
      return;
    }

    playSuccess();

    let updatedList = [...accounts];

    if (editingAccount) {
      updatedList = updatedList.map((item) => {
        if (item.id === editingAccount.id) {
          return {
            ...item,
            name: name.trim(),
            type,
            isActive,
            isDefault,
            bankName: type === "bank_transfer" ? bankName.trim() : undefined,
            accountName: type === "bank_transfer" ? accountName.trim() : undefined,
            accountNumber: type === "bank_transfer" ? accountNumber.trim() : undefined,
            branchName: type === "bank_transfer" ? branchName.trim() : undefined,
            swiftOrRouting: type === "bank_transfer" ? swiftOrRouting.trim() : undefined,
            gatewayProvider: type === "online_gateway" ? gatewayProvider : undefined,
            instructions: instructions.trim(),
          };
        }
        // If this one is default, unset default on others
        return isDefault ? { ...item, isDefault: false } : item;
      });
      showToast(`Payment method "${name}" updated.`);
    } else {
      const newAcc: PaymentAccount = {
        id: "pm_" + Date.now(),
        name: name.trim(),
        type,
        isActive,
        isDefault,
        bankName: type === "bank_transfer" ? bankName.trim() : undefined,
        accountName: type === "bank_transfer" ? accountName.trim() : undefined,
        accountNumber: type === "bank_transfer" ? accountNumber.trim() : undefined,
        branchName: type === "bank_transfer" ? branchName.trim() : undefined,
        swiftOrRouting: type === "bank_transfer" ? swiftOrRouting.trim() : undefined,
        gatewayProvider: type === "online_gateway" ? gatewayProvider : undefined,
        instructions: instructions.trim(),
        createdAt: new Date().toISOString(),
      };

      if (isDefault) {
        updatedList = updatedList.map((item) => ({ ...item, isDefault: false }));
      }
      updatedList = [newAcc, ...updatedList];
      showToast(`Payment method "${name}" created.`);
    }

    savePaymentAccounts(updatedList, wsId);
    setIsModalOpen(false);
  };

  const handleToggleActive = (id: string) => {
    playClick();
    const updated = accounts.map((item) =>
      item.id === id ? { ...item, isActive: !item.isActive } : item
    );
    savePaymentAccounts(updated, wsId);
    showToast("Status updated.");
  };

  const handleSetDefault = (id: string) => {
    playClick();
    const updated = accounts.map((item) => ({
      ...item,
      isDefault: item.id === id,
      isActive: item.id === id ? true : item.isActive,
    }));
    savePaymentAccounts(updated, wsId);
    showToast("Default settlement account updated.");
  };

  const handleDeleteAccount = (id: string) => {
    playClick();
    const updated = accounts.filter((item) => item.id !== id);
    savePaymentAccounts(updated, wsId);
    setDeletingId(null);
    showToast("Payment account removed.");
  };

  const filteredAccounts = accounts.filter((acc) => {
    if (activeFilter === "all") return true;
    return acc.type === activeFilter;
  });

  const activeCount = accounts.filter((a) => a.isActive).length;
  const bankCount = accounts.filter((a) => a.type === "bank_transfer").length;
  const onlineCount = accounts.filter((a) => a.type === "online_gateway").length;

  return (
    <div className="min-h-screen bg-[#F6FAF9] p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <Toast
          title={notification}
          open={Boolean(notification)}
          onOpenChange={(open) => !open && setNotification(null)}
          duration={3000}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#105F68]/10 text-[#105F68]">
              <Landmark className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-light text-[#103438] tracking-tight">
              Payment Methods &amp; Accounts
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure settlement bank accounts, merchant gateways, and client payment instructions for quotes &amp; invoices.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs sm:text-sm font-medium shadow-md shadow-[#105F68]/15 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Payment Account</span>
        </button>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#105F68]/10 shadow-xs">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-semibold block">
            Configured Accounts
          </span>
          <span className="text-xl sm:text-2xl font-bold text-[#103438] font-mono mt-1 block">
            {accounts.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Total channels</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#105F68]/10 shadow-xs">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-semibold block">
            Active for Clients
          </span>
          <span className="text-xl sm:text-2xl font-bold text-[#105F68] font-mono mt-1 block">
            {activeCount}
          </span>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">Ready for checkout</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#105F68]/10 shadow-xs">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-semibold block">
            Direct Bank Accounts
          </span>
          <span className="text-xl sm:text-2xl font-bold text-[#3A9295] font-mono mt-1 block">
            {bankCount}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Wire &amp; electronic</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#105F68]/10 shadow-xs">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-semibold block">
            Online Gateways
          </span>
          <span className="text-xl sm:text-2xl font-bold text-[#103438] font-mono mt-1 block">
            {onlineCount}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Instant TLS capture</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-black/5 pb-3">
        {[
          { key: "all", label: "All Accounts" },
          { key: "bank_transfer", label: "Direct Bank Transfer" },
          { key: "online_gateway", label: "Online Card Gateway" },
          { key: "cash", label: "Cash / Counter" },
          { key: "custom", label: "Custom Instructions" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              playClick();
              setActiveFilter(tab.key as any);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeFilter === tab.key
                ? "bg-[#105F68] text-white shadow-xs"
                : "bg-white text-slate-600 border border-black/5 hover:border-[#105F68]/30"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Account Cards Grid */}
      {filteredAccounts.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-white border border-dashed border-black/15 space-y-3 select-none">
          <img
            src="/animations/emptyfiles.svg"
            alt="No results"
            className="w-32 h-32 mx-auto object-contain pointer-events-none mb-1"
          />
          <h3 className="text-base font-medium text-[#103438]">No Payment Accounts Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add bank details or payment methods so clients can settle quotation deposits and invoices seamlessly.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#105F68] text-white text-xs font-medium cursor-pointer hover:bg-[#0D4F57] transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Account</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((acc) => {
            const isBank = acc.type === "bank_transfer";
            const isOnline = acc.type === "online_gateway";
            const isCash = acc.type === "cash";

            return (
              <div
                key={acc.id}
                className={`p-5 rounded-3xl bg-white border transition-all duration-200 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md ${
                  acc.isDefault
                    ? "border-[#105F68]/40 ring-2 ring-[#105F68]/10"
                    : "border-black/10"
                } ${!acc.isActive ? "opacity-60 bg-slate-50/50" : ""}`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Icon, Name, Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                          isBank
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : isOnline
                            ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                            : isCash
                            ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                            : "bg-slate-50 text-slate-700 border border-slate-200/60"
                        }`}
                      >
                        {isBank ? (
                          <Landmark className="w-4 h-4" />
                        ) : isOnline ? (
                          <CreditCard className="w-4 h-4" />
                        ) : isCash ? (
                          <Coins className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </span>

                      <div>
                        <h3 className="text-sm font-semibold text-[#103438] line-clamp-1">
                          {acc.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {acc.type.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {acc.isDefault && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#105F68] text-white">
                          Default
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                          acc.isActive
                            ? "bg-emerald-100/80 text-emerald-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {acc.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </div>

                  {/* Body Content based on Type */}
                  {isBank && (
                    <div className="p-3 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-2 text-xs">
                      {acc.bankName && (
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="text-[10px] text-slate-400">Bank:</span>
                          <span className="font-medium text-[#103438] text-right">{acc.bankName}</span>
                        </div>
                      )}
                      {acc.accountName && (
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="text-[10px] text-slate-400">Holder:</span>
                          <span className="font-medium text-[#103438] text-right">{acc.accountName}</span>
                        </div>
                      )}
                      {acc.accountNumber && (
                        <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-black/5">
                          <span className="text-[10px] text-slate-400">A/C No:</span>
                          <div className="flex items-center gap-1 font-mono font-bold text-[#105F68]">
                            <span>{acc.accountNumber}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(acc.accountNumber!, acc.id)}
                              className="p-1 hover:text-[#0D4F57] text-slate-400 cursor-pointer"
                              title="Copy Account Number"
                            >
                              {copiedId === acc.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      {acc.branchName && (
                        <div className="flex justify-between items-center text-slate-500 text-[11px]">
                          <span className="text-[10px] text-slate-400">Branch:</span>
                          <span>{acc.branchName}</span>
                        </div>
                      )}
                      {acc.swiftOrRouting && (
                        <div className="flex justify-between items-center text-slate-500 text-[11px]">
                          <span className="text-[10px] text-slate-400">SWIFT/Branch Code:</span>
                          <span className="font-mono">{acc.swiftOrRouting}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {isOnline && (
                    <div className="p-3 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-[10px] text-slate-400">Gateway:</span>
                        <span className="font-semibold text-blue-700">{acc.gatewayProvider || "Stripe"}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Direct merchant settlement. Card details securely verified with TLS encryption.
                      </p>
                    </div>
                  )}

                  {isCash && (
                    <div className="p-3 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-[10px] text-slate-400">Settlement:</span>
                        <span className="font-medium text-amber-800">Physical Counter / Delivery</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Clients settle invoices upon arrival at your location or upon physical delivery.
                      </p>
                    </div>
                  )}

                  {acc.instructions && (
                    <div className="text-[11px] text-slate-500 italic bg-white/70 p-2 rounded-xl border border-black/5 line-clamp-2">
                      "{acc.instructions}"
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-black/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {!acc.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(acc.id)}
                        className="text-[10px] font-semibold text-[#105F68] hover:text-[#0D4F57] hover:underline cursor-pointer"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(acc.id)}
                      className="text-[10px] text-slate-400 hover:text-slate-700 cursor-pointer ml-1"
                    >
                      {acc.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(acc)}
                      className="p-1.5 text-slate-400 hover:text-[#105F68] rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
                      title="Edit Account"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(acc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
                      title="Delete Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <Dialog open={Boolean(deletingId)} onOpenChange={() => setDeletingId(null)}>
          <DialogContent
            title="Delete Payment Account"
            description="Are you sure you want to remove this payment account? This will not affect previously issued receipts."
            className="sm:max-w-md"
          >
            <div className="flex items-center justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-full border border-black/10 text-xs text-slate-600 hover:bg-black/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAccount(deletingId)}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          title={editingAccount ? "Edit Payment Method" : "Add Payment Method & Account"}
          description="Configure how clients send funds, account bank details, and payment instructions."
          className="sm:max-w-2xl [--dialog-max-width:700px]"
          style={{ ['--dialog-max-width' as string]: '700px' }}
        >
          <form onSubmit={handleSaveAccount} className="space-y-6 pt-1 font-['Kaleko_105',sans-serif]">
            {/* Account Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider block">
                Payment Channel Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { key: "bank_transfer", label: "Bank Transfer", sublabel: "Direct Wire / ACH", icon: Landmark },
                  { key: "online_gateway", label: "Card Gateway", sublabel: "Stripe, PayHere", icon: CreditCard },
                  { key: "cash", label: "Cash / Counter", sublabel: "In-Person, COD", icon: Coins },
                  { key: "custom", label: "Custom", sublabel: "Flexible Terms", icon: FileText },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = type === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        playClick();
                        setType(item.key as PaymentMethodType);
                      }}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#105F68]/10 border-[#105F68] text-[#105F68] ring-1 ring-[#105F68]/30 shadow-xs"
                          : "bg-white border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected ? "bg-[#105F68] text-white" : "bg-slate-100 text-slate-600"}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#105F68]" />}
                      </div>
                      <div>
                        <span className="text-xs font-semibold block leading-tight">{item.label}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{item.sublabel}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider block">
                  Display Label / Account Title *
                </label>
                <span className="text-[11px] text-slate-400">Shown to clients during payment</span>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. Commercial Bank - Colombo Branch, or Stripe Online"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#105F68]/20 focus:border-[#105F68] transition-all"
              />
            </div>

            {/* Bank Specific Fields */}
            {type === "bank_transfer" && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F6FAF9]/80 border border-[#105F68]/15 space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-black/5">
                  <div className="w-6 h-6 rounded-lg bg-[#C8E6E2]/50 text-[#105F68] flex items-center justify-center">
                    <Landmark className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#105F68]">Bank Account Details</h4>
                    <p className="text-[10px] text-[#3A9295]">Used for wire transfers and direct bank remittances</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 block">Bank Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Commercial Bank of Ceylon"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#105F68]/20 focus:border-[#105F68] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 block">Branch Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Colombo City Office"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#105F68]/20 focus:border-[#105F68] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 block">Account Holder / Beneficiary *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ovel Commerce &amp; Wellness"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#105F68]/20 focus:border-[#105F68] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 block">Account Number / IBAN *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 8002938471"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#105F68]/20 focus:border-[#105F68] transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 block">SWIFT / BIC / Routing Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. CCEYLKFX"
                      value={swiftOrRouting}
                      onChange={(e) => setSwiftOrRouting(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#105F68]/20 focus:border-[#105F68] transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Online Gateway Field */}
            {type === "online_gateway" && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F6FAF9]/80 border border-[#105F68]/15 space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-black/5">
                  <div className="w-6 h-6 rounded-lg bg-[#C8E6E2]/50 text-[#105F68] flex items-center justify-center">
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#105F68]">Merchant Gateway</h4>
                    <p className="text-[10px] text-[#3A9295]">Card processing and checkout gateway selection</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 block">Gateway Provider</label>
                  <select
                    value={gatewayProvider}
                    onChange={(e) => setGatewayProvider(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#105F68]/20 focus:border-[#105F68] transition-all cursor-pointer"
                  >
                    <option value="Stripe">Stripe (Global Card Checkout &amp; Apple Pay)</option>
                    <option value="PayHere">PayHere (Sri Lanka / Local Cards &amp; Wallets)</option>
                    <option value="Square">Square</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Other">Other / Custom Gateway</option>
                  </select>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider block">
                  Payment &amp; Remittance Instructions
                </label>
                <span className="text-[11px] text-slate-400">Included on client proposals and invoices</span>
              </div>
              <textarea
                rows={3}
                placeholder="e.g. Please quote your Quote ID on the transfer remarks and email payment slip to billing@yourbusiness.com"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#105F68]/20 focus:border-[#105F68] transition-all leading-relaxed"
              />
            </div>

            {/* Preference Toggle Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                isDefault ? "bg-[#105F68]/5 border-[#105F68]/40" : "bg-white border-slate-200 hover:bg-slate-50"
              }`}>
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-[#105F68] accent-[#105F68] mt-0.5 cursor-pointer shrink-0"
                />
                <div className="text-xs leading-relaxed">
                  <span className="font-semibold text-slate-800 block">Default Settlement Account</span>
                  <span className="text-[11px] text-slate-500">Auto-assigned to new quotes and invoices.</span>
                </div>
              </label>

              <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                isActive ? "bg-[#105F68]/5 border-[#105F68]/40" : "bg-white border-slate-200 hover:bg-slate-50"
              }`}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#105F68] accent-[#105F68] mt-0.5 cursor-pointer shrink-0"
                />
                <div className="text-xs leading-relaxed">
                  <span className="font-semibold text-slate-800 block">Active Status</span>
                  <span className="text-[11px] text-slate-500">Selectable by clients during proposal authorization.</span>
                </div>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-full border border-slate-200 text-xs sm:text-sm text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs sm:text-sm font-semibold tracking-tight shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                {editingAccount ? "Save Changes" : "Create Account"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
