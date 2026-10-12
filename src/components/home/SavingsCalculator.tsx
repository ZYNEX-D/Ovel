"use client";

import { useState } from "react";
import ClickLink from "@/components/home/ClickLink";

export default function SavingsCalculator() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(18000);
  const marketplaceCut = Math.round(monthlyRevenue * 0.2);
  const ovelFlat = 39;
  const monthlySavings = marketplaceCut - ovelFlat;

  return (
    <div className="p-8 sm:p-12 rounded-[2.5rem] bg-white border border-[#105F68]/15 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
      <div className="md:col-span-7 space-y-6">
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs uppercase tracking-wider text-[#3A9295] font-light">
              Monthly Business Revenue:
            </span>
            <span className="text-2xl font-light text-[#105F68]">
              ${monthlyRevenue.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min="3000"
            max="60000"
            step="1000"
            value={monthlyRevenue}
            onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
            className="w-full h-2 bg-[#C8E6E2] rounded-lg appearance-none cursor-pointer accent-[#105F68]"
          />
          <div className="flex justify-between text-[11px] text-[#3A9295] mt-1 font-mono">
            <span>$3,000/mo</span>
            <span>$30,000/mo</span>
            <span>$60,000/mo</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex justify-between text-xs p-3 rounded-xl bg-red-50 text-red-800 border border-red-100">
            <span>Marketplace 20% Take-Rate:</span>
            <span className="font-semibold">-${marketplaceCut.toLocaleString()} / mo</span>
          </div>
          <div className="flex justify-between text-xs p-3 rounded-xl bg-[#C8E6E2]/30 text-[#105F68] border border-[#9ED5D1]/50">
            <span>Ovel Flat Subscription:</span>
            <span className="font-semibold">${ovelFlat}.00 / mo</span>
          </div>
        </div>
      </div>

      <div className="md:col-span-5 p-6 rounded-3xl bg-[#105F68] text-white flex flex-col justify-between text-center space-y-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#C8E6E2] font-light">
            Your Annual Savings
          </span>
          <div className="text-4xl sm:text-5xl font-light text-white my-3">
            ${(monthlySavings * 12).toLocaleString()}
          </div>
          <p className="text-xs text-[#9ED5D1] font-light leading-relaxed">
            That is ${monthlySavings.toLocaleString()} extra in your pocket each month — zero commission taken, ever.
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
