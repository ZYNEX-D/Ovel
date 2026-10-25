"use client";

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useId,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, ZoomIn, ZoomOut, Check, AlertCircle, RefreshCw, X } from "lucide-react";
import { motionTokens } from "../lib/motion-tokens";

export interface AvatarUploadHandle {
  open: () => void;
  selectFile: (file: File) => void;
}

export interface AvatarUploadProps {
  name: string;
  src?: string;
  onUpload: (
    image: Blob,
    context: { report: (progress: number) => void; signal: AbortSignal; original: File }
  ) => Promise<string | void>;
  onRemove?: () => void;
  onError?: (error: { code: "type" | "size" | "decode" | "upload"; message: string }) => void;
  accept?: string[];
  maxSize?: number;
  size?: number;
  outputSize?: number;
  label?: string;
  hint?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  ref?: React.Ref<AvatarUploadHandle>;
}

type UploadState = "idle" | "cropping" | "uploading" | "settling" | "error";

export function AvatarUpload({
  name,
  src,
  onUpload,
  onRemove,
  onError,
  accept = ["image/png", "image/jpeg", "image/webp"],
  maxSize = 5242880,
  size = 88,
  outputSize = 512,
  label = "Profile photo",
  hint,
  disabled = false,
  className = "",
  style,
  ref,
}: AvatarUploadProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // States
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(src);
  const [state, setState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Cropper states
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number }>({
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync external src
  useEffect(() => {
    setPhotoUrl(src);
  }, [src]);

  // Compute initials fallback
  const initials = (() => {
    const parts = (name || "Ovel").trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (name?.slice(0, 2) || "OV").toUpperCase();
  })();

  // Handle file validation and loading for crop
  const processFile = useCallback(
    (file: File) => {
      setErrorMessage(null);
      if (disabled) return;

      if (!accept.includes(file.type)) {
        const err = { code: "type" as const, message: "File type not supported. Please choose a PNG, JPEG, or WebP image." };
        setErrorMessage(err.message);
        onError?.(err);
        return;
      }

      if (file.size > maxSize) {
        const mb = Math.round(maxSize / (1024 * 1024));
        const err = { code: "size" as const, message: `Image is too large. Please select a file under ${mb} MB.` };
        setErrorMessage(err.message);
        onError?.(err);
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        setImageElement(img);
        setActiveFile(file);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setState("cropping");
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        const err = { code: "decode" as const, message: "Could not read this image file. Please try another." };
        setErrorMessage(err.message);
        onError?.(err);
      };
      img.src = objectUrl;
    },
    [accept, disabled, maxSize, onError]
  );

  useImperativeHandle(ref, () => ({
    open: () => fileInputRef.current?.click(),
    selectFile: (file: File) => processFile(file),
  }));

  // Perform canvas extraction and upload
  const handleSaveCrop = async () => {
    if (!imageElement || !activeFile) return;

    setState("uploading");
    setUploadProgress(0);
    setErrorMessage(null);

    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setState("error");
      setErrorMessage("Could not initialize crop canvas.");
      return;
    }

    const CROP_STAGE_SIZE = 184;
    const scale = Math.max(CROP_STAGE_SIZE / imageElement.naturalWidth, CROP_STAGE_SIZE / imageElement.naturalHeight) * zoom;
    const renderedWidth = imageElement.naturalWidth * scale;
    const renderedHeight = imageElement.naturalHeight * scale;

    const sourceScale = outputSize / CROP_STAGE_SIZE;
    const drawWidth = renderedWidth * sourceScale;
    const drawHeight = renderedHeight * sourceScale;
    const drawX = (outputSize - drawWidth) / 2 + offset.x * sourceScale;
    const drawY = (outputSize - drawHeight) / 2 + offset.y * sourceScale;

    ctx.fillStyle = "#FFFFFF";
    ctx.drawImage(imageElement, drawX, drawY, drawWidth, drawHeight);

    const mimeType = activeFile.type === "image/png" ? "image/png" : "image/jpeg";
    const quality = mimeType === "image/jpeg" ? 0.92 : undefined;

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setState("error");
          setErrorMessage("Failed to encode cropped image.");
          return;
        }

        const previewUrl = URL.createObjectURL(blob);
        setPhotoUrl(previewUrl);

        abortControllerRef.current = new AbortController();

        try {
          const result = await onUpload(blob, {
            report: (percent) => setUploadProgress(Math.min(1, Math.max(0, percent))),
            signal: abortControllerRef.current.signal,
            original: activeFile,
          });

          setState("settling");
          setUploadProgress(1);

          setTimeout(() => {
            if (typeof result === "string" && result) {
              setPhotoUrl(result);
            }
            setState("idle");
          }, 480);
        } catch (err: unknown) {
          setState("error");
          const msg = (err as Error)?.message || "Upload failed. Please try again.";
          setErrorMessage(msg);
          onError?.({ code: "upload", message: msg });
        }
      },
      mimeType,
      quality
    );
  };

  const handleCancelCrop = () => {
    setState("idle");
    setActiveFile(null);
    setImageElement(null);
    setErrorMessage(null);
  };

  // Drag handling inside crop stage
  const handlePointerDown = (e: React.PointerEvent) => {
    if (state !== "cropping") return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || state !== "cropping") return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const maxShift = (184 / 2) * (zoom - 0.7);
    const newX = Math.max(-maxShift, Math.min(maxShift, dragStartRef.current.offsetX + dx));
    const newY = Math.max(-maxShift, Math.min(maxShift, dragStartRef.current.offsetY + dy));
    setOffset({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Wheel zoom handling
  const handleWheel = (e: React.WheelEvent) => {
    if (state !== "cropping") return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.max(1, Math.min(3, prev + factor)));
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (state !== "cropping") return;
    const step = e.shiftKey ? 10 : 3;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setOffset((p) => ({ ...p, x: p.x - step }));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setOffset((p) => ({ ...p, x: p.x + step }));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOffset((p) => ({ ...p, y: p.y - step }));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setOffset((p) => ({ ...p, y: p.y + step }));
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      setZoom((z) => Math.min(3, z + 0.1));
    } else if (e.key === "-") {
      e.preventDefault();
      setZoom((z) => Math.max(1, z - 0.1));
    } else if (e.key === "0") {
      e.preventDefault();
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    } else if (e.key === "Enter") {
      e.preventDefault();
      void handleSaveCrop();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelCrop();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col sm:flex-row items-center sm:items-start gap-5 select-none ${className}`}
      style={style}
    >
      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept={accept.join(",")}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
            e.target.value = "";
          }
        }}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {state === "cropping" ? (
          /* CROP STAGE */
          <motion.div
            key="crop-stage"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={motionTokens.spring.smooth}
            className="flex flex-col items-center bg-[#F6FAF9] p-5 rounded-[2rem] border border-[#105F68]/20 shadow-lg w-full max-w-sm"
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <div className="text-center mb-3">
              <span className="text-xs font-semibold text-[#105F68] block">
                Crop &amp; Reposition
              </span>
              <span className="text-[10px] text-[#3A9295]">
                Drag to center • Scroll or use slider to zoom
              </span>
            </div>

            {/* Circular Crop Mask Viewport */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
              className="relative w-[184px] h-[184px] rounded-full overflow-hidden cursor-grab active:cursor-grabbing border-2 border-[#105F68] shadow-inner bg-slate-900 touch-none flex items-center justify-center select-none"
            >
              {imageElement && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageElement.src}
                  alt="Crop preview"
                  draggable={false}
                  className="pointer-events-none select-none max-w-none transition-transform duration-75 ease-out"
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transformOrigin: "center center",
                  }}
                />
              )}

              {/* Viewfinder crosshairs / circular guide ring */}
              <div className="absolute inset-0 rounded-full border border-white/30 pointer-events-none" />
            </div>

            {/* Zoom Slider Controls */}
            <div className="flex items-center gap-2.5 w-full max-w-[200px] mt-4">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                className="p-1 rounded-lg hover:bg-black/5 text-[#105F68]"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 h-1.5 bg-black/10 rounded-lg appearance-none cursor-pointer accent-[#105F68]"
              />

              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                className="p-1 rounded-lg hover:bg-black/5 text-[#105F68]"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4 w-full">
              <button
                type="button"
                onClick={handleSaveCrop}
                className="flex-1 py-2 px-3 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-medium transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-[#63C1BB]" />
                <span>Save</span>
              </button>

              <button
                type="button"
                onClick={handleCancelCrop}
                className="py-2 px-3.5 rounded-full border border-black/10 hover:bg-black/5 text-slate-600 text-xs font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          /* STANDARD / UPLOADING AVATAR VIEW */
          <motion.div
            key="avatar-circle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={motionTokens.spring.snappy}
            className="flex items-center gap-4"
          >
            {/* Avatar Circle Container */}
            <div
              onClick={() => {
                if (state !== "uploading" && !disabled) {
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  processFile(e.dataTransfer.files[0]);
                }
              }}
              className={`relative rounded-full cursor-pointer group flex items-center justify-center transition-all ${
                isDragging ? "ring-4 ring-[#105F68] scale-105" : ""
              } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
              style={{ width: size, height: size }}
              title={photoUrl ? "Click to change photo" : "Click to upload photo"}
            >
              {/* Photo or Initials */}
              <div
                className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold text-xl border-2 transition-all ${
                  state === "error"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-[#105F68]/20 bg-gradient-to-br from-[#105F68] to-[#0D4F57] text-[#C8E6E2]"
                } ${state === "uploading" ? "scale-90 opacity-80" : "scale-100 opacity-100"}`}
              >
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              {/* Uploading Circular Progress Ring */}
              {state === "uploading" && (
                <svg
                  className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    className="stroke-black/10 fill-none"
                    strokeWidth="4"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    className="stroke-[#105F68] fill-none transition-all duration-300"
                    strokeWidth="4"
                    strokeDasharray={289}
                    strokeDashoffset={289 - 289 * uploadProgress}
                    strokeLinecap="round"
                  />
                </svg>
              )}

              {/* Settling Success Ring Burst */}
              {state === "settling" && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 1 }}
                  animate={{ scale: 1.25, opacity: 0 }}
                  transition={{ duration: 0.48 }}
                  className="absolute inset-0 rounded-full border-2 border-emerald-500 pointer-events-none"
                />
              )}

              {/* Hover Camera Overlay Icon */}
              {state === "idle" && !disabled && (
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera className="w-5 h-5 drop-shadow-sm" />
                </div>
              )}
            </div>

            {/* Labels and Controls Beside Avatar */}
            <div className="space-y-1.5 min-w-0">
              <span className="text-xs font-semibold text-[#105F68] block">
                {label}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={disabled || state === "uploading"}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-full border border-black/10 hover:border-[#105F68]/30 bg-white text-xs font-medium text-[#105F68] transition-all shadow-2xs hover:bg-[#F6FAF9] disabled:opacity-50"
                >
                  {photoUrl ? "Change Photo" : "Upload Photo"}
                </button>

                {photoUrl && onRemove && state === "idle" && !disabled && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl(undefined);
                      onRemove();
                    }}
                    className="px-2.5 py-1.5 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-medium transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>

              {hint ? (
                <div className="text-[10px] text-[#3A9295] leading-tight">
                  {hint}
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 block leading-tight">
                  PNG, JPG or WebP up to 5 MB
                </span>
              )}

              {/* Inline Error Message */}
              {errorMessage && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] font-medium leading-tight">{errorMessage}</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] underline font-medium hover:text-rose-700 ml-1 shrink-0"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AvatarUpload;
