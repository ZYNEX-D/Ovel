"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { 
  Plus, 
  FolderTree, 
  Folder, 
  Layers, 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  Edit3, 
  Upload, 
  Image as ImageIcon, 
  Globe, 
  Sparkles, 
  Search,
  Check,
  ShoppingBag,
  Package
} from "lucide-react";
import { 
  getCategories, 
  saveCategories, 
  UniversalCategory, 
  getServices, 
  getProducts 
} from "@/lib/platform-store";
import { useClientStore, useHydrated } from "@/lib/use-client-store";
import { useAuth } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";
import { ArcMetricCard } from "@/components/ui/ArcMetricCard";
import { ArcBadge } from "@/components/ui/ArcBadge";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { FileDropzone } from "@/components/arc/file-dropzone/file-dropzone";
import { Dialog, DialogContent, DialogClose } from "@/components/arc/dialog/dialog";
import Toast from "@/components/arc/toast/toast";
import Alert from "@/components/arc/alert/alert";

export default function DashboardCategoriesPage() {
  const { profile, isLoading } = useAuth();
  const { playClick, playSuccess } = useAudio();
  const hydrated = useHydrated();
  const wsId = profile?.organizationId || profile?.organizationSlug;

  const readCategories = useCallback(() => getCategories(wsId), [wsId]);
  const categories = useClientStore(readCategories, () => []);

  const readServices = useCallback(() => getServices(wsId), [wsId]);
  const services = useClientStore(readServices, () => []);

  const readProducts = useCallback(() => getProducts(wsId), [wsId]);
  const products = useClientStore(readProducts, () => []);

  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<string | null>(null);

  // Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<UniversalCategory | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [targetType, setTargetType] = useState<"services" | "products" | "both">("both");
  const [imageUrl, setImageUrl] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [modalTab, setModalTab] = useState<"general" | "seo">("general");

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const toggleCollapse = (id: string) => {
    setCollapsedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Flat list of all categories for parent selector
  const flattenCategories = (cats: UniversalCategory[], prefix = ""): Array<{ id: string; name: string }> => {
    let result: Array<{ id: string; name: string }> = [];
    for (const c of cats) {
      result.push({ id: c.id, name: prefix ? `${prefix} > ${c.name}` : c.name });
      if (c.subCategories && c.subCategories.length > 0) {
        result = result.concat(flattenCategories(c.subCategories, prefix ? `${prefix} > ${c.name}` : c.name));
      }
    }
    return result;
  };

  const flatCategoryOptions = useMemo(() => flattenCategories(categories), [categories]);

  // Count total categories recursively
  const countAllCategories = (cats: UniversalCategory[]): number => {
    return cats.reduce((acc, c) => acc + 1 + (c.subCategories ? countAllCategories(c.subCategories) : 0), 0);
  };

  const totalCategoriesCount = useMemo(() => countAllCategories(categories), [categories]);

  const openAddCategoryModal = (parentId: string | null = null) => {
    playClick();
    setEditingCategoryId(null);
    setParentCategoryId(parentId);
    setName("");
    setSlug("");
    setDescription("");
    setTargetType("both");
    setImageUrl("");
    setSeoTitle("");
    setSeoDescription("");
    setSeoKeywords("");
    setModalTab("general");
    setIsCategoryModalOpen(true);
  };

  // Find node by ID
  const findCategory = (cats: UniversalCategory[], id: string): UniversalCategory | null => {
    for (const c of cats) {
      if (c.id === id) return c;
      if (c.subCategories) {
        const found = findCategory(c.subCategories, id);
        if (found) return found;
      }
    }
    return null;
  };

  const openEditCategoryModal = (cat: UniversalCategory) => {
    playClick();
    setEditingCategoryId(cat.id);
    setParentCategoryId(cat.parentId || null);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setTargetType(cat.targetType || "both");
    setImageUrl(cat.imageUrl || "");
    setSeoTitle(cat.seoTitle || "");
    setSeoDescription(cat.seoDescription || "");
    setSeoKeywords(cat.seoKeywords || "");
    setModalTab("general");
    setIsCategoryModalOpen(true);
  };

  // Handle Image Upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast("Please choose an image under 3MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string);
        showToast("Category image loaded");
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Category (Insert or Update recursively)
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Please enter a category name");
      return;
    }

    playSuccess();

    const cleanSlug = slug.trim()
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const categoryId = editingCategoryId || "cat_" + Date.now().toString(36);

    const categoryData: UniversalCategory = {
      id: categoryId,
      name: name.trim(),
      slug: cleanSlug,
      description: description.trim() || undefined,
      targetType,
      imageUrl: imageUrl.trim() || undefined,
      parentId: parentCategoryId,
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      seoKeywords: seoKeywords.trim() || undefined,
      isActive: true,
      subCategories: editingCategoryId
        ? findCategory(categories, editingCategoryId)?.subCategories || []
        : [],
    };

    let updatedCategories: UniversalCategory[] = [];

    if (editingCategoryId) {
      // Recursive update
      const updateRecursive = (list: UniversalCategory[]): UniversalCategory[] => {
        return list.map((c) => {
          if (c.id === editingCategoryId) {
            return { ...categoryData, subCategories: c.subCategories };
          }
          if (c.subCategories && c.subCategories.length > 0) {
            return { ...c, subCategories: updateRecursive(c.subCategories) };
          }
          return c;
        });
      };
      updatedCategories = updateRecursive(categories);
    } else {
      // Insertion
      if (!parentCategoryId) {
        updatedCategories = [...categories, categoryData];
      } else {
        const insertRecursive = (list: UniversalCategory[]): UniversalCategory[] => {
          return list.map((c) => {
            if (c.id === parentCategoryId) {
              return {
                ...c,
                subCategories: [...(c.subCategories || []), categoryData],
              };
            }
            if (c.subCategories && c.subCategories.length > 0) {
              return { ...c, subCategories: insertRecursive(c.subCategories) };
            }
            return c;
          });
        };
        updatedCategories = insertRecursive(categories);
      }
    }

    saveCategories(updatedCategories, wsId);
    setIsCategoryModalOpen(false);
    showToast(editingCategoryId ? `Category "${name}" updated` : `Category "${name}" created`);
  };

  // Delete Category
  const confirmDeleteCategory = () => {
    if (!deletingCategory) return;
    playClick();
    const idToDelete = deletingCategory.id;

    const deleteRecursive = (list: UniversalCategory[]): UniversalCategory[] => {
      return list
        .filter((c) => c.id !== idToDelete)
        .map((c) => ({
          ...c,
          subCategories: c.subCategories ? deleteRecursive(c.subCategories) : [],
        }));
    };

    const updated = deleteRecursive(categories);
    saveCategories(updated, wsId);
    setDeletingCategory(null);
    showToast(`Category "${deletingCategory.name}" removed`);
  };

  // Check matching items count
  const getItemCount = (categoryName: string, categoryId: string) => {
    const sCount = services.filter(
      (s) => s.category?.toLowerCase() === categoryName.toLowerCase() || s.categoryId === categoryId
    ).length;
    const pCount = products.filter(
      (p) => p.category?.toLowerCase() === categoryName.toLowerCase() || p.categoryId === categoryId
    ).length;
    return { services: sCount, products: pCount, total: sCount + pCount };
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

  // Recursive Category Tree Item
  const renderCategoryTree = (list: UniversalCategory[], depth = 0): React.ReactNode => {
    return list.map((cat) => {
      const isCollapsed = Boolean(collapsedNodes[cat.id]);
      const hasChildren = Boolean(cat.subCategories && cat.subCategories.length > 0);
      const counts = getItemCount(cat.name, cat.id);

      return (
        <div key={cat.id} className="space-y-2">
          <div
            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
              depth === 0
                ? "bg-white border-slate-200/90 shadow-xs"
                : depth === 1
                ? "bg-[#F6FAF9] border-[#105F68]/20 ml-4 sm:ml-6"
                : "bg-emerald-50/50 border-emerald-200 ml-8 sm:ml-12"
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleCollapse(cat.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-[#105F68] transition-colors"
                  title={isCollapsed ? "Expand" : "Collapse"}
                >
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              ) : (
                <div className="w-6 flex items-center justify-center text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                </div>
              )}

              {/* Category Thumbnail */}
              {cat.imageUrl ? (
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-9 h-9 rounded-xl object-cover border border-black/10 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-[#105F68]/10 text-[#105F68] flex items-center justify-center shrink-0">
                  <Folder className="w-4 h-4" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#103438] truncate">{cat.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">/{cat.slug}</span>
                  <ArcBadge
                    variant={
                      cat.targetType === "services"
                        ? "teal"
                        : cat.targetType === "products"
                        ? "emerald"
                        : "neutral"
                    }
                    size="xs"
                  >
                    {cat.targetType === "services"
                      ? "Services"
                      : cat.targetType === "products"
                      ? "Products"
                      : "Universal"}
                  </ArcBadge>
                  {counts.total > 0 && (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {counts.services > 0 && `${counts.services} Srv `}
                      {counts.products > 0 && `${counts.products} Prod`}
                    </span>
                  )}
                </div>
                {cat.description && (
                  <p className="text-xs text-[#3A9295] truncate mt-0.5">{cat.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => openAddCategoryModal(cat.id)}
                className="px-2.5 py-1 rounded-lg border border-[#105F68]/20 bg-[#F6FAF9] hover:bg-[#105F68]/10 text-[#105F68] text-[11px] font-medium transition-all flex items-center gap-1"
                title="Add Sub-Category"
              >
                <Plus className="w-3 h-3" />
                <span className="hidden sm:inline">Sub-Category</span>
              </button>

              <button
                type="button"
                onClick={() => openEditCategoryModal(cat)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#105F68] hover:bg-slate-100 transition-colors"
                title="Edit Category"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  playClick();
                  setDeletingCategory(cat);
                }}
                className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                title="Remove Category"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isCollapsed && hasChildren && (
            <div className="space-y-2">
              {renderCategoryTree(cat.subCategories!, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
            Category &amp; Taxonomy Hierarchy
          </h1>
          <p className="text-xs text-[#3A9295] mt-1">
            Organize bookable services and products into multi-level categories, sub-categories, and SEO-optimized catalogs.
          </p>
        </div>

        <button
          onClick={() => openAddCategoryModal(null)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Category</span>
        </button>
      </div>

      {/* Metric Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <ArcMetricCard
          label="Total Categories & Tiers"
          value={totalCategoriesCount}
          subValue="Active taxonomies"
          icon={FolderTree}
          statusDot="live"
        />
        <ArcMetricCard
          label="Categorized Services"
          value={services.filter((s) => Boolean(s.category || s.categoryId)).length}
          subValue="Assigned to catalog branches"
          icon={ShoppingBag}
          variant="emerald"
        />
        <ArcMetricCard
          label="Categorized Products"
          value={products.filter((p) => Boolean(p.category || p.categoryId)).length}
          subValue="Online inventory linked"
          icon={Package}
          variant="brand"
        />
      </div>

      {/* Search & Actions Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories by name, slug, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438] focus:outline-none focus:border-[#105F68]"
          />
        </div>
      </div>

      {/* Category Tree View */}
      {categories.length === 0 ? (
        <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <EmptyState
            icon={<FolderTree className="w-6 h-6 text-[#105F68]" />}
            title="No Categories Created Yet"
            description="Create categories and sub-categories to group your products and services cleanly on your public store and booking page."
            action={
              <button
                onClick={() => openAddCategoryModal(null)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Category</span>
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {renderCategoryTree(categories)}
        </div>
      )}

      {/* =========================================================================
          ARC UI ANIMATED DIALOG: ADD / EDIT CATEGORY
         ========================================================================= */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent
          title={editingCategoryId ? "Edit Category" : "Add New Category"}
          description="Configure category details, nesting parent, image, and SEO metadata."
        >
          <div className="space-y-4 pt-1">
            {/* Modal Tabs */}
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
                General Details
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
                SEO &amp; Open Graph
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              {modalTab === "general" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">Category Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Skin Wellness, Hair Care, Retail Essentials"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (!editingCategoryId && !slug) {
                          setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438] focus:outline-none focus:border-[#105F68]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">URL Slug</label>
                      <input
                        type="text"
                        placeholder="e.g. skin-wellness"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">Target Scope</label>
                      <select
                        value={targetType}
                        onChange={(e) => setTargetType(e.target.value as "services" | "products" | "both")}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438]"
                      >
                        <option value="both">Both Services &amp; Products</option>
                        <option value="services">Services Only</option>
                        <option value="products">Products Only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1">
                      Parent Category (Nesting Level)
                    </label>
                    <select
                      value={parentCategoryId || ""}
                      onChange={(e) => setParentCategoryId(e.target.value || null)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438]"
                    >
                      <option value="">Root Category (Top Level)</option>
                      {flatCategoryOptions
                        .filter((c) => c.id !== editingCategoryId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Category Image Upload using Arc FileDropzone */}
                  <div>
                    <label className="text-slate-600 font-medium block mb-1.5">Category Image / Banner</label>
                    <FileDropzone
                      label="Upload Category Image"
                      description="Drag and drop or browse banner from your device"
                      accept="image/png,image/jpeg,image/webp"
                      multiple={false}
                      maxFiles={1}
                      maxSize={5 * 1024 * 1024}
                      compactAt={1}
                      defaultItems={
                        imageUrl
                          ? [
                              {
                                id: "existing_cat_img",
                                name: "Category Banner",
                                size: 1024 * 260,
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
                    <label className="text-slate-600 font-medium block mb-1">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Short description displayed on category pages..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438] focus:outline-none focus:border-[#105F68]"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: SEO */}
              {modalTab === "seo" && (
                <div className="space-y-3.5">
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 space-y-1">
                    <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Search Engine Optimization</span>
                    </span>
                    <p className="text-[11px] text-emerald-800">
                      Customize how this category appears in Google search results and social media embeds.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-600 font-medium">Meta Title</label>
                      <span className="text-[10px] text-slate-400">{(seoTitle || name).length} / 60 chars</span>
                    </div>
                    <input
                      type="text"
                      placeholder={name ? `${name} | Online Store` : "Category Title"}
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
                      placeholder="Explore our curated collection of services and products..."
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1">Keywords / Tags</label>
                    <input
                      type="text"
                      placeholder="wellness, skin, hydration, organic"
                      value={seoKeywords}
                      onChange={(e) => setSeoKeywords(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#103438]"
                    />
                  </div>

                  {/* Google SERP Preview Card */}
                  <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                      Google Search Preview
                    </span>
                    <div className="text-xs text-[#1a0dab] font-medium truncate">
                      {seoTitle || name || "Category Name"}
                    </div>
                    <div className="text-[11px] text-[#006621] truncate">
                      https://ovel.lk/c/{slug || "category"}
                    </div>
                    <div className="text-[11px] text-slate-600 line-clamp-2">
                      {seoDescription || description || "Browse our catalog offerings with direct instant online booking and store checkout."}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
                  className="px-6 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all shadow-sm"
                >
                  {editingCategoryId ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          ARC UI ANIMATED DIALOG: DELETE CATEGORY CONFIRMATION
         ========================================================================= */}
      <Dialog open={Boolean(deletingCategory)} onOpenChange={(open) => { if (!open) setDeletingCategory(null); }}>
        <DialogContent
          title="Delete Category?"
          description={deletingCategory ? `Are you sure you want to remove "${deletingCategory.name}"? Sub-categories nested under this will also be deleted.` : ""}
        >
          <div className="space-y-4 pt-2">
            <Alert tone="danger" title="Taxonomy Removal">
              Existing products or services assigned to this category will simply remain uncategorized.
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
                onClick={confirmDeleteCategory}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold tracking-wide transition-all shadow-sm"
              >
                Delete Category
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
