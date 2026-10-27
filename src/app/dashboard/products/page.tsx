"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  Sparkles, 
  Package, 
  Check, 
  Trash2, 
  Ticket, 
  Copy, 
  ExternalLink, 
  Search,
  Filter,
  Tag,
  Truck,
  Edit2,
  Share2,
  Upload,
  Image as ImageIcon,
  Globe,
  Layers,
  LayoutGrid, 
  List,
  MessageCircle
} from "lucide-react";
import { 
  getProducts, 
  INITIAL_PRODUCTS, 
  saveProducts, 
  ProductItem,
  getServices,
  INITIAL_SERVICES,
  getCategories,
  UniversalCategory,
  ServiceSubCategory,
  getActiveWorkspaceId
} from "@/lib/platform-store";
import { dollarsToCents, centsToDollars } from "@/lib/booking-time";
import { useClientStore, useHydrated } from "@/lib/use-client-store";
import { FileDropzone } from "@/components/arc/file-dropzone/file-dropzone";
import { getOvelink, saveOvelink, OvelinkOffering } from "@/lib/ovelink-store";
import { formatCurrency, getCurrencySymbol, DEFAULT_CURRENCY } from "@/lib/currency";
import { useAudio } from "@/components/AudioController";
import { useAuth } from "@/lib/auth-context";
import { getMerchantSubscription, checkOfferingCapacity } from "@/lib/subscription-store";
import { createVipPass, getMerchantVipPasses, VipPass } from "@/lib/vip-passes";
import { getVipPassUrl } from "@/lib/domain";
import ArcBadge from "@/components/ui/ArcBadge";
import ArcMetricCard from "@/components/ui/ArcMetricCard";
import { SortableDataTable } from "@/components/arc/sortable-data-table/sortable-data-table";
import Toast from "@/components/arc/toast/toast";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Dialog, DialogContent, DialogClose } from "@/components/arc/dialog/dialog";
import Alert from "@/components/arc/alert/alert";
import { SubCategoryManager } from "../services/SubCategoryManager";

