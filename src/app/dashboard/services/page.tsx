"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Plus, Sparkles, Clock, Check, Trash2 } from "lucide-react";
import { getServices, INITIAL_SERVICES, saveServices, ServiceItem } from "@/lib/platform-store";
import { dollarsToCents } from "@/lib/booking-time";
import { useClientStore, useHydrated } from "@/lib/use-client-store";
import { getOvelink, saveOvelink, OvelinkOffering } from "@/lib/ovelink-store";
import { useAudio } from "@/components/AudioController";
import { useAuth } from "@/lib/auth-context";

export default function DashboardServicesPage() {
  const { profile, isLoading } = useAuth();
  const { playClick, playSuccess } = useAudio();
  const hydrated = useHydrated();
  const wsId = profile?.organizationId || profile?.organizationSlug;
  const readServices = useCallback(() => getServices(wsId), [wsId]);
  const services = useClientStore(readServices, () => INITIAL_SERVICES);
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

  // Auto-sync from Ovelink if services catalog is empty for this workspace
  useEffect(() => {
    if (!hydrated) return;
    const currentWs = profile?.organizationId || profile?.organizationSlug;
    const currentSlug = profile?.organizationSlug;
    if (!currentWs && !currentSlug) return;

    if (services.length === 0 && currentSlug) {
      try {
        const ovelink = getOvelink(currentSlug, profile?.organizationName, currentWs);
        if (ovelink?.offerings && ovelink.offerings.length > 0) {
          const seeded: ServiceItem[] = ovelink.offerings.map((o) => ({
            id: o.id,
            name: o.name,
            description: o.description || "Custom service treatment.",
            durationMinutes: o.durationMinutes || 45,
            priceCents: typeof o.priceCents === "number" ? o.priceCents : 0,
            depositCents: typeof o.depositCents === "number" ? o.depositCents : 0,
            bufferAfterMinutes: 15,
            isActive: o.isActive !== false,
          }));
          saveServices(seeded, currentWs);
          if (currentSlug !== currentWs) {
            saveServices(seeded, currentSlug);
          }
        }
      } catch {
        // safe fallback
      }
    }
  }, [hydrated, profile?.organizationId, profile?.organizationSlug, profile?.organizationName, services.length]);

  const handleDeleteService = (serviceId: string, serviceName: string) => {
    playClick();
    const currentWs = profile?.organizationId || profile?.organizationSlug;
    const updated = services.filter((s) => s.id !== serviceId);
    saveServices(updated, currentWs);
    if (profile?.organizationSlug && profile.organizationSlug !== currentWs) {
      saveServices(updated, profile.organizationSlug);
    }
    if (profile?.organizationSlug) {
      try {
        const ovelink = getOvelink(profile.organizationSlug, profile.organizationName, currentWs);
        saveOvelink({
          ...ovelink,
          offerings: (ovelink.offerings || []).filter((o) => o.id !== serviceId),
        });
      } catch {
        // safe fallback
      }
    }
    showToast(`Service removed.`);
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

    const currentWs = profile?.organizationId || profile?.organizationSlug;
    saveServices([...services, newSrv], currentWs);
    if (profile?.organizationSlug && profile.organizationSlug !== currentWs) {
      saveServices([...services, newSrv], profile.organizationSlug);
    }

    // Sync service to Ovelink booking offerings
    if (profile?.organizationSlug) {
      try {
        const ovelink = getOvelink(profile.organizationSlug, profile.organizationName, currentWs);
        const newOff: OvelinkOffering = {
          id: newSrv.id,
          type: "appointment",
          name: newSrv.name,
          description: newSrv.description,
          priceCents: newSrv.priceCents,
          depositCents: newSrv.depositCents,
          durationMinutes: newSrv.durationMinutes,
          requiresTimeSlot: true,
          category: "Services",
          isActive: true,
        };
        const nonDuplicateOfferings = (ovelink.offerings || []).filter(
          (o) => o.id !== newOff.id
        );
        saveOvelink({
          ...ovelink,
          offerings: [...nonDuplicateOfferings, newOff],
        });
      } catch {
        // safe fallback
      }
    }
    setIsAddServiceOpen(false);
    setNewServiceName("");
    setNewServiceDesc("");
    showToast(`Service created.`);
  };

  // Don't render content (or show empty state) until profile has loaded and
  // hydration is complete — avoids the "No services" flash when wsId is still undefined.
  if (!hydrated || (isLoading && !wsId)) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="p-12 rounded-3xl border border-black/5 bg-white text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#105F68]/30 border-t-[#105F68] animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
            Services
          </h1>
          <p className="text-xs text-[#3A9295] mt-1">
            Catalog and deposits.
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
          <h3 className="text-base font-light text-[#105F68]">No services yet</h3>
          <p className="text-xs text-[#3A9295] max-w-md mx-auto">
            Add a service to make it bookable.
          </p>
          <button
            onClick={() => {
              playClick();
              setIsAddServiceOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add service</span>
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-[#105F68]">
                      ${(srv.priceCents / 100).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteService(srv.id, srv.name);
                      }}
                      className="p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Remove service"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                <h3 className="text-lg font-light text-[#105F68]">Add service</h3>
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
                  Save
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
