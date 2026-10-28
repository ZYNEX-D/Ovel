"use client";

import React, { useState } from "react";
import { Plus, Trash2, ChevronRight, ChevronDown, Layers, Clock, DollarSign, Shield } from "lucide-react";
import { ServiceSubCategory } from "@/lib/platform-store";
import { dollarsToCents, centsToDollars } from "@/lib/booking-time";

interface SubCategoryManagerProps {
  categories: ServiceSubCategory[];
  onChange: (categories: ServiceSubCategory[]) => void;
  currencySymbol: string;
  depth?: number;
}

export function SubCategoryManager({
  categories,
  onChange,
  currencySymbol,
  depth = 0,
}: SubCategoryManagerProps) {
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string) => {
    setCollapsedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddCategory = () => {
    const newCategory: ServiceSubCategory = {
      id: "sub_" + Math.random().toString(36).slice(2, 9),
      name: `Option / Tier ${categories.length + 1}`,
      pricingType: "fixed",
      priceCents: 450000, // 4,500.00
      durationMinutes: 45,
      durationMode: "fixed",
      depositRequired: false,
      depositCents: 0,
      subCategories: [],
    };
    onChange([...categories, newCategory]);
  };

  const handleUpdateCategory = (index: number, updated: ServiceSubCategory) => {
    const next = [...categories];
    next[index] = updated;
    onChange(next);
  };

  const handleRemoveCategory = (index: number) => {
    const next = categories.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {categories.map((cat, index) => {
        const isCollapsed = Boolean(collapsedNodes[cat.id]);
        const subCount = cat.subCategories?.length || 0;

        return (
          <div
            key={cat.id}
            className={`rounded-2xl border transition-all ${
              depth === 0
                ? "bg-slate-50/80 border-slate-200/90 p-3.5"
                : depth === 1
                ? "bg-white border-[#105F68]/20 p-3 shadow-xs"
                : "bg-[#F6FAF9] border-emerald-200 p-2.5"
            }`}
          >
            {/* Header row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => toggleCollapse(cat.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-[#105F68] transition-colors"
                  title={isCollapsed ? "Expand" : "Collapse"}
                >
                  {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <div className="flex items-center gap-1.5 flex-1 max-w-sm">
                  <Layers className="w-3.5 h-3.5 text-[#105F68] shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="Sub-category or tier name..."
                    value={cat.name}
                    onChange={(e) => handleUpdateCategory(index, { ...cat, name: e.target.value })}
                    className="w-full px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {subCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#105F68]/10 text-[#105F68] font-medium">
                    {subCount} nested {subCount === 1 ? "tier" : "tiers"}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(index)}
                  className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                  title="Remove subcategory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Expanded Body: Pricing, Duration, Deposit, and Nested Children */}
            {!isCollapsed && (
              <div className="mt-3 space-y-3 pt-3 border-t border-slate-200/60">
                {/* Pricing Type & Values */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Pricing Structure
                    </label>
                    <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-slate-200/60 border border-slate-200 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleUpdateCategory(index, { ...cat, pricingType: "fixed" })}
                        className={`py-1 rounded-md font-medium transition-all ${
                          cat.pricingType !== "range"
                            ? "bg-white text-[#105F68] shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Fixed Price
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateCategory(index, {
                            ...cat,
                            pricingType: "range",
                            priceMaxCents: cat.priceMaxCents || Math.round(cat.priceCents * 1.3),
                          })
                        }
                        className={`py-1 rounded-md font-medium transition-all ${
                          cat.pricingType === "range"
                            ? "bg-white text-[#105F68] shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Price Range
                      </button>
                    </div>
                  </div>

                  {cat.pricingType === "range" ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="text-[11px] font-medium text-slate-600 block mb-1">
                          Min ({currencySymbol})
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={centsToDollars(cat.priceCents) || 0}
                          onChange={(e) =>
                            handleUpdateCategory(index, {
                              ...cat,
                              priceCents: dollarsToCents(Number(e.target.value)) ?? 0,
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-[#105F68]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-600 block mb-1">
                          Max ({currencySymbol})
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={centsToDollars(cat.priceMaxCents ?? cat.priceCents) || 0}
                          onChange={(e) =>
                            handleUpdateCategory(index, {
                              ...cat,
                              priceMaxCents: dollarsToCents(Number(e.target.value)) ?? undefined,
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-[#105F68]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        Price ({currencySymbol})
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={centsToDollars(cat.priceCents) || 0}
                        onChange={(e) =>
                          handleUpdateCategory(index, {
                            ...cat,
                            priceCents: dollarsToCents(Number(e.target.value)) ?? 0,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-[#105F68]"
                      />
                    </div>
                  )}
                </div>

                {/* Duration Mode & Minutes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Duration Timing
                    </label>
                    <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-slate-200/60 border border-slate-200 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleUpdateCategory(index, { ...cat, durationMode: "fixed" })}
                        className={`py-1 rounded-md font-medium transition-all ${
                          cat.durationMode !== "around"
                            ? "bg-white text-[#105F68] shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Fixed Time
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateCategory(index, { ...cat, durationMode: "around" })}
                        className={`py-1 rounded-md font-medium transition-all ${
                          cat.durationMode === "around"
                            ? "bg-white text-[#105F68] shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Around (~)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={cat.durationMinutes || 45}
                      onChange={(e) =>
                        handleUpdateCategory(index, {
                          ...cat,
                          durationMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-[#105F68]"
                    />
                  </div>
                </div>

                {/* Deposit Requirement */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Advanced Deposit
                    </label>
                    <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-slate-200/60 border border-slate-200 text-[11px]">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateCategory(index, {
                            ...cat,
                            depositRequired: false,
                            depositCents: 0,
                          })
                        }
                        className={`py-1 rounded-md font-medium transition-all ${
                          !cat.depositRequired
                            ? "bg-white text-[#105F68] shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Not Required
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateCategory(index, {
                            ...cat,
                            depositRequired: true,
                            depositCents: cat.depositCents || Math.round(cat.priceCents * 0.3),
                          })
                        }
                        className={`py-1 rounded-md font-medium transition-all ${
                          cat.depositRequired
                            ? "bg-white text-[#105F68] shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Deposit Required
                      </button>
                    </div>
                  </div>

                  {cat.depositRequired ? (
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        Deposit Hold ({currencySymbol})
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={centsToDollars(cat.depositCents || 0)}
                        onChange={(e) =>
                          handleUpdateCategory(index, {
                            ...cat,
                            depositCents: dollarsToCents(Number(e.target.value)) ?? undefined,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-[#105F68]"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center text-[11px] text-slate-400 italic pt-5">
                      No upfront card hold required for this option
                    </div>
                  )}
                </div>

                {/* Recursive Nested Sub-Categories (Depth limit <= 3) */}
                {depth < 3 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-[#105F68] flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>Nested Sub-Tiers under "{cat.name || 'Tier'}"</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const childNew: ServiceSubCategory = {
                            id: "sub_" + Math.random().toString(36).slice(2, 9),
                            name: `Sub-tier ${(cat.subCategories?.length || 0) + 1}`,
                            pricingType: "fixed",
                            priceCents: cat.priceCents,
                            durationMinutes: cat.durationMinutes,
                            durationMode: cat.durationMode || "fixed",
                            depositRequired: cat.depositRequired || false,
                            depositCents: cat.depositCents || 0,
                            subCategories: [],
                          };
                          handleUpdateCategory(index, {
                            ...cat,
                            subCategories: [...(cat.subCategories || []), childNew],
                          });
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#105F68]/10 text-[#105F68] text-[10px] font-medium hover:bg-[#105F68]/20 transition-all"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Nested Sub-category</span>
                      </button>
                    </div>

                    {cat.subCategories && cat.subCategories.length > 0 ? (
                      <div className="pl-2 border-l-2 border-[#105F68]/30 space-y-2">
                        <SubCategoryManager
                          categories={cat.subCategories}
                          onChange={(nextChildren) =>
                            handleUpdateCategory(index, { ...cat, subCategories: nextChildren })
                          }
                          currencySymbol={currencySymbol}
                          depth={depth + 1}
                        />
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">
                        No nested sub-categories. Click above to add variants, levels, or sub-options.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={handleAddCategory}
        className="w-full py-2.5 rounded-xl border border-dashed border-[#105F68]/40 hover:border-[#105F68] bg-[#105F68]/5 hover:bg-[#105F68]/10 text-[#105F68] text-xs font-medium transition-all flex items-center justify-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add {depth === 0 ? "Sub-Category" : "Nested Sub-Option"}</span>
      </button>
    </div>
  );
}
