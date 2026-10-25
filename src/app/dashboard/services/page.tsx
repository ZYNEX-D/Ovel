"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { 
  Plus, 
  Sparkles, 
  Clock, 
  Check, 
  Trash2, 
  Ticket, 
  Copy, 
  ExternalLink, 
  ShoppingBag, 
  ShieldCheck, 
  LayoutGrid, 
  List,
  Layers,
  ChevronDown,
  ChevronRight,
  Edit3,
  Upload,
  Image as ImageIcon,
  Globe,
  Share2
} from "lucide-react";
import { 
  getServices, 
  INITIAL_SERVICES, 
  saveServices, 
  ServiceItem, 
  ServiceSubCategory,
  getProducts, 
  INITIAL_PRODUCTS,
  formatServicePrice,
  formatServiceDuration,
  getCategories,
  UniversalCategory
} from "@/lib/platform-store";
import { dollarsToCents, centsToDollars } from "@/lib/booking-time";
import { useClientStore, useHydrated } from "@/lib/use-client-store";
import { getOvelink, saveOvelink, OvelinkOffering } from "@/lib/ovelink-store";
import { FileDropzone } from "@/components/arc/file-dropzone/file-dropzone";
import { formatCurrency, getCurrencySymbol, DEFAULT_CURRENCY } from "@/lib/currency";
import { useAudio } from "@/components/AudioController";
import { useAuth } from "@/lib/auth-context";
import { getMerchantSubscription, checkOfferingCapacity } from "@/lib/subscription-store";
import { createVipPass, getMerchantVipPasses, VipPass } from "@/lib/vip-passes";
import { getVipPassUrl } from "@/lib/domain";
import { ArcMetricCard } from "@/components/ui/ArcMetricCard";
import { ArcBadge } from "@/components/ui/ArcBadge";
import { SortableDataTable } from "@/components/arc/sortable-data-table/sortable-data-table";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Dialog, DialogContent, DialogClose } from "@/components/arc/dialog/dialog";
import Toast from "@/components/arc/toast/toast";
import Alert from "@/components/arc/alert/alert";
import { SubCategoryManager } from "./SubCategoryManager";

