"use client";

import { useState } from "react";
import ClickLink from "@/components/home/ClickLink";
import { formatCurrencyRaw, DEFAULT_CURRENCY, SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/lib/currency";

export default function SavingsCalculator() {
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);
  const isLkr = currency === "LKR";

  // Dynamic slider range based on currency scale
  const [monthlyRevenue, setMonthlyRevenue] = useState(isLkr ? 1500000 : 18000);
  const minRevenue = isLkr ? 200000 : 3000;
  const maxRevenue = isLkr ? 6000000 : 60000;
  const stepRevenue = isLkr ? 50000 : 1000;

  const marketplaceCut = Math.round(monthlyRevenue * 0.2);
  const ovelFlat = isLkr ? 12000 : 39;
  const monthlySavings = Math.max(0, marketplaceCut - ovelFlat);

  const handleCurrencyChange = (newCode: string) => {
    setCurrency(newCode);
    if (newCode === "LKR") {
      setMonthlyRevenue(1500000);
    } else {
      setMonthlyRevenue(18000);
    }
  };

  return (
    <div className="p-8 sm:p-12 rounded-[2.5rem] bg-white border border-[#105F68]/15 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
      <div className="md:col-span-7 space-y-6">
        <div>
          <div className="flex flex-wrap justify-between items-baseline gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-[#3A9295] font-light">
                Monthly Business Revenue:
              </span>
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="bg-[#F6FAF9] border border-black/10 rounded-lg px-2 py-0.5 text-xs text-[#105F68] font-medium focus:outline-none focus:border-[#105F68]"
                aria-label="Currency"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
            <span className="text-2xl font-light text-[#105F68]">
              {formatCurrencyRaw(monthlyRevenue, currency)}
            </span>
          </div>

          <input
            type="range"
            min={minRevenue}
            max={maxRevenue}
            step={stepRevenue}
            value={monthlyRevenue}
            onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
            className="w-full h-2 bg-[#C8E6E2] rounded-lg appearance-none cursor-pointer accent-[#105F68]"
          />
          <div className="flex justify-between text-[11px] text-[#3A9295] mt-1 font-mono">
            <span>{formatCurrencyRaw(minRevenue, currency)}/mo</span>
            <span>{formatCurrencyRaw(Math.round((minRevenue + maxRevenue) / 2), currency)}/mo</span>
            <span>{formatCurrencyRaw(maxRevenue, currency)}/mo</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex justify-between text-xs p-3 rounded-xl bg-red-50 text-red-800 border border-red-100">
            <span>Marketplace 20% Take-Rate:</span>
            <span className="font-semibold">-{formatCurrencyRaw(marketplaceCut, currency)} / mo</span>
          </div>
          <div className="flex justify-between text-xs p-3 rounded-xl bg-[#C8E6E2]/30 text-[#105F68] border border-[#9ED5D1]/50">
            <span>Ovel Flat Subscription:</span>
            <span className="font-semibold">{formatCurrencyRaw(ovelFlat, currency)} / mo</span>
          </div>
        </div>
      </div>

      <div className="md:col-span-5 p-6 rounded-3xl bg-[#105F68] text-white flex flex-col justify-between text-center space-y-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#C8E6E2] font-light">
            Your Annual Savings
          </span>
          <div className="text-3xl sm:text-4xl font-light text-white my-3 break-words">
            {formatCurrencyRaw(monthlySavings * 12, currency)}
          </div>
          <p className="text-xs text-[#9ED5D1] font-light leading-relaxed">
            That is {formatCurrencyRaw(monthlySavings, currency)} extra in your pocket each month — zero commission taken, ever.
          </p>
        </div>
        <ClickLink
          href="/signup"
          className="w-full py-3 rounded-full bg-[#63C1BB] hover:bg-[#3A9295] text-[#103438] hover:text-white text-xs font-medium tracking-tight transition-all shadow-md text-center"
        >
          Start Saving Today
        </ClickLink>
      </div>
    </div>
  );
}
