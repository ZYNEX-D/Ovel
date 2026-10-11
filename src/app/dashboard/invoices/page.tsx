"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Check } from "lucide-react";
import { getInvoices, InvoiceRecord } from "@/lib/platform-store";
import { useAudio } from "@/components/AudioController";

export default function DashboardInvoicesPage() {
  const { playSuccess } = useAudio();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);

  useEffect(() => {
    setInvoices(getInvoices());
  }, []);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
            Automated Invoicing &amp; Payouts
          </h1>
          <p className="text-xs text-[#3A9295] mt-1">
            Instant balance settlement with automated deposit crediting. 100% direct merchant payouts.
          </p>
        </div>

        <div className="text-xs text-[#105F68] font-medium bg-[#C8E6E2]/40 px-3 py-1 rounded-full border border-[#9ED5D1]/60">
          Stripe Direct Payouts: 0% Platform Fees
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="p-12 rounded-3xl border border-black/5 bg-white text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#C8E6E2]/40 text-[#105F68] flex items-center justify-center mx-auto">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-base font-light text-[#105F68]">No invoices generated yet</h3>
          <p className="text-xs text-[#3A9295] max-w-md mx-auto">
            Invoices and automated itemized receipts will be logged here as clients reserve appointments and pay balances.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="p-5 rounded-2xl border border-black/5 bg-white shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-[#105F68]">
                    {inv.invoiceNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase bg-[#63C1BB]/20 text-[#105F68]">
                    {inv.status}
                  </span>
                </div>
                <p className="text-[#3A9295] mt-1">
                  Client: <b>{inv.clientName}</b> ({inv.clientEmail})
                </p>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div>
                  <span className="text-[11px] text-[#3A9295] block">
                    Deposit Credited: ${(inv.depositCreditedCents / 100).toFixed(2)}
                  </span>
                  <span className="text-sm font-semibold text-[#105F68] block">
                    Balance Paid: ${(inv.balanceDueCents / 100).toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => {
                    playSuccess();
                    showToast(`Simulated PDF receipt generation for ${inv.invoiceNumber}`);
                  }}
                  className="px-3.5 py-1.5 rounded-full border border-[#105F68]/20 hover:bg-[#105F68]/5 text-[#105F68] transition-all"
                >
                  Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#105F68] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs">
          <Check className="w-4 h-4 text-[#63C1BB]" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}