export default function DashboardServicesPage() {
  const { profile, isLoading } = useAuth();
  const { playClick, playSuccess } = useAudio();
  const hydrated = useHydrated();
  const wsId = profile?.organizationId || profile?.organizationSlug;

  const readServices = useCallback(() => getServices(wsId), [wsId]);
  const services = useClientStore(readServices, () => INITIAL_SERVICES);

  const readProducts = useCallback(() => getProducts(wsId), [wsId]);
  const products = useClientStore(readProducts, () => INITIAL_PRODUCTS);

  const readCategories = useCallback(() => getCategories(wsId), [wsId]);
  const categories = useClientStore(readCategories, () => []);

  const defaultSlug = profile?.organizationSlug || profile?.organizationId || "my-brand";
  const activeOvelink = useClientStore(
    () => getOvelink(defaultSlug, profile?.organizationName, wsId),
    () => getOvelink(defaultSlug, profile?.organizationName, wsId)
  );
  const currency = activeOvelink?.currency || DEFAULT_CURRENCY;
  const currencySymbol = getCurrencySymbol(currency);

  const merchantTarget = wsId || defaultSlug;
  const subscription = getMerchantSubscription(merchantTarget);
  const totalCatalogCount = services.length + products.length;
  const capacity = checkOfferingCapacity(merchantTarget, totalCatalogCount);

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSubCatIds, setExpandedSubCatIds] = useState<Record<string, boolean>>({});

  // Modals
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [deletingService, setDeletingService] = useState<{ id: string; name: string } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Service form fields
  const [serviceModalTab, setServiceModalTab] = useState<"general" | "pricing" | "subcategories" | "seo">("general");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Services");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pricingType, setPricingType] = useState<"fixed" | "range">("fixed");
  const [price, setPrice] = useState<number>(4500);
  const [priceMax, setPriceMax] = useState<number>(6500);
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [durationMode, setDurationMode] = useState<"fixed" | "around">("fixed");
  const [depositRequired, setDepositRequired] = useState<boolean>(true);
  const [deposit, setDeposit] = useState<number>(1500);
  const [subCategories, setSubCategories] = useState<ServiceSubCategory[]>([]);
  const [slug, setSlug] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");

  // VIP Pass state
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [vipSelectedServiceId, setVipSelectedServiceId] = useState("");
  const [vipTitle, setVipTitle] = useState("");
  const [vipPrice, setVipPrice] = useState<number>(3000);
  const [vipDeposit, setVipDeposit] = useState<number>(1000);
  const [vipClientName, setVipClientName] = useState("");
  const [vipClientPhone, setVipClientPhone] = useState("");
  const [createdVipPass, setCreatedVipPass] = useState<VipPass | null>(null);
  const [copiedVipLink, setCopiedVipLink] = useState(false);

  const readVipPasses = useCallback(() => getMerchantVipPasses(defaultSlug), [defaultSlug]);
  const vipPasses = useClientStore(readVipPasses, () => []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleShareService = (srv: ServiceItem) => {
    playClick();
    const origin = typeof window !== "undefined" ? window.location.origin : "https://ovel.lk";
    const url = `${origin}/l/${defaultSlug}?service=${srv.id}`;
    navigator.clipboard?.writeText(url);
    showToast(`Direct link copied for ${srv.name}!`);
  };

  const toggleSubCategoryExpand = (id: string) => {
    setExpandedSubCatIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast("Please select an image smaller than 3MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string);
        showToast("Service image loaded");
      }
    };
    reader.readAsDataURL(file);
  };

  const openAddServiceModal = () => {
    playClick();
    if (capacity.isAtCapacity) {
      setIsCapacityModalOpen(true);
      return;
    }
    setEditingServiceId(null);
    setName("");
    setDescription("");
    setCategory("Services");
    setCategoryId("");
    setImageUrl("");
    setPricingType("fixed");
    setPrice(4500);
    setPriceMax(6500);
    setDurationMinutes(45);
    setDurationMode("fixed");
    setDepositRequired(true);
    setDeposit(1500);
    setSubCategories([]);
    setSlug("");
    setSeoTitle("");
    setSeoDescription("");
    setSeoKeywords("");
    setServiceModalTab("general");
    setIsServiceModalOpen(true);
  };

  const openEditServiceModal = (srv: ServiceItem) => {
    playClick();
    setEditingServiceId(srv.id);
    setName(srv.name);
    setDescription(srv.description || "");
    setCategory(srv.category || "Services");
    setCategoryId(srv.categoryId || "");
    setImageUrl(srv.imageUrl || "");
    setPricingType(srv.pricingType || "fixed");
    setPrice(centsToDollars(srv.priceCents) || 0);
    setPriceMax(centsToDollars(srv.priceMaxCents ?? srv.priceCents) || 0);
    setDurationMinutes(srv.durationMinutes || 45);
    setDurationMode(srv.durationMode || "fixed");
    setDepositRequired(srv.depositRequired ?? (srv.depositCents > 0));
    setDeposit(centsToDollars(srv.depositCents) || 0);
    setSubCategories(srv.subCategories || []);
    setSlug(srv.slug || "");
    setSeoTitle(srv.seoTitle || "");
    setSeoDescription(srv.seoDescription || "");
    setSeoKeywords(srv.seoKeywords || "");
    setServiceModalTab("general");
    setIsServiceModalOpen(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServiceId && capacity.isAtCapacity) {
      setIsServiceModalOpen(false);
      setIsCapacityModalOpen(true);
      return;
    }

    const priceCents = dollarsToCents(Number(price)) ?? 0;
    const priceMaxCents = pricingType === "range" ? (dollarsToCents(Number(priceMax)) ?? undefined) : undefined;
    const depositCents = depositRequired ? (dollarsToCents(Number(deposit)) ?? 0) : 0;
    const dur = Number(durationMinutes);

    if (!name.trim()) {
      showToast("Please enter a service name");
      return;
    }
    if (priceCents < 0) {
      showToast("Please enter a valid price");
      return;
    }
    if (pricingType === "range" && (priceMaxCents == null || priceMaxCents < priceCents)) {
      showToast("Max price must be greater than or equal to min price");
      return;
    }
    if (depositRequired && (depositCents > priceCents && pricingType === "fixed")) {
      showToast("Deposit hold cannot exceed total fixed price");
      return;
    }
    if (!Number.isFinite(dur) || dur <= 0) {
      showToast("Please provide a valid duration in minutes");
      return;
    }

    playSuccess();

    const targetId = editingServiceId || "srv_" + Date.now().toString(36);
    const serviceSlug = slug.trim()
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const newOrUpdatedService: ServiceItem = {
      id: targetId,
      name: name.trim(),
      description: description.trim() || "Professional service offering.",
      category: category.trim() || "Services",
      categoryId: categoryId || undefined,
      pricingType,
      priceCents,
      priceMaxCents,
      durationMinutes: dur,
      durationMode,
      depositRequired,
      depositCents,
      bufferAfterMinutes: 15,
      subCategories,
      imageUrl: imageUrl.trim() || undefined,
      slug: serviceSlug,
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      seoKeywords: seoKeywords.trim() || undefined,
      isActive: true,
    };

    const currentWs = profile?.organizationId || profile?.organizationSlug;
    let updatedList: ServiceItem[];
    if (editingServiceId) {
      updatedList = services.map(s => s.id === editingServiceId ? newOrUpdatedService : s);
    } else {
      updatedList = [...services, newOrUpdatedService];
    }

    saveServices(updatedList, currentWs);
    if (profile?.organizationSlug && profile.organizationSlug !== currentWs) {
      saveServices(updatedList, profile.organizationSlug);
    }

    const targetSlug =
      activeOvelink?.slug ||
      profile?.organizationSlug ||
      (profile?.organizationId ? `biz-${profile.organizationId.replace(/^org_/, "").slice(-6)}` : "my-brand");

    if (targetSlug && targetSlug !== currentWs) {
      saveServices(updatedList, targetSlug);
    }
    if (profile?.organizationId && profile.organizationId !== currentWs) {
      saveServices(updatedList, profile.organizationId);
    }

    // Sync to Ovelink
    try {
      const ovelink = getOvelink(targetSlug, profile?.organizationName, currentWs);
      const newOff: OvelinkOffering = {
        id: newOrUpdatedService.id,
        type: "appointment",
        name: newOrUpdatedService.name,
        description: newOrUpdatedService.description,
        pricingType: newOrUpdatedService.pricingType,
        priceCents: newOrUpdatedService.priceCents,
        priceMaxCents: newOrUpdatedService.priceMaxCents,
        depositCents: newOrUpdatedService.depositCents,
        depositRequired: newOrUpdatedService.depositRequired,
        durationMinutes: newOrUpdatedService.durationMinutes,
        durationMode: newOrUpdatedService.durationMode,
        subCategories: newOrUpdatedService.subCategories,
        requiresTimeSlot: true,
        category: newOrUpdatedService.category || "Services",
        categoryId: newOrUpdatedService.categoryId,
        imageUrl: newOrUpdatedService.imageUrl,
        slug: newOrUpdatedService.slug,
        isActive: newOrUpdatedService.isActive !== false,
      };
      const remainingOfferings = (ovelink.offerings || []).filter(o => o.id !== targetId);
      saveOvelink({
        ...ovelink,
        offerings: [...remainingOfferings, newOff],
      });
    } catch {
      // safe fallback
    }

    setIsServiceModalOpen(false);
    showToast(editingServiceId ? `Service "${newOrUpdatedService.name}" updated` : `Service "${newOrUpdatedService.name}" created and synced to Ovelink`);
  };

  const handleDeleteService = (serviceId: string, serviceName: string) => {
    playClick();
    setDeletingService({ id: serviceId, name: serviceName });
  };

  const confirmDeleteService = () => {
    if (!deletingService) return;
    playClick();
    const { id: serviceId, name: serviceName } = deletingService;
    const currentWs = profile?.organizationId || profile?.organizationSlug;
    const targetSlug =
      activeOvelink?.slug ||
      profile?.organizationSlug ||
      (profile?.organizationId ? `biz-${profile.organizationId.replace(/^org_/, "").slice(-6)}` : "my-brand");

    const updated = services.filter((s) => s.id !== serviceId);
    saveServices(updated, currentWs);
    if (targetSlug && targetSlug !== currentWs) {
      saveServices(updated, targetSlug);
    }
    if (profile?.organizationSlug && profile.organizationSlug !== currentWs && profile.organizationSlug !== targetSlug) {
      saveServices(updated, profile.organizationSlug);
    }
    if (profile?.organizationId && profile.organizationId !== currentWs) {
      saveServices(updated, profile.organizationId);
    }
    try {
      const ovelink = getOvelink(targetSlug, profile?.organizationName, currentWs);
      saveOvelink({
        ...ovelink,
        offerings: (ovelink.offerings || []).filter((o) => o.id !== serviceId),
      });
    } catch {
      // safe fallback
    }
    setDeletingService(null);
    showToast(`Service "${serviceName}" removed`);
  };

  const handleCreateVipPass = (e: React.FormEvent) => {
    e.preventDefault();
    const service = services.find((s) => s.id === vipSelectedServiceId) || services[0];
    if (!service) {
      showToast("Create a service first before issuing a VIP pass");
      return;
    }
    playSuccess();

    const pass = createVipPass({
      merchantSlug: defaultSlug,
      merchantId: wsId,
      title: vipTitle || `Exclusive VIP: ${service.name}`,
      clientName: vipClientName,
      clientPhone: vipClientPhone,
      offerings: [
        {
          offeringId: service.id,
          name: service.name,
          originalPriceCents: service.priceCents,
          vipPriceCents: dollarsToCents(vipPrice) ?? 0,
          vipDepositCents: dollarsToCents(vipDeposit) ?? 0,
          description: service.description,
        },
      ],
    });

    setCreatedVipPass(pass);
    showToast("Single-Use VIP Pass Link Generated!");
  };

  if (!hydrated || (isLoading && !wsId)) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="p-12 rounded-3xl border border-black/5 bg-white text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#105F68]/30 border-t-[#105F68] animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Recursive subcategory preview renderer
  const renderSubCategorySummary = (items?: ServiceSubCategory[], depth = 0): React.ReactNode => {
    if (!items || items.length === 0) return null;
    return (
      <div className={`space-y-1.5 ${depth > 0 ? "pl-3 border-l border-[#105F68]/20 mt-1.5" : "mt-2"}`}>
        {items.map((sub) => (
          <div key={sub.id} className="text-xs">
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-[#F6FAF9] border border-black/5">
              <span className="font-medium text-[#105F68] truncate">{sub.name}</span>
              <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                <span className="font-mono font-medium text-slate-700">
                  {formatServicePrice(sub, currency)}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">
                  {formatServiceDuration(sub)}
                </span>
                {sub.depositRequired && (
                  <span className="px-1.5 py-0.5 rounded-md bg-[#105F68]/10 text-[#105F68] text-[9px] font-semibold">
                    Dep: {formatCurrency(sub.depositCents || 0, currency)}
                  </span>
                )}
              </div>
            </div>
            {sub.subCategories && sub.subCategories.length > 0 && renderSubCategorySummary(sub.subCategories, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
            Service Catalog &amp; Deposit Guard
          </h1>
          <p className="text-xs text-[#3A9295] mt-1">
            Configure flexible pricing (fixed or range), durations (exact or approx), upfront deposits, and nested sub-categories.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="hidden sm:flex items-center gap-2">
            <ArcBadge variant="teal" size="sm">
              {services.length} Services
            </ArcBadge>
            <ArcBadge variant="neutral" size="xs">
              {subscription.name}
            </ArcBadge>
          </div>

          <button
            onClick={() => {
              playClick();
              setCreatedVipPass(null);
              if (services.length > 0) {
                setVipSelectedServiceId(services[0].id);
                setVipPrice(Math.round((services[0].priceCents * 0.8) / 100));
                setVipDeposit(Math.round(((services[0].depositCents || 0) * 0.8) / 100));
              }
              setIsVipModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#105F68] text-[#105F68] bg-white text-xs font-medium hover:bg-[#105F68]/5 transition-all shadow-xs"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Create VIP Pass Link</span>
          </button>

          <button
            onClick={openAddServiceModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* Metric Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <ArcMetricCard
          label="Active Services"
          value={services.length}
          subValue="Live in active catalog"
          icon={ShoppingBag}
          statusDot="live"
        />
        <ArcMetricCard
          label="Average Deposit Guard"
          value={
            services.length > 0
              ? formatCurrency(
                  Math.round(services.reduce((acc, s) => acc + (s.depositRequired ? s.depositCents : 0), 0) / services.length),
                  currency
                )
              : formatCurrency(0, currency)
          }
          subValue="Upfront cancellation shield"
          trend={{ value: "Card hold guarantee", isPositive: true }}
          icon={ShieldCheck}
          variant="emerald"
          statusDot="live"
        />
        <ArcMetricCard
          label="Active VIP Passes"
          value={vipPasses.filter((p) => !p.isRedeemed).length}
          subValue="Single-use secret pricing"
          trend={{ value: "Auto-destruct on booking", isPositive: true }}
          icon={Ticket}
          variant="brand"
        />
      </div>

      {/* Filter & View Mode Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search services, categories, or descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438] focus:outline-none focus:border-[#105F68]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#F6FAF9] p-1 rounded-xl border border-black/10">
            <button
              onClick={() => setViewMode("grid")}
              title="Grid View"
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === "grid"
                  ? "bg-white text-[#105F68] shadow-xs font-medium"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Table View (Arc Sortable)"
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === "table"
                  ? "bg-white text-[#105F68] shadow-xs font-medium"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Services Presentation: EmptyState vs SortableDataTable vs Grid */}
      {(() => {
        const filteredServices = services.filter(
          (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        if (filteredServices.length === 0) {
          return (
            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <EmptyState
                icon={<Sparkles className="w-6 h-6 text-[#105F68]" />}
                title={services.length === 0 ? "No services in your catalog yet" : "No services match your search"}
                description="Configure your service offerings, price ranges, service durations, and nested sub-categories to make them bookable."
                action={
                  <button
                    onClick={openAddServiceModal}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Service</span>
                  </button>
                }
              />
            </div>
          );
        }

        if (viewMode === "table") {
          return (
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <SortableDataTable<ServiceItem & Record<string, unknown>>
                rows={filteredServices as (ServiceItem & Record<string, unknown>)[]}
                rowKey="id"
                caption="Service Offerings"
                selectable
                selectedKeys={selectedRowKeys}
                onSelectionChange={setSelectedRowKeys}
                itemName={{ one: "service", other: "services" }}
                defaultSort={{ key: "name", direction: "asc" }}
                columns={[
                  {
                    key: "name",
                    label: "Service Offering",
                    sortable: true,
                    render: (_v, row) => (
                      <div className="flex items-center gap-2.5 py-1">
                        {row.imageUrl ? (
                          <img src={row.imageUrl} alt={row.name} className="w-9 h-9 rounded-xl object-cover border border-black/10 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-[#105F68]/10 text-[#105F68] flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[#105F68]">{row.name}</span>
                            {row.subCategories && row.subCategories.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-[#105F68]/10 text-[#105F68] text-[10px] font-semibold flex items-center gap-1">
                                <Layers className="w-2.5 h-2.5" />
                                <span>{row.subCategories.length} sub-tiers</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 truncate max-w-xs">{row.description}</span>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "durationMinutes",
                    label: "Duration",
                    numeric: true,
                    sortable: true,
                    render: (_v, row) => (
                      <ArcBadge variant="neutral" size="xs" icon={Clock}>
                        {formatServiceDuration(row)}
                      </ArcBadge>
                    ),
                  },
                  {
                    key: "depositCents",
                    label: "Deposit Guard",
                    numeric: true,
                    sortable: true,
                    render: (_v, row) =>
                      row.depositRequired && row.depositCents > 0 ? (
                        <ArcBadge variant="teal" size="xs">
                          {formatCurrency(row.depositCents, currency)}
                        </ArcBadge>
                      ) : (
                        <ArcBadge variant="neutral" size="xs">
                          No Deposit
                        </ArcBadge>
                      ),
                  },
                  {
                    key: "priceCents",
                    label: "Price / Range",
                    numeric: true,
                    sortable: true,
                    render: (_v, row) => (
                      <span className="font-mono font-medium text-[#103438]">
                        {formatServicePrice(row, currency)}
                      </span>
                    ),
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    sortable: false,
                    render: (_v, row) => (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleShareService(row)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[10px] font-medium transition-all flex items-center gap-1"
                          title="Copy Direct Ovelink"
                        >
                          <Share2 className="w-3 h-3 text-[#105F68]" />
                          <span>Share</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditServiceModal(row)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[10px] font-medium transition-all flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3 text-slate-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            setCreatedVipPass(null);
                            setVipSelectedServiceId(row.id);
                            setVipPrice(Math.round((row.priceCents * 0.8) / 100));
                            setVipDeposit(Math.round(((row.depositCents || 0) * 0.8) / 100));
                            setIsVipModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-[#105F68]/20 bg-[#F6FAF9] hover:bg-[#C8E6E2]/40 text-[#105F68] text-[10px] font-semibold transition-all flex items-center gap-1"
                        >
                          <Ticket className="w-3 h-3 text-[#105F68]" />
                          <span>VIP</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(row.id, row.name)}
                          className="p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Remove service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          );
        }

        // Grid View
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((srv) => {
              const isSubExpanded = Boolean(expandedSubCatIds[srv.id]);
              const hasSub = Boolean(srv.subCategories && srv.subCategories.length > 0);

              return (
                <div
                  key={srv.id}
                  className="p-5 rounded-2xl border border-black/5 bg-white flex flex-col justify-between space-y-4 hover:border-[#105F68]/20 transition-all shadow-sm"
                >
                  <div>
                    {srv.imageUrl && (
                      <div className="w-full h-36 rounded-xl overflow-hidden mb-3 border border-black/5">
                        <img src={srv.imageUrl} alt={srv.name} className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-[#105F68]">{srv.name}</h4>
                          {srv.category && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                              {srv.category}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#3A9295] mt-1 line-clamp-2">{srv.description}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleShareService(srv)}
                          className="p-1 rounded-md text-slate-400 hover:text-[#105F68] hover:bg-slate-100 transition-colors"
                          title="Copy Direct Link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditServiceModal(srv)}
                          className="p-1 rounded-md text-slate-400 hover:text-[#105F68] hover:bg-slate-100 transition-colors"
                          title="Edit Service"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(srv.id, srv.name)}
                          className="p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Remove service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Sub-categories preview or toggle */}
                    {hasSub && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => toggleSubCategoryExpand(srv.id)}
                          className="w-full flex items-center justify-between text-[11px] text-[#105F68] font-medium hover:underline py-0.5"
                        >
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            <span>{srv.subCategories!.length} Sub-Categories &amp; Tiers</span>
                          </span>
                          {isSubExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>

                        {isSubExpanded && renderSubCategorySummary(srv.subCategories)}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-black/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <ArcBadge variant="neutral" size="xs" icon={Clock}>
                        {formatServiceDuration(srv)}
                      </ArcBadge>
                      {srv.depositRequired && srv.depositCents > 0 ? (
                        <ArcBadge variant="teal" size="xs">
                          {formatCurrency(srv.depositCents, currency)} Dep
                        </ArcBadge>
                      ) : (
                        <ArcBadge variant="neutral" size="xs">
                          No Dep
                        </ArcBadge>
                      )}
                    </div>
                    <span className="text-xs font-mono font-semibold text-[#105F68]">
                      {formatServicePrice(srv, currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Single-Use VIP Passes & Special Offers Section */}
      <div className="mt-8 p-6 sm:p-8 rounded-3xl bg-white border border-black/5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#105F68]" />
              <h3 className="text-base font-bold text-[#105F68]">Single-Use VIP Pass &amp; Private Offer Links</h3>
            </div>
            <p className="text-xs text-[#3A9295] mt-0.5">
              Secret discount links with custom pricing that permanently self-destruct once a customer books or orders.
            </p>
          </div>

          <button
            onClick={() => {
              playClick();
              setCreatedVipPass(null);
              if (services.length > 0) {
                setVipSelectedServiceId(services[0].id);
                setVipPrice(Math.round((services[0].priceCents * 0.8) / 100));
                setVipDeposit(Math.round(((services[0].depositCents || 0) * 0.8) / 100));
              }
              setIsVipModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#105F68] text-white text-xs font-medium hover:bg-[#0D4F57] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New VIP Pass</span>
          </button>
        </div>

        {vipPasses.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#F6FAF9] border border-black/5 text-center space-y-2">
            <Ticket className="w-8 h-8 text-[#3A9295] mx-auto opacity-50" />
            <p className="text-xs font-medium text-[#105F68]">No VIP passes issued yet</p>
            <p className="text-[11px] text-[#3A9295] max-w-sm mx-auto">
              Create an exclusive discounted link for a specific client. Once they book, the link immediately expires.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {vipPasses.map((pass) => (
              <div
                key={pass.id}
                className="p-4 rounded-2xl border border-black/5 bg-[#F6FAF9] flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#105F68] truncate">{pass.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      pass.isRedeemed ? "bg-slate-200 text-slate-600" : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {pass.isRedeemed ? "Redeemed" : "Active"}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 truncate">
                  {getVipPassUrl(pass.merchantSlug, pass.token)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          ARC UI ANIMATED DIALOG: ADD / EDIT SERVICE
         ========================================================================= */}
      <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
        <DialogContent
          title={editingServiceId ? "Edit Catalog Service" : "Add Catalog Service"}
          description="Configure service pricing, durations, advanced deposit, image, category, and SEO."
        >
          <div className="space-y-4 pt-1">
            {/* Modal Sub-navigation Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/80 border border-slate-200/80 text-xs">
              <button
                type="button"
                onClick={() => setServiceModalTab("general")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  serviceModalTab === "general"
                    ? "bg-white text-[#105F68] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Core Info
              </button>
              <button
                type="button"
                onClick={() => setServiceModalTab("pricing")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  serviceModalTab === "pricing"
                    ? "bg-white text-[#105F68] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Price &amp; Timing
              </button>
              <button
                type="button"
                onClick={() => setServiceModalTab("subcategories")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
                  serviceModalTab === "subcategories"
                    ? "bg-white text-[#105F68] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Sub-Categories</span>
                {subCategories.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#105F68] text-white text-[9px] flex items-center justify-center">
                    {subCategories.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setServiceModalTab("seo")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  serviceModalTab === "seo"
                    ? "bg-white text-[#105F68] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                SEO
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4">
              {/* TAB 1: Core Info */}
              {serviceModalTab === "general" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs text-[#105F68] font-medium block mb-1">
                      Service Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Standard Consultation or Express Package"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#105F68] font-medium block mb-1">
                        Category Link
                      </label>
                      <select
                        value={categoryId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCategoryId(val);
                          const matched = categories.find(c => c.id === val);
                          if (matched) setCategory(matched.name);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                      >
                        <option value="">Select Category...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-[#105F68] font-medium block mb-1">
                        Category Label / Tag
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. General, Premium"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                      />
                    </div>
                  </div>

                  {/* Image Upload using Arc FileDropzone */}
                  <div>
                    <label className="text-xs text-[#105F68] font-medium block mb-1.5">
                      Service Showcase Image
                    </label>
                    <FileDropzone
                      label="Upload Service Image"
                      description="Drag and drop or browse photo from your device"
                      accept="image/png,image/jpeg,image/webp"
                      multiple={false}
                      maxFiles={1}
                      maxSize={5 * 1024 * 1024}
                      compactAt={1}
                      defaultItems={
                        imageUrl
                          ? [
                              {
                                id: "existing_service_img",
                                name: "Selected Service Photo",
                                size: 1024 * 280,
                                status: "complete",
                                preview: imageUrl,
                              },
                            ]
                          : []
                      }
                      onUpload={async (item, { onProgress }) => {
                        if (item.file) {
                          onProgress(30);
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            onProgress(85);
                            const dataUrl = e.target?.result as string;
                            setImageUrl(dataUrl);
                            onProgress(100);
                          };
                          reader.readAsDataURL(item.file);
                        }
                      }}
                      onFilesChange={(files) => {
                        if (files.length === 0) {
                          setImageUrl("");
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#105F68] font-medium block mb-1">
                      Description &amp; Overview
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Outline service deliverables, instructions, or booking conditions..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Pricing & Timing */}
              {serviceModalTab === "pricing" && (
                <div className="space-y-4">
                  {/* Fixed Price vs Price Range */}
                  <div className="p-3.5 rounded-2xl bg-[#F6FAF9] border border-slate-200/80 space-y-3">
                    <label className="text-xs text-[#105F68] font-semibold block">
                      Pricing Model: Fixed Price or Price Range
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-200/60 text-xs">
                      <button
                        type="button"
                        onClick={() => setPricingType("fixed")}
                        className={`py-2 rounded-lg font-medium transition-all ${
                          pricingType === "fixed"
                            ? "bg-white text-[#105F68] shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Fixed Price
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPricingType("range");
                          if (!priceMax || priceMax <= price) {
                            setPriceMax(Math.round(price * 1.3));
                          }
                        }}
                        className={`py-2 rounded-lg font-medium transition-all ${
                          pricingType === "range"
                            ? "bg-white text-[#105F68] shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Price Range (Min – Max)
                      </button>
                    </div>

                    {pricingType === "range" ? (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] text-slate-600 font-medium block mb-1">
                            Minimum Price ({currencySymbol})
                          </label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs font-mono text-[#105F68]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 font-medium block mb-1">
                            Maximum Price ({currencySymbol})
                          </label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={priceMax}
                            onChange={(e) => setPriceMax(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs font-mono text-[#105F68]"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1">
                        <label className="text-[11px] text-slate-600 font-medium block mb-1">
                          Standard Service Price ({currencySymbol})
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={price}
                          onChange={(e) => setPrice(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs font-mono text-[#105F68]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Fixed Duration vs Around / Approx */}
                  <div className="p-3.5 rounded-2xl bg-[#F6FAF9] border border-slate-200/80 space-y-3">
                    <label className="text-xs text-[#105F68] font-semibold block">
                      Service Duration: Exact or Around
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-200/60 text-xs">
                      <button
                        type="button"
                        onClick={() => setDurationMode("fixed")}
                        className={`py-2 rounded-lg font-medium transition-all ${
                          durationMode === "fixed"
                            ? "bg-white text-[#105F68] shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Exact Time ({durationMinutes} mins)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDurationMode("around")}
                        className={`py-2 rounded-lg font-medium transition-all ${
                          durationMode === "around"
                            ? "bg-white text-[#105F68] shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Around (~{durationMinutes} mins approx)
                      </button>
                    </div>

                    <div className="pt-1">
                      <label className="text-[11px] text-slate-600 font-medium block mb-1">
                        Duration in Minutes
                      </label>
                      <input
                        type="number"
                        min="5"
                        step="5"
                        required
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs text-[#105F68]"
                      />
                    </div>
                  </div>

                  {/* Advanced Deposit Hold */}
                  <div className="p-3.5 rounded-2xl bg-[#F6FAF9] border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs text-[#105F68] font-semibold block">
                          Advanced Upfront Deposit
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Protect against late cancellations by securing a card deposit
                        </p>
                      </div>
                      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200/70 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setDepositRequired(false);
                            setDeposit(0);
                          }}
                          className={`px-3 py-1 rounded-md font-medium transition-all ${
                            !depositRequired
                              ? "bg-white text-[#105F68] shadow-xs"
                              : "text-slate-600"
                          }`}
                        >
                          No Deposit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDepositRequired(true);
                            if (!deposit) setDeposit(Math.round(price * 0.3));
                          }}
                          className={`px-3 py-1 rounded-md font-medium transition-all ${
                            depositRequired
                              ? "bg-white text-[#105F68] shadow-xs"
                              : "text-slate-600"
                          }`}
                        >
                          Require Deposit
                        </button>
                      </div>
                    </div>

                    {depositRequired && (
                      <div className="pt-2">
                        <label className="text-[11px] text-slate-600 font-medium block mb-1">
                          Upfront Deposit Hold ({currencySymbol})
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={deposit}
                          onChange={(e) => setDeposit(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs font-mono text-[#105F68]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Nested Sub-Categories */}
              {serviceModalTab === "subcategories" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-[#105F68]/5 border border-[#105F68]/15 text-xs text-[#105F68] space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Nested Sub-Categories &amp; Multi-Tier Pricing</span>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Add sub-categories (and sub-categories under them!) with their own fixed or range pricing, durations, and deposit requirements.
                    </p>
                  </div>

                  <SubCategoryManager
                    categories={subCategories}
                    onChange={setSubCategories}
                    currencySymbol={currencySymbol}
                  />
                </div>
              )}

              {/* TAB 4: SEO Optimization */}
              {serviceModalTab === "seo" && (
                <div className="space-y-3.5">
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                    <span className="font-semibold text-emerald-900 flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Service SEO &amp; Rich Snippets</span>
                    </span>
                    <p className="text-[11px] text-emerald-800">
                      Optimize how this service appears on search engines and social share previews.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-[#105F68] font-medium block mb-1">
                      Service URL Slug
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. consulting-session"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs font-mono text-[#105F68]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <label className="text-[#105F68] font-medium">Meta SEO Title</label>
                      <span className="text-[10px] text-slate-400">{(seoTitle || name).length} / 60 chars</span>
                    </div>
                    <input
                      type="text"
                      placeholder={name ? `${name} | Online Booking` : "Service SEO Title"}
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <label className="text-[#105F68] font-medium">Meta Description</label>
                      <span className="text-[10px] text-slate-400">{seoDescription.length} / 160 chars</span>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Book our service online with instant confirmation and flexible time slots..."
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#105F68] font-medium block mb-1">
                      SEO Keywords / Meta Tags
                    </label>
                    <input
                      type="text"
                      placeholder="consulting, advisory, appointment, strategy"
                      value={seoKeywords}
                      onChange={(e) => setSeoKeywords(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                    />
                  </div>

                  {/* Google Preview */}
                  <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Google Search Preview</span>
                    <div className="text-[#1a0dab] font-medium truncate">
                      {seoTitle || name || "Service Name"}
                    </div>
                    <div className="text-[11px] text-[#006621] truncate">
                      https://ovel.lk/s/{slug || "service"}
                    </div>
                    <div className="text-[11px] text-slate-600 line-clamp-2">
                      {seoDescription || description || "Book your appointment online with instant slot confirmation."}
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {serviceModalTab !== "general" && (
                    <button
                      type="button"
                      onClick={() =>
                        setServiceModalTab(
                          serviceModalTab === "seo"
                            ? "subcategories"
                            : serviceModalTab === "subcategories"
                            ? "pricing"
                            : "general"
                        )
                      }
                      className="px-3.5 py-2 rounded-full border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      Back
                    </button>
                  )}
                  {serviceModalTab !== "seo" && (
                    <button
                      type="button"
                      onClick={() =>
                        setServiceModalTab(
                          serviceModalTab === "general"
                            ? "pricing"
                            : serviceModalTab === "pricing"
                            ? "subcategories"
                            : "seo"
                        )
                      }
                      className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200"
                    >
                      Next
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <DialogClose asChild>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-full text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </DialogClose>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all shadow-sm"
                  >
                    {editingServiceId ? "Save Changes" : "Save to Catalog"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          ARC UI ANIMATED DIALOG: VIP PASS
         ========================================================================= */}
      <Dialog open={isVipModalOpen} onOpenChange={setIsVipModalOpen}>
        <DialogContent
          title="Single-Use VIP Offer Link"
          description="Private discounted pass that auto-expires once confirmed."
        >
          <div className="space-y-4 pt-1">
            {createdVipPass ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                    <Check className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-900">VIP Pass Link Ready!</h4>
                  <p className="text-[11px] text-emerald-800">
                    This link is single-use. Once your client books or orders, it will permanently self-destruct.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono break-all text-[#105F68] select-all">
                  {getVipPassUrl(createdVipPass.merchantSlug, createdVipPass.token)}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      playClick();
                      const url = getVipPassUrl(createdVipPass.merchantSlug, createdVipPass.token);
                      navigator.clipboard?.writeText(url);
                      setCopiedVipLink(true);
                      setTimeout(() => setCopiedVipLink(false), 2500);
                    }}
                    className="flex-1 py-3 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedVipLink ? "Copied to Clipboard!" : "Copy VIP Link"}</span>
                  </button>
                  <DialogClose asChild>
                    <button
                      type="button"
                      className="px-4 py-3 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900"
                    >
                      Done
                    </button>
                  </DialogClose>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateVipPass} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Select Service</label>
                  <select
                    value={vipSelectedServiceId}
                    onChange={(e) => {
                      setVipSelectedServiceId(e.target.value);
                      const s = services.find((srv) => srv.id === e.target.value);
                      if (s) {
                        setVipPrice(Math.round((s.priceCents * 0.8) / 100));
                        setVipDeposit(Math.round(((s.depositCents || 0) * 0.8) / 100));
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                  >
                    {services.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name} — {formatServicePrice(srv, currency)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 font-medium block mb-1">VIP Headline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP Member Exclusive Rate"
                    value={vipTitle}
                    onChange={(e) => setVipTitle(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">
                      VIP Price ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={vipPrice}
                      onChange={(e) => setVipPrice(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">
                      VIP Deposit ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={vipDeposit}
                      onChange={(e) => setVipDeposit(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">
                      Client Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rachel Silva"
                      value={vipClientName}
                      onChange={(e) => setVipClientName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">
                      Client Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+94 77 000 0000"
                      value={vipClientPhone}
                      onChange={(e) => setVipClientPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <DialogClose asChild>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-full text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </DialogClose>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all shadow-xs"
                  >
                    Generate Single-Use Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          ARC UI ANIMATED DIALOG: CAPACITY MODAL
         ========================================================================= */}
      <Dialog open={isCapacityModalOpen} onOpenChange={setIsCapacityModalOpen}>
        <DialogContent
          title="Catalog Capacity Limit Reached"
          description={`Your active ${subscription.name} plan supports up to ${capacity.maxOfferings} catalog items.`}
        >
          <div className="space-y-4 pt-2">
            <Alert tone="warning" title="Upgrade Available">
              To list additional services and products on your Ovelink, upgrade to Growth (up to 10 items) or Scale (up to 30 items) with instant plan activation.
            </Alert>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <DialogClose asChild>
                <button
                  type="button"
                  className="px-4 py-2 rounded-full text-xs text-slate-600 hover:text-slate-900"
                >
                  Close
                </button>
              </DialogClose>
              <Link
                href="/dashboard/settings?tab=plans"
                onClick={() => setIsCapacityModalOpen(false)}
                className="px-5 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all shadow-xs"
              >
                View Plans &amp; Upgrade
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          ARC UI ANIMATED DIALOG: DELETE SERVICE CONFIRMATION
         ========================================================================= */}
      <Dialog open={Boolean(deletingService)} onOpenChange={(open) => { if (!open) setDeletingService(null); }}>
        <DialogContent
          title="Delete Service?"
          description={deletingService ? `Are you sure you want to delete "${deletingService.name}"? Clients will no longer be able to select or book this offering.` : ""}
        >
          <div className="space-y-4 pt-2">
            <Alert
              tone="danger"
              title="Catalog Removal"
            >
              This service offering and all configured upfront deposit rules and sub-categories will be removed from your catalog.
            </Alert>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <DialogClose asChild>
                <button
                  type="button"
                  className="px-4 py-2 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
              </DialogClose>
              <button
                type="button"
                onClick={confirmDeleteService}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold tracking-wide transition-all shadow-sm"
              >
                Delete Service
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Arc UI Toast Notification */}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <Toast
            key={notification || "idle"}
            open={Boolean(notification)}
            onOpenChange={(open) => { if (!open) setNotification(null); }}
            title={notification || ""}
            duration={3500}
          />
        </div>
      </div>
    </div>
  );
}
