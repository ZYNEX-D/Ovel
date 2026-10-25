"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Upload,
  File as FileIcon,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { motionTokens } from "../lib/motion-tokens";

export type FileDropzoneStatus = "pending" | "uploading" | "complete" | "error";

export interface FileDropzoneItem {
  id: string;
  name: string;
  size: number;
  status?: FileDropzoneStatus;
  progress?: number;
  error?: string;
  retryable?: boolean;
  file?: File;
  preview?: string;
}

export interface FileDropzoneProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  onFilesChange?: (files: File[]) => void;
  onUpload?: (
    item: FileDropzoneItem,
    options: { onProgress: (percent: number) => void; signal: AbortSignal }
  ) => Promise<void>;
  defaultItems?: FileDropzoneItem[];
  label?: string;
  description?: string;
  listPlacement?: "below" | "inside";
  note?: string;
  dropLabel?: string;
  compactAt?: number;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function FileDropzone({
  accept = "image/*",
  multiple = true,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024,
  onFilesChange,
  onUpload,
  defaultItems = [],
  label = "Add files",
  description = "Drop files here or choose from your device",
  listPlacement = "below",
  note,
  dropLabel = "Release to drop files",
  compactAt,
  disabled = false,
  className = "",
  style,
}: FileDropzoneProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<FileDropzoneItem[]>(defaultItems);
  const [isHovering, setIsHovering] = useState(false);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  // Keep default items in sync if updated externally
  useEffect(() => {
    if (defaultItems && defaultItems.length > 0 && items.length === 0) {
      setItems(defaultItems);
    }
  }, [defaultItems, items.length]);

  const defaultNote =
    note ||
    `Accepted: ${accept.replace(/\/\*/g, "s")} • Up to ${formatFileSize(maxSize)} each`;

  // Start upload for a single item
  const startUpload = useCallback(
    async (item: FileDropzoneItem) => {
      if (!onUpload || !item.file) return;

      const controller = new AbortController();
      abortControllers.current.set(item.id, controller);

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "uploading", progress: 0, error: undefined } : i
        )
      );

      try {
        await onUpload(item, {
          onProgress: (percent) => {
            setItems((prev) =>
              prev.map((i) =>
                i.id === item.id ? { ...i, progress: Math.min(100, Math.max(0, percent)) } : i
              )
            );
          },
          signal: controller.signal,
        });

        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: "complete", progress: 100 } : i
          )
        );
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: "error",
                  error: (err as Error)?.message || "Upload failed",
                  retryable: true,
                }
              : i
          )
        );
      } finally {
        abortControllers.current.delete(item.id);
      }
    },
    [onUpload]
  );

  // Process newly picked or dropped files
  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      if (disabled) return;
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      const remainingSlots = maxFiles - items.length;
      if (remainingSlots <= 0) return;

      const allowedFiles = fileArray.slice(0, multiple ? remainingSlots : 1);
      const newItems: FileDropzoneItem[] = [];

      allowedFiles.forEach((file) => {
        // Validation: size
        if (file.size > maxSize) {
          newItems.push({
            id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            size: file.size,
            status: "error",
            error: `File exceeds ${formatFileSize(maxSize)} limit`,
            retryable: false,
          });
          return;
        }

        const isImage = file.type.startsWith("image/");
        const previewUrl = isImage ? URL.createObjectURL(file) : undefined;

        const newItem: FileDropzoneItem = {
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          status: onUpload ? "pending" : "complete",
          progress: onUpload ? 0 : 100,
          file,
          preview: previewUrl,
        };

        newItems.push(newItem);
      });

      const updatedList = multiple ? [...items, ...newItems] : newItems;
      setItems(updatedList);

      const realFiles = updatedList.map((i) => i.file).filter(Boolean) as File[];
      onFilesChange?.(realFiles);

      if (onUpload) {
        newItems.forEach((item) => {
          if (item.status === "pending") {
            void startUpload(item);
          }
        });
      }
    },
    [disabled, maxFiles, items, multiple, maxSize, onUpload, onFilesChange, startUpload]
  );

  // Remove a row
  const removeItem = (id: string) => {
    const controller = abortControllers.current.get(id);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(id);
    }

    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.preview) {
        URL.revokeObjectURL(target.preview);
      }
      const next = prev.filter((i) => i.id !== id);
      const realFiles = next.map((i) => i.file).filter(Boolean) as File[];
      onFilesChange?.(realFiles);
      return next;
    });
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsHovering(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Clipboard paste support
  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled || !e.clipboardData.files || e.clipboardData.files.length === 0) return;
    handleFiles(e.clipboardData.files);
  };

  const isCompact = compactAt ? items.length >= compactAt : false;

  return (
    <div
      ref={containerRef}
      onPaste={handlePaste}
      tabIndex={0}
      className={`space-y-3 focus:outline-none ${className}`}
      style={style}
    >
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files) {
            handleFiles(e.target.files);
            e.target.value = "";
          }
        }}
        className="hidden"
      />

      {/* DROP TARGET ZONE */}
      <motion.div
        onClick={() => {
          if (!disabled) fileInputRef.current?.click();
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={disabled ? undefined : { scale: 1.004 }}
        whileTap={disabled ? undefined : { scale: 0.996 }}
        transition={motionTokens.spring.snappy}
        className={`relative border-2 border-dashed rounded-3xl cursor-pointer transition-all flex flex-col items-center justify-center text-center select-none ${
          isCompact ? "p-4" : "p-6 sm:p-8"
        } ${
          isHovering
            ? "border-[#105F68] bg-[#C8E6E2]/25 ring-4 ring-[#105F68]/10"
            : "border-black/15 bg-[#F6FAF9] hover:border-[#105F68]/40 hover:bg-[#F6FAF9]/80"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div
          className={`rounded-2xl flex items-center justify-center transition-colors ${
            isCompact ? "w-8 h-8 mb-1.5" : "w-12 h-12 mb-3"
          } ${isHovering ? "bg-[#105F68] text-white" : "bg-[#C8E6E2]/50 text-[#105F68]"}`}
        >
          <Upload className={isCompact ? "w-4 h-4" : "w-6 h-6"} />
        </div>

        <div className="space-y-1">
          <span className="text-xs sm:text-sm font-semibold text-[#105F68] block">
            {isHovering ? dropLabel : label}
          </span>
          {!isCompact && (
            <p className="text-[11px] text-[#3A9295] leading-tight">
              {description}
            </p>
          )}
          <span className="text-[10px] text-slate-400 block pt-0.5">
            {defaultNote}
          </span>
        </div>
      </motion.div>

      {/* FILE LIST ROWS */}
      {items.length > 0 && (
        <div className="space-y-2 pt-1">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                transition={motionTokens.spring.snappy}
                className="overflow-hidden"
              >
                <div className="p-3 rounded-2xl bg-white border border-black/10 shadow-xs flex items-center gap-3">
                  {/* File preview thumbnail or icon */}
                  {item.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.preview}
                      alt={item.name}
                      className="w-10 h-10 rounded-xl object-cover border border-black/10 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                      {item.file?.type.startsWith("image/") ? (
                        <ImageIcon className="w-4 h-4" />
                      ) : (
                        <FileIcon className="w-4 h-4" />
                      )}
                    </div>
                  )}

                  {/* Name and Size */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#105F68] truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {formatFileSize(item.size)}
                      </span>
                    </div>

                    {/* Progress Bar during upload */}
                    {item.status === "uploading" && (
                      <div className="space-y-1">
                        <div className="w-full h-1 bg-black/5 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-[#105F68]"
                            initial={{ width: 0 }}
                            animate={{ width: `${item.progress ?? 0}%` }}
                            transition={{ duration: 0.2 }}
                          />
                        </div>
                        <span className="text-[9px] text-[#3A9295] font-mono block">
                          Uploading... {Math.round(item.progress ?? 0)}%
                        </span>
                      </div>
                    )}

                    {/* Error display */}
                    {item.status === "error" && (
                      <div className="flex items-center gap-1 text-[10px] text-rose-600 font-medium">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item.error || "Upload failed"}</span>
                      </div>
                    )}

                    {/* Completed checkmark */}
                    {item.status === "complete" && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>Ready</span>
                      </div>
                    )}
                  </div>

                  {/* Actions (Retry / Remove) */}
                  <div className="flex items-center gap-1 shrink-0">
                    {item.status === "error" && item.retryable && onUpload && (
                      <button
                        type="button"
                        onClick={() => void startUpload(item)}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-[#105F68] transition-colors"
                        title="Retry upload"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default FileDropzone;
