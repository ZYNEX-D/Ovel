"use client";

import React, { useState } from "react";
import { Plus, Sparkles, Clock, Check } from "lucide-react";
import { getServices, INITIAL_SERVICES, saveServices, ServiceItem } from "@/lib/platform-store";
import { dollarsToCents } from "@/lib/booking-time";
import { useClientStore } from "@/lib/use-client-store";
import { useAudio } from "@/components/AudioController";

export default function DashboardServicesPage() {
  const { playClick, playSuccess } = useAudio();
  const services = useClientStore(getServices, () => INITIAL_SERVICES);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState(120);
  const [newServiceDeposit, setNewServiceDeposit] = useState(35);
  const [newServiceDuration, setNewServiceDuration] = useState(45);
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = dollarsToCents(Number(newServicePrice));
    const depositCents = dollarsToCents(Number(newServiceDeposit));
    const durationMinutes = Number(newServiceDuration);
    if (!newServiceName || priceCents == null || depositCents == null || depositCents > priceCents) return;
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return;
    playSuccess();

    const newSrv: ServiceItem = {
      id: "srv_" + Date.now().toString(36),
      name: newServiceName,
      description: newServiceDesc || "Custom service treatment.",
      durationMinutes,
      priceCents,
      depositCents,
      bufferAfterMinutes: 15,
      isActive: true,
    };

    saveServices([...services, newSrv]);
    setIsAddServiceOpen(false);
    setNewServiceName("");
    setNewServiceDesc("");
    showToast(`Service "${newSrv.name}" created successfully`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
            Service Catalog &amp; Deposit Guard
          </h1>
          <p className="text-xs text-[#3A9295] mt-1">
            Configure treatment durations, upfront card deposits, and post-service buffer times.
          </p>
        </div>

        <button
          onClick={() => {
            playClick();
            setIsAddServiceOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Service</span>
        </button>
      </div>

      {services.length === 0 ? (
        <div className="p-12 rounded-3xl border border-black/5 bg-white text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#C8E6E2]/40 text-[#105F68] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-light text-[#105F68]">No services in your catalog yet</h3>
          <p className="text-xs text-[#3A9295] max-w-md mx-auto">
            Configure your offerings, upfront deposit requirements, and treatment durations to make them bookable via your Ovelink.
          </p>
          <button
            onClick={() => {
              playClick();
              setIsAddServiceOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Your First Service</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="p-5 rounded-2xl border border-black/5 bg-white flex flex-col justify-between space-y-4 hover:border-[#105F68]/20 transition-all shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium text-[#105F68]">{srv.name}</h4>
                  <span className="text-xs font-mono font-semibold text-[#105F68]">
                    ${(srv.priceCents / 100).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-[#3A9295] mt-1.5 line-clamp-2">{srv.description}</p>
              </div>

              <div className="pt-3 border-t border-black/5 flex items-center justify-between text-xs text-[#3A9295]">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#3A9295]" />
                  <span>{srv.durationMinutes} mins</span>
                </div>
                <span className="text-[11px] font-medium text-[#105F68] bg-[#C8E6E2]/40 px-2.5 py-0.5 rounded-full">
                  ${(srv.depositCents / 100).toFixed(2)} Deposit Req.
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Service Modal */}
      {isAddServiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-[#105F68]/20 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#105F68] text-white flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-light text-[#105F68]">Add Catalog Service</h3>
                <p className="text-xs text-[#3A9295]">Configure price and deposit requirements</p>
              </div>
            </div>

            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="text-xs text-[#3A9295] font-medium block mb-1">Service Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sculpting Face Massage"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                />
              </div>

              <div>
                <label className="text-xs text-[#3A9295] font-medium block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Brief overview..."
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-[#3A9295] font-medium block mb-1">Price ($)</label>
                  <input
                    type="number"
                    min="1"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#3A9295] font-medium block mb-1">Deposit ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={newServiceDeposit}
                    onChange={(e) => setNewServiceDeposit(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#3A9295] font-medium block mb-1">Duration (m)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddServiceOpen(false)}
                  className="px-4 py-2 rounded-full text-xs text-[#3A9295] hover:text-[#105F68]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all"
                >
                  Save to Catalog
                </button>
              </div>
            </form>
          </div>
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
