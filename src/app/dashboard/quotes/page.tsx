"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, ExternalLink } from "lucide-react";
import { getQuotes, QuoteProposal } from "@/lib/platform-store";

export default function DashboardQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteProposal[]>([]);

  useEffect(() => {
    setQuotes(getQuotes());
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
          Interactive Quotes &amp; Proposals Pipeline
        </h1>
        <p className="text-xs text-[#3A9295] mt-1">
          Dynamic quotes auto-convert to confirmed bookings and deposit invoices upon client digital signature.
        </p>
      </div>

      {quotes.length === 0 ? (
        <div className="p-12 rounded-3xl border border-black/5 bg-white text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#C8E6E2]/40 text-[#105F68] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-light text-[#105F68]">No interactive quotes drafted yet</h3>
          <p className="text-xs text-[#3A9295] max-w-md mx-auto">
            Proposals with optional add-on toggles, e-signatures, and auto-deposit collection will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((q) => (
            <div
              key={q.id}
              className="p-6 rounded-3xl border border-black/5 bg-white shadow-sm space-y-3 text-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 className="text-base font-medium text-[#105F68]">{q.title}</h4>
                  <p className="text-[#3A9295]">
                    Client: <b>{q.clientName}</b> ({q.clientEmail})
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-base font-semibold text-[#105F68]">
                    ${(q.totalCents / 100).toFixed(2)}
                  </span>
                  <span
                    className={`block text-[10px] px-2.5 py-0.5 rounded-full mt-1 uppercase font-medium ${
                      q.status === "accepted"
                        ? "bg-[#63C1BB]/20 text-[#105F68]"
                        : "bg-[#C8E6E2]/40 text-[#105F68]"
                    }`}
                  >
                    {q.status}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-black/5">
                <span className="text-[#3A9295]">
                  {q.lineItems.length} line items • Deposit: ${(q.depositCents / 100).toFixed(2)}
                </span>

                <Link
                  href={`/quote/${q.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Interactive Client Proposal</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