export default function DashboardProductsPage() {
  const { profile, isLoading } = useAuth();
  const { playClick, playSuccess } = useAudio();
  const hydrated = useHydrated();
  const wsId = profile?.organizationId || profile?.organizationSlug;

  const defaultSlug = profile?.organizationSlug || profile?.organizationId || "my-brand";
  const activeOvelink = useClientStore(
    () => getOvelink(defaultSlug, profile?.organizationName, wsId),
    () => getOvelink(defaultSlug, profile?.organizationName, wsId)
  );

  const readProducts = useCallback(() => {
    let list = getProducts(wsId);
    if ((!list || list.length === 0) && profile?.organizationSlug) {
      list = getProducts(profile.organizationSlug);
    }
    if ((!list || list.length === 0) && defaultSlug) {
      list = getProducts(defaultSlug);
    }
    if (!list || list.length === 0) {
      list = getProducts();
    }
    if (!list || list.length === 0) {
      list = getProducts("demo");
    }
    return list;
  }, [wsId, profile?.organizationSlug, defaultSlug]);
  const products = useClientStore(readProducts, () => INITIAL_PRODUCTS);

  const readServices = useCallback(() => getServices(wsId), [wsId]);
  const services = useClientStore(readServices, () => INITIAL_SERVICES);

  const readCategories = useCallback(() => getCategories(wsId), [wsId]);
  const categories = useClientStore(readCategories, () => []);
  const currency = activeOvelink?.currency || DEFAULT_CURRENCY;
  const currencySymbol = getCurrencySymbol(currency);

  const merchantTarget = wsId || defaultSlug;
  const subscription = getMerchantSubscription(merchantTarget);
  const totalCatalogCount = services.length + products.length;
  const capacity = checkOfferingCapacity(merchantTarget, totalCatalogCount);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "low_stock">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // Add / Edit Modal states
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<"general" | "pricing" | "categories" | "seo">("general");
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<{ id: string; name: string } | null>(null);
  
  // Product form fields
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState(5500);
  const [productSku, setProductSku] = useState("");
  const [productStock, setProductStock] = useState(25);
  const [productCategory, setProductCategory] = useState("Retail");
  const [productCategoryId, setProductCategoryId] = useState("");
  const [productBadge, setProductBadge] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [productRequiresShipping, setProductRequiresShipping] = useState(true);
  const [productIsActive, setProductIsActive] = useState(true);
  const [productSubCategories, setProductSubCategories] = useState<ServiceSubCategory[]>([]);
  const [productSlug, setProductSlug] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  // Sharing Product state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingProduct, setSharingProduct] = useState<ProductItem | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // VIP Pass state for products
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [vipSelectedProductId, setVipSelectedProductId] = useState("");
  const [vipTitle, setVipTitle] = useState("");
  const [vipPrice, setVipPrice] = useState<number>(4000);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast("Please choose an image under 3MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProductImageUrl(event.target.result as string);
        showToast("Product image loaded");
      }
    };
    reader.readAsDataURL(file);
  };

  const openAddModal = () => {
    playClick();
    if (capacity.isAtCapacity) {
      setIsCapacityModalOpen(true);
      return;
    }
    setEditingProductId(null);
    setProductName("");
    setProductPrice(5500);
    setProductSku("");
    setProductStock(25);
    setProductCategory("Retail");
    setProductCategoryId("");
    setProductBadge("");
    setProductDesc("");
    setProductImageUrl("");
    setProductRequiresShipping(true);
    setProductIsActive(true);
    setProductSubCategories([]);
    setProductSlug("");
    setSeoTitle("");
    setSeoDescription("");
    setSeoKeywords("");
    setModalTab("general");
    setIsAddProductOpen(true);
  };

  const openEditModal = (p: ProductItem) => {
    playClick();
    setEditingProductId(p.id);
    setProductName(p.name);
    setProductPrice(centsToDollars(p.priceCents) || 0);
    setProductSku(p.sku || "");
    setProductStock(p.stockCount ?? 0);
    setProductCategory(p.category || "Retail");
    setProductCategoryId(p.categoryId || "");
    setProductBadge(p.badge || "");
    setProductDesc(p.description || "");
    setProductImageUrl(p.imageUrl || "");
    setProductRequiresShipping(p.requiresShipping !== false);
    setProductIsActive(p.isActive !== false);
    setProductSubCategories(p.subCategories || []);
    setProductSlug(p.slug || "");
    setSeoTitle(p.seoTitle || "");
    setSeoDescription(p.seoDescription || "");
    setSeoKeywords(p.seoKeywords || "");
    setModalTab("general");
    setIsAddProductOpen(true);
  };

  const handleOpenShare = (p: ProductItem) => {
    playClick();
    setSharingProduct(p);
    setCopiedShareLink(false);
    setIsShareModalOpen(true);
  };

  // Auto-activate legacy or imported products where isActive is undefined and ensure synced to Ovelink
  useEffect(() => {
    if (!products || products.length === 0) return;
    const hasUnset = products.some((p) => p.isActive === undefined);
    if (hasUnset) {
      const fixed = products.map((p) => ({
        ...p,
        isActive: p.isActive !== false,
      }));
      const currentWs = profile?.organizationId || profile?.organizationSlug || defaultSlug;
      const targetSlug =
        activeOvelink?.slug ||
        profile?.organizationSlug ||
        defaultSlug ||
        "my-brand";

      saveProducts(fixed, currentWs);
      if (targetSlug && targetSlug !== currentWs) saveProducts(fixed, targetSlug);
      if (profile?.organizationSlug) saveProducts(fixed, profile.organizationSlug);
      if (profile?.organizationId) saveProducts(fixed, profile.organizationId);

      try {
        const ovelink = getOvelink(targetSlug, profile?.organizationName, currentWs);
        const orderOfferings: OvelinkOffering[] = fixed.map((p) => ({
          id: p.id,
          type: "order" as const,
          name: p.name,
          description: p.description || "Curated physical product.",
          priceCents: p.priceCents,
          depositCents: p.depositCents ?? p.priceCents,
          requiresTimeSlot: false,
          badge: p.badge,
          category: p.category || "Products",
          categoryId: p.categoryId,
          subCategoryId: p.subCategoryId,
          subCategories: p.subCategories,
          imageUrl: p.imageUrl,
          imageUrls: p.imageUrls,
          stockCount: p.stockCount,
          sku: p.sku,
          slug: p.slug,
          isActive: p.isActive !== false,
        }));
        const nonOrders = (ovelink.offerings || []).filter((o) => o.type !== "order");
        saveOvelink({
          ...ovelink,
          offerings: [...nonOrders, ...orderOfferings],
        });
      } catch {
        // safe
      }
    }
  }, [products, profile, activeOvelink, defaultSlug]);

  const toggleProductActive = (prod: ProductItem) => {
    playClick();
    const newActive = prod.isActive === false;
    const updated = products.map((p) => (p.id === prod.id ? { ...p, isActive: newActive } : p));
    const currentWs = profile?.organizationId || profile?.organizationSlug || defaultSlug;
    const targetSlug =
      activeOvelink?.slug ||
      profile?.organizationSlug ||
      defaultSlug ||
      "my-brand";

    saveProducts(updated, currentWs);
    if (targetSlug && targetSlug !== currentWs) {
      saveProducts(updated, targetSlug);
    }
    if (profile?.organizationSlug && profile.organizationSlug !== currentWs && profile.organizationSlug !== targetSlug) {
      saveProducts(updated, profile.organizationSlug);
    }
    if (profile?.organizationId && profile.organizationId !== currentWs) {
      saveProducts(updated, profile.organizationId);
    }

    try {
      const ovelink = getOvelink(targetSlug, profile?.organizationName, currentWs);
      const updatedOfferings = (ovelink.offerings || []).map((o) =>
        o.id === prod.id ? { ...o, isActive: newActive } : o
      );
      if (!updatedOfferings.some((o) => o.id === prod.id) && newActive) {
        updatedOfferings.push({
          id: prod.id,
          type: "order",
          name: prod.name,
          description: prod.description || "Curated physical product.",
          priceCents: prod.priceCents,
          depositCents: prod.depositCents ?? prod.priceCents,
          requiresTimeSlot: false,
          badge: prod.badge,
          category: prod.category || "Products",
          categoryId: prod.categoryId,
          subCategoryId: prod.subCategoryId,
          subCategories: prod.subCategories,
          imageUrl: prod.imageUrl,
          imageUrls: prod.imageUrls,
          stockCount: prod.stockCount,
          sku: prod.sku,
          slug: prod.slug,
          isActive: true,
        });
      }
      saveOvelink({
        ...ovelink,
        offerings: updatedOfferings,
      });
    } catch {
      // safe fallback
    }

    showToast(newActive ? `Product "${prod.name}" published to Ovelink` : `Product "${prod.name}" hidden from public store`);
  };

  const publishAllHiddenProducts = () => {
    playSuccess();
    const updated = products.map((p) => ({ ...p, isActive: true }));
    const currentWs = profile?.organizationId || profile?.organizationSlug || defaultSlug;
    const targetSlug =
      activeOvelink?.slug ||
      profile?.organizationSlug ||
      defaultSlug ||
      "my-brand";

    saveProducts(updated, currentWs);
    if (targetSlug && targetSlug !== currentWs) {
      saveProducts(updated, targetSlug);
    }
    if (profile?.organizationSlug && profile.organizationSlug !== currentWs && profile.organizationSlug !== targetSlug) {
      saveProducts(updated, profile.organizationSlug);
    }
    if (profile?.organizationId && profile.organizationId !== currentWs) {
      saveProducts(updated, profile.organizationId);
    }

    try {
      const ovelink = getOvelink(targetSlug, profile?.organizationName, currentWs);
      const productOrderMap = new Map((ovelink.offerings || []).map((o) => [o.id, o]));
      const newOfferings: OvelinkOffering[] = updated.map((prod) => {
        const existing = productOrderMap.get(prod.id);
        if (existing) {
          return { ...existing, isActive: true };
        }
        return {
          id: prod.id,
          type: "order",
          name: prod.name,
          description: prod.description || "Curated physical product.",
          priceCents: prod.priceCents,
          depositCents: prod.depositCents ?? prod.priceCents,
          requiresTimeSlot: false,
          badge: prod.badge,
          category: prod.category || "Products",
          categoryId: prod.categoryId,
          subCategoryId: prod.subCategoryId,
          subCategories: prod.subCategories,
          imageUrl: prod.imageUrl,
          imageUrls: prod.imageUrls,
          stockCount: prod.stockCount,
          sku: prod.sku,
          slug: prod.slug,
          isActive: true,
        };
      });
      const nonOrders = (ovelink.offerings || []).filter((o) => o.type !== "order");
      saveOvelink({
        ...ovelink,
        offerings: [...nonOrders, ...newOfferings],
      });
    } catch {
      // safe fallback
    }

    showToast("All products published live to your Ovelink store");
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductId && capacity.isAtCapacity) {
      setIsAddProductOpen(false);
      setIsCapacityModalOpen(true);
      return;
    }

    const priceCents = dollarsToCents(Number(productPrice)) ?? 0;
    if (!productName.trim() || priceCents < 0) {
      showToast("Please provide product title and valid price");
      return;
    }

    playSuccess();

    const targetId = editingProductId || "prod_" + Date.now().toString(36);
    const cleanSlug = productSlug.trim()
      ? productSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
      : productName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const newOrUpdated: ProductItem = {
      id: targetId,
      name: productName.trim(),
      description: productDesc.trim() || "Retail merchandise product.",
      priceCents,
      sku: productSku.trim() || undefined,
      stockCount: Number(productStock) || 0,
      category: productCategory.trim() || "Retail",
      categoryId: productCategoryId || undefined,
      badge: productBadge.trim() || undefined,
      requiresShipping: productRequiresShipping,
      imageUrl: productImageUrl.trim() || undefined,
      subCategories: productSubCategories,
      slug: cleanSlug,
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      seoKeywords: seoKeywords.trim() || undefined,
      isActive: productIsActive ?? true,
    };

    const currentWs = profile?.organizationId || profile?.organizationSlug || defaultSlug;
    const targetSlug =
      activeOvelink?.slug ||
      profile?.organizationSlug ||
      defaultSlug ||
      (profile?.organizationId ? `biz-${profile.organizationId.replace(/^org_/, "").slice(-6)}` : "my-brand");
    let updatedProducts: ProductItem[];

    if (editingProductId) {
      updatedProducts = products.map((p) => (p.id === editingProductId ? newOrUpdated : p));
    } else {
      updatedProducts = [...products, newOrUpdated];
    }

    saveProducts(updatedProducts, currentWs);
    if (targetSlug && targetSlug !== currentWs) {
      saveProducts(updatedProducts, targetSlug);
    }
    if (profile?.organizationSlug && profile.organizationSlug !== currentWs && profile.organizationSlug !== targetSlug) {
      saveProducts(updatedProducts, profile.organizationSlug);
    }
    if (profile?.organizationId && profile.organizationId !== currentWs) {
      saveProducts(updatedProducts, profile.organizationId);
    }

    // Sync into Ovelink offering
    try {
      const ovelink = getOvelink(targetSlug, profile?.organizationName, currentWs);
      const newOff: OvelinkOffering = {
        id: newOrUpdated.id,
        type: "order",
        name: newOrUpdated.name,
        description: newOrUpdated.description,
        priceCents: newOrUpdated.priceCents,
        depositCents: newOrUpdated.depositCents ?? newOrUpdated.priceCents,
        requiresTimeSlot: false,
        badge: newOrUpdated.badge,
        category: newOrUpdated.category,
        categoryId: newOrUpdated.categoryId,
        subCategoryId: newOrUpdated.subCategoryId,
        subCategories: newOrUpdated.subCategories,
        imageUrl: newOrUpdated.imageUrl,
        imageUrls: newOrUpdated.imageUrls,
        stockCount: newOrUpdated.stockCount,
        sku: newOrUpdated.sku,
        slug: newOrUpdated.slug,
        isActive: newOrUpdated.isActive !== false,
      };
      const remaining = (ovelink.offerings || []).filter((o) => o.id !== targetId);
      saveOvelink({
        ...ovelink,
        offerings: [...remaining, newOff],
      });
    } catch {
      // safe fallback
    }

    setIsAddProductOpen(false);
    showToast(editingProductId ? `Product "${newOrUpdated.name}" updated` : `Product "${newOrUpdated.name}" published to Ovelink`);
  };

  const confirmDeleteProduct = () => {
    if (!deletingProduct) return;
    playClick();
    const { id: productId, name: pName } = deletingProduct;
    const currentWs = profile?.organizationId || profile?.organizationSlug;
    const targetSlug =
      activeOvelink?.slug ||
      profile?.organizationSlug ||
      (profile?.organizationId ? `biz-${profile.organizationId.replace(/^org_/, "").slice(-6)}` : "my-brand");

    const updated = products.filter((p) => p.id !== productId);
    saveProducts(updated, currentWs);
    if (targetSlug && targetSlug !== currentWs) {
      saveProducts(updated, targetSlug);
    }
    if (profile?.organizationSlug && profile.organizationSlug !== currentWs && profile.organizationSlug !== targetSlug) {
      saveProducts(updated, profile.organizationSlug);
    }
    if (profile?.organizationId && profile.organizationId !== currentWs) {
      saveProducts(updated, profile.organizationId);
    }

    try {
      const ovelink = getOvelink(targetSlug, profile?.organizationName, currentWs);
      saveOvelink({
        ...ovelink,
        offerings: (ovelink.offerings || []).filter((o) => o.id !== productId),
      });
    } catch {
      // safe fallback
    }

    setDeletingProduct(null);
    showToast(`Product "${pName}" deleted`);
  };

  const handleCreateVipPass = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProduct = products.find((p) => p.id === vipSelectedProductId) || products[0];
    if (!targetProduct) {
      showToast("Select a valid product first");
      return;
    }

    playSuccess();

    const pass = createVipPass({
      merchantSlug: defaultSlug,
      merchantId: wsId,
      title: vipTitle || `VIP Offer: ${targetProduct.name}`,
      clientName: vipClientName,
      clientPhone: vipClientPhone,
      offerings: [
        {
          offeringId: targetProduct.id,
          name: targetProduct.name,
          originalPriceCents: targetProduct.priceCents,
          vipPriceCents: dollarsToCents(vipPrice) ?? 0,
          vipDepositCents: 0,
          description: targetProduct.description,
        },
      ],
    });

    setCreatedVipPass(pass);
    showToast("VIP Single-Use Offer Link Created!");
  };

  const handleCopyVipLink = () => {
    if (!createdVipPass) return;
    playClick();
    const url = getVipPassUrl(createdVipPass.merchantSlug, createdVipPass.token);
    navigator.clipboard?.writeText(url);
    setCopiedVipLink(true);
    setTimeout(() => setCopiedVipLink(false), 2000);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategory === "all" || p.category?.toLowerCase() === selectedCategory.toLowerCase();

      const matchStock =
        stockFilter === "all"
          ? true
          : stockFilter === "in_stock"
          ? p.stockCount > 5
          : p.stockCount <= 5;

      return matchSearch && matchCategory && matchStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

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
            Product Inventory &amp; Retail Store
          </h1>
          <p className="text-xs text-[#3A9295] mt-1">
            Manage physical merchandise, inventory stock tracking, variants, image showcases, and shareable links.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <ArcBadge variant="emerald" size="sm">
            {products.length} Products
          </ArcBadge>

          <button
            onClick={() => {
              playClick();
              setCreatedVipPass(null);
              if (products.length > 0) {
                setVipSelectedProductId(products[0].id);
                setVipPrice(Math.round((products[0].priceCents * 0.8) / 100));
              }
              setIsVipModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#105F68] text-[#105F68] bg-white text-xs font-medium hover:bg-[#105F68]/5 transition-all shadow-xs"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Create VIP Offer Link</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Metric Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <ArcMetricCard
          label="Active Merchandise"
          value={products.filter((p) => p.isActive !== false).length}
          subValue="Published on public store"
          icon={Package}
          statusDot="live"
        />
        <ArcMetricCard
          label="Inventory Stock Units"
          value={products.reduce((sum, p) => sum + (p.stockCount || 0), 0)}
          subValue="Available across all products"
          icon={Tag}
          variant="emerald"
        />
        <ArcMetricCard
          label="Low Stock Alert"
          value={products.filter((p) => p.stockCount <= 5).length}
          subValue="Items with 5 or fewer units"
          variant="amber"
          statusDot="warning"
        />
      </div>

      {/* Hidden Products Alert Banner */}
      {products.some((p) => p.isActive === false) && (
        <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>
              <strong>{products.filter((p) => p.isActive === false).length} product{products.filter((p) => p.isActive === false).length > 1 ? "s are" : " is"}</strong> currently hidden from your public Ovelink storefront. Click the <strong>&quot;○ Hidden • Click to Publish&quot;</strong> badge or publish all to make {products.filter((p) => p.isActive === false).length > 1 ? "them" : "it"} immediately visible to customers on <strong>/l/{activeOvelink?.slug || defaultSlug}</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={publishAllHiddenProducts}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition-colors shrink-0 shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Publish All to Store</span>
          </button>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search products by title, SKU, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438] focus:outline-none focus:border-[#105F68]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
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
              title="Table View"
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

      {/* Presentation: EmptyState vs Table vs Grid */}
      {(() => {
        if (filteredProducts.length === 0) {
          return (
            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <EmptyState
                title={products.length === 0 ? "No Products in Your Catalog" : "No Products Match Your Search"}
                description="List your physical retail goods, skincare formulations, apparel, or equipment for immediate online order intake."
                action={
                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Product</span>
                  </button>
                }
              />
            </div>
          );
        }

        if (viewMode === "table") {
          return (
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <SortableDataTable<ProductItem & Record<string, unknown>>
                rows={filteredProducts as (ProductItem & Record<string, unknown>)[]}
                rowKey="id"
                caption="Inventory Products"
                selectable
                selectedKeys={selectedRowKeys}
                onSelectionChange={setSelectedRowKeys}
                itemName={{ one: "product", other: "products" }}
                defaultSort={{ key: "name", direction: "asc" }}
                columns={[
                  {
                    key: "name",
                    label: "Product",
                    sortable: true,
                    render: (_v, row) => (
                      <div className="flex items-center gap-2.5 py-1">
                        {row.imageUrl ? (
                          <img src={row.imageUrl} alt={row.name} className="w-9 h-9 rounded-xl object-cover border border-black/10 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-[#105F68]/10 text-[#105F68] flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-[#105F68] truncate">{row.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono truncate">{row.sku || "No SKU"}</span>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "stockCount",
                    label: "In Stock",
                    numeric: true,
                    sortable: true,
                    render: (_v, row) => (
                      <ArcBadge variant={row.stockCount <= 5 ? "amber" : "neutral"} size="xs">
                        {row.stockCount} units
                      </ArcBadge>
                    ),
                  },
                  {
                    key: "priceCents",
                    label: "Unit Price",
                    numeric: true,
                    sortable: true,
                    render: (_v, row) => (
                      <span className="font-mono font-medium text-[#103438]">
                        {formatCurrency(row.priceCents, currency)}
                      </span>
                    ),
                  },
                  {
                    key: "category",
                    label: "Category",
                    sortable: true,
                    render: (_v, row) => (
                      <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {row.category || "General"}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    label: "Store Status",
                    sortable: true,
                    render: (_v, row) => (
                      <button
                        type="button"
                        onClick={() => toggleProductActive(row as ProductItem)}
                        className="cursor-pointer transition-all hover:scale-105 active:scale-95"
                        title={row.isActive !== false ? "Live on Store. Click to hide." : "Hidden from Store. Click to publish live to Ovelink."}
                      >
                        <ArcBadge variant={row.isActive !== false ? "emerald" : "amber"} size="xs">
                          {row.isActive !== false ? "● Live on Store" : "○ Hidden • Click to Publish"}
                        </ArcBadge>
                      </button>
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
                          onClick={() => handleOpenShare(row)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[10px] font-medium transition-all flex items-center gap-1"
                          title="Share Product Link"
                        >
                          <Share2 className="w-3 h-3 text-[#105F68]" />
                          <span>Share</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[10px] font-medium transition-all flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3 text-slate-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            setDeletingProduct({ id: row.id, name: row.name });
                          }}
                          className="p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Remove product"
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
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="p-5 rounded-2xl border border-black/5 bg-white flex flex-col justify-between space-y-4 hover:border-[#105F68]/20 transition-all shadow-sm"
              >
                <div>
                  {prod.imageUrl && (
                    <div className="w-full h-40 rounded-xl overflow-hidden mb-3 border border-black/5 bg-slate-50">
                      <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-medium text-[#105F68]">{prod.name}</h4>
                        {prod.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                            {prod.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#3A9295] mt-1 line-clamp-2">{prod.description}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenShare(prod)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#105F68] hover:bg-slate-100 transition-colors"
                        title="Share Product Link"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(prod)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#105F68] hover:bg-slate-100 transition-colors"
                        title="Edit Product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          setDeletingProduct({ id: prod.id, name: prod.name });
                        }}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        title="Remove product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ArcBadge variant={prod.stockCount <= 5 ? "amber" : "neutral"} size="xs">
                      {prod.stockCount} in stock
                    </ArcBadge>
                    <button
                      type="button"
                      onClick={() => toggleProductActive(prod)}
                      className="cursor-pointer transition-all hover:scale-105 active:scale-95"
                      title={prod.isActive !== false ? "Live on Public Store. Click to hide." : "Hidden from Public Store. Click to publish live to Ovelink."}
                    >
                      <ArcBadge variant={prod.isActive !== false ? "emerald" : "amber"} size="xs">
                        {prod.isActive !== false ? "● Live on Store" : "○ Hidden • Click to Publish"}
                      </ArcBadge>
                    </button>
                  </div>
                  <span className="text-xs font-mono font-semibold text-[#105F68]">
                    {formatCurrency(prod.priceCents, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* =========================================================================
          ARC UI ANIMATED DIALOG: ADD / EDIT PRODUCT
         ========================================================================= */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent
          title={editingProductId ? "Edit Catalog Product" : "Add Catalog Product"}
          description="Configure product details, inventory stock, image, variants, and SEO meta tags."
        >
          <div className="space-y-4 pt-1">
            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/80 border border-slate-200/80 text-xs">
              <button
                type="button"
                onClick={() => setModalTab("general")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  modalTab === "general"
                    ? "bg-white text-[#105F68] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Core Details
              </button>
              <button
                type="button"
                onClick={() => setModalTab("pricing")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  modalTab === "pricing"
                    ? "bg-white text-[#105F68] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Price &amp; Stock
              </button>
              <button
                type="button"
                onClick={() => setModalTab("categories")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  modalTab === "categories"
                    ? "bg-white text-[#105F68] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Category &amp; Tiers
              </button>
              <button
                type="button"
                onClick={() => setModalTab("seo")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  modalTab === "seo"
                    ? "bg-white text-[#105F68] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                SEO
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* TAB 1: Core Details */}
              {modalTab === "general" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Organic Cotton Hoodie, Signature Ceramic Mug"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438] focus:outline-none focus:border-[#105F68]"
                    />
                  </div>

                  {/* Image Upload using Arc FileDropzone */}
                  <div>
                    <label className="text-slate-600 font-medium block mb-1.5">Product Image</label>
                    <FileDropzone
                      label="Upload Product Image"
                      description="Drag and drop or browse photo from your device"
                      accept="image/png,image/jpeg,image/webp"
                      multiple={false}
                      maxFiles={1}
                      maxSize={5 * 1024 * 1024}
                      compactAt={1}
                      defaultItems={
                        productImageUrl
                          ? [
                              {
                                id: "existing_product_img",
                                name: "Selected Product Photo",
                                size: 1024 * 320,
                                status: "complete",
                                preview: productImageUrl,
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
                            setProductImageUrl(dataUrl);
                            onProgress(100);
                          };
                          reader.readAsDataURL(item.file);
                        }
                      }}
                      onFilesChange={(files) => {
                        if (files.length === 0) {
                          setProductImageUrl("");
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1">Product Badge (Optional)</label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {["Bestseller", "New Arrival", "Limited Edition", "Special Offer"].map((badge) => (
                        <button
                          key={badge}
                          type="button"
                          onClick={() => setProductBadge(productBadge === badge ? "" : badge)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            productBadge === badge
                              ? "bg-[#105F68] text-white border-[#105F68]"
                              : "bg-[#F6FAF9] text-slate-600 border-black/5 hover:border-black/20"
                          }`}
                        >
                          {badge}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1">Description &amp; Highlights</label>
                    <textarea
                      rows={3}
                      placeholder="Product specifications, materials, package contents..."
                      value={productDesc}
                      onChange={(e) => setProductDesc(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438] focus:outline-none focus:border-[#105F68]"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F6FAF9] border border-black/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold block text-[#103438]">Active on Public Store</span>
                        <ArcBadge variant={productIsActive ? "emerald" : "amber"} size="xs">
                          {productIsActive ? "● Live" : "○ Hidden"}
                        </ArcBadge>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {productIsActive
                          ? "Visible to customers for online ordering on your public Ovelink storefront."
                          : "Hidden from your public storefront (draft / private)."}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productIsActive}
                        onChange={(e) => setProductIsActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#105F68]"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: Pricing & Stock */}
              {modalTab === "pricing" && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">
                        Price ({currencySymbol}) *
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={productPrice}
                        onChange={(e) => setProductPrice(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">
                        Stock Quantity (Units)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={productStock}
                        onChange={(e) => setProductStock(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438] font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1">SKU / Product Code</label>
                    <input
                      type="text"
                      placeholder="e.g. OVEL-PROD-001"
                      value={productSku}
                      onChange={(e) => setProductSku(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438] font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F6FAF9] border border-black/5">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#105F68]" />
                      <div>
                        <span className="font-semibold block text-[#103438]">Requires Delivery / Shipping</span>
                        <span className="text-[10px] text-slate-500">Collect client shipping address at checkout</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={productRequiresShipping}
                      onChange={(e) => setProductRequiresShipping(e.target.checked)}
                      className="w-4 h-4 rounded text-[#105F68] focus:ring-0"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: Category & Variants */}
              {modalTab === "categories" && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">
                        Category Link
                      </label>
                      <select
                        value={productCategoryId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProductCategoryId(val);
                          const matched = categories.find((c) => c.id === val);
                          if (matched) setProductCategory(matched.name);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438]"
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
                      <label className="text-slate-600 font-medium block mb-1">
                        Category Label
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Retail, Merchandise"
                        value={productCategory}
                        onChange={(e) => setProductCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438]"
                      />
                    </div>
                  </div>

                  {/* Sub-Categories / Options */}
                  <div className="p-3 rounded-2xl bg-[#105F68]/5 border border-[#105F68]/15 space-y-1">
                    <span className="font-semibold text-[#105F68] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Product Variants &amp; Sub-Category Options</span>
                    </span>
                    <p className="text-[11px] text-slate-600">
                      Configure sizes, finishes, colors, or sub-tier bundles with individual pricing.
                    </p>
                  </div>

                  <SubCategoryManager
                    categories={productSubCategories}
                    onChange={setProductSubCategories}
                    currencySymbol={currencySymbol}
                  />
                </div>
              )}

              {/* TAB 4: SEO Optimization */}
              {modalTab === "seo" && (
                <div className="space-y-3.5">
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 space-y-1">
                    <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Product Search Optimization</span>
                    </span>
                    <p className="text-[11px] text-emerald-800">
                      Optimize how your merchandise appears on Google Search and when shared on social channels.
                    </p>
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1">Product URL Slug</label>
                    <input
                      type="text"
                      placeholder="e.g. cellular-serum-50ml"
                      value={productSlug}
                      onChange={(e) => setProductSlug(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438] font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-600 font-medium">Meta Title</label>
                      <span className="text-[10px] text-slate-400">{(seoTitle || productName).length} / 60 chars</span>
                    </div>
                    <input
                      type="text"
                      placeholder={productName ? `${productName} | Online Store` : "Product Title"}
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-600 font-medium">Meta Description</label>
                      <span className="text-[10px] text-slate-400">{seoDescription.length} / 160 chars</span>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Order online with direct doorstep delivery and secure payment..."
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1">Keywords / Search Tags</label>
                    <input
                      type="text"
                      placeholder="serum, organic, hydration, skincare"
                      value={seoKeywords}
                      onChange={(e) => setSeoKeywords(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438]"
                    />
                  </div>

                  {/* Google SERP Preview */}
                  <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                      Google Search Preview
                    </span>
                    <div className="text-xs text-[#1a0dab] font-medium truncate">
                      {seoTitle || productName || "Product Name"}
                    </div>
                    <div className="text-[11px] text-[#006621] truncate">
                      https://ovel.lk/p/{productSlug || "product"}
                    </div>
                    <div className="text-[11px] text-slate-600 line-clamp-2">
                      {seoDescription || productDesc || "Order this product online with direct instant checkout."}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <DialogClose asChild>
                  <button
                    type="button"
                    className="px-4 py-2.5 rounded-full border border-black/10 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </DialogClose>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-semibold shadow-md"
                >
                  {editingProductId ? "Save Changes" : "Publish Product"}
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          ARC UI ANIMATED DIALOG: SHARE PRODUCT LINK
         ========================================================================= */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent
          title="Share Product"
          description="Send direct purchase links to customers via WhatsApp or direct URL."
        >
          {sharingProduct && (
            <div className="space-y-4 pt-1 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F6FAF9] border border-black/5">
                {sharingProduct.imageUrl ? (
                  <img src={sharingProduct.imageUrl} alt={sharingProduct.name} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-black/10" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#105F68]/10 text-[#105F68] flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-[#105F68]">{sharingProduct.name}</h4>
                  <p className="font-mono text-slate-600">{formatCurrency(sharingProduct.priceCents, currency)}</p>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Direct Shareable Store Link</label>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-[#105F68] break-all select-all">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/l/${defaultSlug}?product=${sharingProduct.id}`
                    : `https://ovel.lk/l/${defaultSlug}?product=${sharingProduct.id}`}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    const url = `${typeof window !== "undefined" ? window.location.origin : "https://ovel.lk"}/l/${defaultSlug}?product=${sharingProduct.id}`;
                    navigator.clipboard?.writeText(url);
                    setCopiedShareLink(true);
                    setTimeout(() => setCopiedShareLink(false), 2500);
                  }}
                  className="flex-1 py-2.5 rounded-full bg-[#105F68] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#0D4F57] transition-all shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedShareLink ? "Copied Link!" : "Copy Link"}</span>
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Check out ${sharingProduct.name}: ${typeof window !== "undefined" ? window.location.origin : "https://ovel.lk"}/l/${defaultSlug}?product=${sharingProduct.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-full bg-emerald-600 text-white font-semibold flex items-center gap-1.5 hover:bg-emerald-700 transition-all shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          )}
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
          <div className="pt-2 text-xs">
            {!createdVipPass ? (
              <form onSubmit={handleCreateVipPass} className="space-y-4">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Pass Headline</label>
                  <input
                    type="text"
                    required
                    value={vipTitle}
                    onChange={(e) => setVipTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438] focus:outline-none focus:border-[#105F68]"
                  />
                </div>

                <div>
                  <label className="text-slate-600 font-medium block mb-1">
                    Special Discounted Price ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={vipPrice}
                    onChange={(e) => setVipPrice(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438] focus:outline-none focus:border-[#105F68]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Clients booking through this private link will lock in this exact promotional rate.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">Client Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Elena Rostova"
                      value={vipClientName}
                      onChange={(e) => setVipClientName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438] focus:outline-none focus:border-[#105F68]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1">Client Phone (Optional)</label>
                    <input
                      type="text"
                      placeholder="+94 77 123 4567"
                      value={vipClientPhone}
                      onChange={(e) => setVipClientPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438] focus:outline-none focus:border-[#105F68]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <DialogClose asChild>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-full border border-black/10 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </DialogClose>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-semibold shadow-md"
                  >
                    Generate Single-Use Link
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>Single-Use VIP Offer Active</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    This private link is ready to send. It immediately burns and auto-expires as soon as the client locks in their order.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F6FAF9] border border-black/10 flex items-center justify-between text-xs font-mono text-[#105F68]">
                  <span className="truncate pr-2">{getVipPassUrl(createdVipPass.merchantSlug, createdVipPass.token)}</span>
                  <button
                    onClick={handleCopyVipLink}
                    className="px-3 py-1.5 rounded-xl bg-[#105F68] text-white text-xs font-sans shrink-0 hover:bg-[#0D4F57] transition-all flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedVipLink ? "Copied!" : "Copy Link"}</span>
                  </button>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <DialogClose asChild>
                    <button
                      type="button"
                      className="px-5 py-2 rounded-full bg-[#F6FAF9] border border-black/10 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      Done
                    </button>
                  </DialogClose>
                </div>
              </div>
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
          ARC UI ANIMATED DIALOG: DELETE CONFIRMATION
         ========================================================================= */}
      <Dialog open={Boolean(deletingProduct)} onOpenChange={(open) => { if (!open) setDeletingProduct(null); }}>
        <DialogContent
          title="Delete Product?"
          description={deletingProduct ? `Are you sure you want to remove "${deletingProduct.name}" from your catalog?` : ""}
        >
          <div className="space-y-4 pt-2">
            <Alert tone="danger" title="Inventory Removal">
              This item will be permanently removed from your catalog and store checkout.
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
                onClick={confirmDeleteProduct}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold tracking-wide transition-all shadow-sm"
              >
                Delete Product
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
