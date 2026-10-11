import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F6FAF9] text-[#103438] flex flex-col items-center justify-center p-6 text-center font-['Kaleko_105',sans-serif]">
      <div className="w-16 h-16 rounded-full bg-[#C8E6E2] text-[#105F68] flex items-center justify-center font-mono text-xl font-bold mb-4">
        404
      </div>
      <h2 className="text-3xl font-light text-[#105F68] tracking-tight mb-2">
        Page Not Found
      </h2>
      <p className="text-xs text-[#3A9295] max-w-sm mb-6">
        The requested channel or booking route does not exist.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-light tracking-tight hover:bg-[#0D4F57] transition-all"
      >
        Return to Home
      </Link>
    </div>
  );
}
