import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Clock,
  ShoppingBag,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers,
  Send,
  Receipt,
  Users,
  Lock,
  ChevronDown,
  CheckCircle2,
  Star,
  ArrowUpRight,
  HelpCircle,
  Eye,
  Sliders,
  FolderTree,
} from "lucide-react";
import ProgressiveBlur from "@/components/ProgressiveBlur";
import LandingBackground from "@/components/home/LandingBackground";
import HomeHeaderActions from "@/components/home/HomeHeaderActions";
import ClickLink from "@/components/home/ClickLink";
import SavingsCalculator from "@/components/home/SavingsCalculator";
import HeroShowcase from "@/components/home/HeroShowcase";
import HomeFooter from "@/components/home/HomeFooter";

const DEMO_LINKS = [
  {
    slug: "apex-studio",
    name: "Apex Auto Lab",
    category: "Auto Detailing",
    theme: "Velvet Dark • Space Grotesk",
    bg: "bg-[#090D16] text-[#F8FAFC]",
    accent: "text-[#38BDF8]",
    pill: "bg-[#0284C7] text-white",
    type: "Paint Correction & Detailing",
    sampleUrl: "/l/apex-studio",
  },
  {
    slug: "craft-bakes",
    name: "Velvet Crumb Bakes",
    category: "Artisanal Bakery",
    theme: "Warm Clay • Playfair Display",
    bg: "bg-[#FEFCE8] text-[#451A03]",
    accent: "text-[#D97706]",
    pill: "bg-[#854D0E] text-white",
    type: "Custom Cake Orders & Tastings",
    sampleUrl: "/l/craft-bakes",
  },
  {
    slug: "vance-studio",
    name: "Vance Production Loft",
    category: "Studio Rentals",
    theme: "Hyper Minimal • Syne Font",
    bg: "bg-[#FAFAFA] text-[#18181B]",
    accent: "text-[#6366F1]",
    pill: "bg-[#18181B] text-white",
    type: "Hourly Daylight Cyc Bookings",
    sampleUrl: "/l/vance-studio",
  },
  {
    slug: "MyBUsiness",
    name: "L'Éclat Boutique",
    category: "Wellness & Care",
    theme: "Signature Teal • Kaleko 105",
    bg: "bg-[#F6FAF9] text-[#103438]",
    accent: "text-[#63C1BB]",
    pill: "bg-[#105F68] text-white",
    type: "Aesthetic Appointments",
    sampleUrl: "/l/MyBUsiness",
  },
];

const LOOP_STEPS = [
  {
    step: "01",
    name: "Quote & Estimate",
    desc: "Draft bespoke proposals with package options, milestone deliverables, and binding digital e-signatures.",
    badge: "Auto-Convert",
    icon: FileText,
  },
  {
    step: "02",
    name: "Self-Serve Book",
    desc: "Clients select appointments, rental blocks, or custom orders via your sovereign Ovelink with direct card deposits.",
    badge: "Zero Overlaps",
    icon: Calendar,
  },
  {
    step: "03",
    name: "WhatsApp 2-Way",
    desc: "Automated confirmations and reminder dispatches. Clients reply '1' to confirm or '2' to reschedule, cutting no-shows by 25%.",
    badge: "-25% No-Shows",
    icon: MessageSquare,
  },
  {
    step: "04",
    name: "Invoice & Credit",
    desc: "Automated PDF invoices crediting initial deposits, calculating sales tax, and supporting Net 7/15/30 installment terms.",
    badge: "One-Click PDF",
    icon: Sparkles,
  },
  {
    step: "05",
    name: "Direct Settle",
    desc: "100% of collected revenue flows straight into your verified merchant account. Ovel charges a flat rate with 0% commission.",
    badge: "0% Commission",
    icon: DollarSign,
  },
];

const FEATURES_LIST = [
  {
    id: "quotes",
    number: "01",
    title: "Interactive Digital Quotations & E-Signatures",
    summary:
      "Transform informal pricing inquiries into formal client contracts with legal digital signature pads and 1-click invoice conversion.",
    bullets: [
      "Client e-signature capture with timestamps and audit records",
      "Itemized milestone deliverables and customizable package add-ons",
      "Single-click conversion into active invoices upon acceptance",
      "Real-time proposal viewing indicators and client autosuggestion",
    ],
    icon: FileText,
  },
  {
    id: "ovelink",
    number: "02",
    title: "Sovereign Ovelink Storefront (ovel.lk/l/[slug])",
    summary:
      "A tailored public web storefront with custom hero banners, monogram avatars, bespoke color palettes, and real-time catalog search.",
    bullets: [
      "Custom branded URL: ovel.lk/l/your-studio with full responsiveness",
      "Header banner customizer with cover graphics and avatar monograms",
      "Real-time catalog search, category filtering tabs, and pagination",
      "Preset luxury themes: Signature Teal, Velvet Dark, Warm Clay & Minimalist",
    ],
    icon: ExternalLink,
  },
  {
    id: "whatsapp",
    number: "03",
    title: "Automated 2-Way WhatsApp Reminders",
    summary:
      "Native WhatsApp reminders and instant booking receipts. Clients confirm or reschedule directly via WhatsApp, slashing no-shows by 25%.",
    bullets: [
      "Frictionless 2-way client commands: 'Reply 1 to confirm, 2 to reschedule'",
      "Automated PDF deposit receipts dispatched instantly upon booking",
      "Configurable reminder windows (24h, 2h, and custom dispatch times)",
      "Zero app installation required for your clients",
    ],
    icon: MessageSquare,
  },
  {
    id: "invoicing",
    number: "04",
    title: "Intelligent Invoicing, Tax & Installment Credit",
    summary:
      "Professional invoicing engine with automatic deposit deduction, sales tax calculation, Net credit terms, and multi-installment schedules.",
    bullets: [
      "Automatic crediting of upfront deposits against total project balances",
      "Multi-installment payment plans with custom milestone dates",
      "Net 7, Net 15, and Net 30 credit period management with status badges",
      "One-click tax computation and downloadable corporate PDF receipts",
    ],
    icon: Receipt,
  },
  {
    id: "crm",
    number: "05",
    title: "Client Intelligence CRM & Card-on-File Security",
    summary:
      "A unified customer relationship directory with client reliability scores, lifetime spend analytics, and automated late-cancellation penalty charging.",
    bullets: [
      "Automatic client autosuggestion across quotes and invoice drafting",
      "Reliability ratings based on attendance history and punctuality",
      "Encrypted card-on-file tokenization for no-show penalty enforcement",
      "Lifetime value tracking and full historical booking timelines",
    ],
    icon: Users,
  },
  {
    id: "vip",
    number: "06",
    title: "Self-Destructing VIP Links & Waitlist Radar",
    summary:
      "Generate private, single-use booking links that burn after 1 redemption for VIP clients, plus automated radar alerting waitlisted clients when slots open.",
    bullets: [
      "One-time booking URLs that self-destruct upon completion",
      "Secret discounted or unlisted offerings for preferred clients",
      "Automated waitlist notifications triggered immediately upon cancellations",
      "Priority time-slot reservations bypassing public calendars",
    ],
    icon: Lock,
  },
  {
    id: "inventory",
    number: "07",
    title: "Tree-Table Hierarchical Categories & Stock Control",
    summary:
      "Organize complex service and product catalogs using deep tree-table hierarchies with stock tracking, tri-state selection, and quick visibility toggles.",
    bullets: [
      "Nested multi-level categories with parent-child structure",
      "Real-time stock indicators and low-inventory alerts",
      "Tri-state selection for rapid batch updates and archive actions",
      "Instant public visibility toggles for seasonal offerings",
    ],
    icon: FolderTree,
  },
];

const PRICING_TIERS = [
  {
    id: "free",
    name: "Starter",
    price: "0",
    currency: "LKR",
    cadence: "/ month",
    tagline: "Essential tools for independent artists & solo specialists starting out.",
    badge: "Free Forever",
    highlight: false,
    offerings: "Up to 3 Offerings",
    orders: "100 Monthly Bookings / Orders",
    features: [
      "3 active service or product listings",
      "100 orders or appointments per month",
      "0% platform commission on every transaction",
      "Branded public Ovelink (ovel.lk/l/your-name)",
      "Automated WhatsApp booking confirmations",
      "Card-on-file deposit security",
      "Client intelligence directory",
    ],
    ctaText: "Start Free Today",
    ctaHref: "/signup",
  },
  {
    id: "growth",
    name: "Growth",
    price: "500",
    currency: "LKR",
    cadence: "/ month",
    tagline: "For busy studios, clinics & salons ready to automate client workflows.",
    badge: "Most Popular",
    highlight: true,
    offerings: "Up to 10 Offerings",
    orders: "500 Monthly Bookings / Orders",
    features: [
      "10 active service or product listings",
      "500 orders or appointments per month",
      "0% platform commission on every transaction",
      "Full theme customizer (luxury colors & fonts)",
      "Interactive digital quotes with e-signatures",
      "Automated PDF invoicing & tax calculations",
      "2-Way interactive WhatsApp reminders",
      "Single-use VIP pass link generator",
    ],
    ctaText: "Upgrade to Growth",
    ctaHref: "/signup?plan=growth",
  },
  {
    id: "scale",
    name: "Scale",
    price: "1,500",
    currency: "LKR",
    cadence: "/ month",
    tagline: "High-volume operating system for multi-specialist studios and ateliers.",
    badge: "Official Verified",
    highlight: false,
    offerings: "Up to 30 Offerings (+Overflow)",
    orders: "1,500 Monthly Bookings / Orders",
    features: [
      "30 active listings (+1 LKR/order overflow protection)",
      "1,500 orders or appointments per month",
      "0% platform commission on every transaction",
      "Official Verified Storefront Badge on Ovelink",
      "Multi-installment invoices & Net credit terms",
      "Staff shift round-robin scheduling & buffer engine",
      "Customer reliability scores & penalty authorization",
      "Waitlist radar & automated slot release notifications",
    ],
    ctaText: "Scale Your Studio",
    ctaHref: "/signup?plan=scale",
  },
];

const COMPARISON_ROWS = [
  { feature: "Monthly Investment", free: "LKR 0", growth: "LKR 500", scale: "LKR 1,500" },
  { feature: "Platform Take-Rate", free: "0%", growth: "0%", scale: "0%" },
  { feature: "Active Services / Products", free: "3 Listings", growth: "10 Listings", scale: "30 Listings" },
  { feature: "Monthly Orders & Bookings", free: "100 / mo", growth: "500 / mo", scale: "1,500 / mo" },
  { feature: "Overflow Order Protection", free: "Details blurred", growth: "Upgrade required", scale: "+1 LKR / extra order" },
  { feature: "Sovereign Ovelink URL", free: true, growth: true, scale: true },
  { feature: "Theme & Palette Freedom", free: false, growth: true, scale: true },
  { feature: "Digital Quotes & E-Signatures", free: false, growth: true, scale: true },
  { feature: "Automated PDF Invoicing & Tax", free: false, growth: true, scale: true },
  { feature: "2-Way WhatsApp Reminders", free: "Standard Confirmations", growth: "Interactive 2-Way", scale: "Priority 2-Way" },
  { feature: "Single-Use VIP Pass Links", free: false, growth: true, scale: "Unlimited" },
  { feature: "Official Verified Badge", free: false, growth: false, scale: true },
  { feature: "Multi-Installment Credit Terms", free: false, growth: false, scale: true },
  { feature: "Staff Round-Robin Engine", free: false, growth: false, scale: true },
  { feature: "Automated Waitlist Radar", free: false, growth: false, scale: true },
];

const FAQS = [
  {
    q: "Why do you charge 0% commission on transactions?",
    a: "Marketplace platforms take 15% to 25% of your hard-earned revenue simply for routing a booking. Ovel is software, not a middleman. We operate on transparent, flat monthly software tiers, allowing you to keep 100% of what your clients pay you.",
  },
  {
    q: "How do client payments and bank payouts work?",
    a: "Client deposits and payments are processed directly into your connected merchant account (Stripe, direct card gateway, or local bank transfer). Ovel does not hold your funds. Settlements clear directly to your bank account on your standard payout schedule.",
  },
  {
    q: "Can I use Ovel for both appointments and physical products?",
    a: "Yes. Ovel is built on 3 interchangeable commerce engines: Appointments & Shifts, Time-Slot Space Rentals, and Custom Orders & Physical Retail. You can mix and match all three within your single Ovelink.",
  },
  {
    q: "How does the 2-way WhatsApp reminder system function?",
    a: "When a client books an appointment, an automated WhatsApp confirmation is dispatched with booking details and your direct contact. 24 hours prior to the slot, a reminder is sent asking the client to reply '1' to confirm or '2' to reschedule. If they confirm, their reliability status updates immediately in your dashboard.",
  },
  {
    q: "Can I upgrade or cancel my subscription at any time?",
    a: "Yes. You can switch between Starter, Growth, and Scale whenever your booking volume changes. There are no annual lock-ins, setup fees, or cancellation penalties.",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#F6FAF9] text-[#103438] antialiased selection:bg-[#105F68] selection:text-white font-['Kaleko_105',sans-serif] overflow-x-hidden">
      <LandingBackground
        colors={["#105F68", "#63C1BB", "#0D4F57"]}
        rotation={90}
        speed={0.15}
        scale={1.2}
        frequency={0.8}
        warpStrength={0.8}
        mouseInfluence={0.5}
        noise={0.05}
        parallax={0.3}
        iterations={1}
        intensity={0.9}
        bandWidth={6}
        transparent={true}
      />

      <ProgressiveBlur position="top" height="h-24" />

      {/* Architectural Minimalist Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#F6FAF9]/80 backdrop-blur-md border-b border-[#105F68]/10 transition-all duration-300">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 h-20 sm:h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="font-['Disolve'] text-2xl sm:text-3xl text-[#105F68] tracking-tight">
              Ovel
            </span>
            <span className="hidden sm:inline-block text-[9px] font-mono tracking-widest text-[#3A9295] uppercase px-2 py-0.5 rounded border border-[#105F68]/15 bg-white/50">
              Architectural OS
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-xs font-mono uppercase tracking-widest text-[#3A9295]">
            <a href="#engines" className="hover:text-[#105F68] transition-colors">
              Engines
            </a>
            <a href="#process" className="hover:text-[#105F68] transition-colors">
              Process
            </a>
            <a href="#features" className="hover:text-[#105F68] transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-[#105F68] transition-colors">
              Pricing
            </a>
            <a href="#demos" className="hover:text-[#105F68] transition-colors">
              Showroom
            </a>
            <a href="#savings" className="hover:text-[#105F68] transition-colors">
              0% Take-Rate
            </a>
            <a
              href="/forma"
              className="hover:text-[#105F68] transition-colors flex items-center gap-1.5 text-[#105F68] font-semibold"
            >
              <span>Forma 3D</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-[#63C1BB]/20 rounded text-[#105F68] font-mono">
                Live
              </span>
            </a>
          </nav>

          <HomeHeaderActions />
        </div>
      </header>

      <main className="w-full">
        {/* Hero Section: Forma Spaces Architectural Discipline */}
        <section className="px-4 sm:px-8 max-w-7xl mx-auto pt-16 sm:pt-28 pb-16 sm:pb-24 flex flex-col items-center justify-center text-center">
          {/* Eyebrow Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/80 border border-[#105F68]/15 text-xs text-[#105F68] font-medium tracking-wide shadow-sm hover:shadow-md transition-all mb-8 opacity-0 animate-[blurFadeUp_1s_cubic-bezier(0.22,1,0.36,1)_forwards]">
            <span className="w-2 h-2 rounded-full bg-[#63C1BB] animate-ping" />
            <span className="font-mono text-[11px] uppercase tracking-wider">Architectural Commerce OS</span>
            <span className="text-[#3A9295]">•</span>
            <span className="font-semibold text-[#105F68]">0% Take-Rate</span>
          </div>

          {/* Hero Headline */}
          <h1
            className="font-light text-4xl sm:text-6xl md:text-7xl lg:text-[80px] text-[#105F68] leading-[1.06] tracking-tight max-w-5xl mx-auto mb-6 sm:mb-8 opacity-0 animate-[blurFadeUp_1.2s_cubic-bezier(0.22,1,0.36,1)_forwards]"
            style={{ animationDelay: "150ms" }}
          >
            Spaces That Breathe.{" "}
            <br className="hidden sm:inline" />
            <span className="font-['Disolve'] font-normal text-[#105F68]">
              Systems
            </span>{" "}
            That Settle.
          </h1>

          {/* Subtitle */}
          <p
            className="text-base sm:text-xl text-[#245D63] font-normal leading-relaxed max-w-3xl mx-auto mb-8 sm:mb-10 opacity-0 animate-[blurFadeUp_1.2s_cubic-bezier(0.22,1,0.36,1)_forwards]"
            style={{ animationDelay: "300ms" }}
          >
            The sovereign operating system for studios, clinics, lofts, and creative ateliers. Replace disconnected calendar apps, quote creators, PDF billing, and WhatsApp messaging chaos with one pristine Ovelink (
            <span className="font-mono text-[#105F68] font-medium bg-[#C8E6E2]/40 px-2 py-0.5 rounded-md">
              ovel.lk/l/your-name
            </span>
            ). Keep 100% of your earnings.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-wrap items-center justify-center gap-4 w-full mb-10 opacity-0 animate-[blurFadeUp_1.2s_cubic-bezier(0.22,1,0.36,1)_forwards]"
            style={{ animationDelay: "450ms" }}
          >
            <ClickLink
              href="/signup"
              className="bg-[#105F68] text-white px-8 py-4 rounded-full text-base sm:text-lg flex justify-center items-center gap-2 hover:bg-[#0D4F57] hover:shadow-xl hover:shadow-[#105F68]/20 hover:-translate-y-0.5 transition-all duration-300 font-light tracking-tight"
            >
              <span>Create Your Ovelink Free</span>
              <ArrowRight className="w-4 h-4" />
            </ClickLink>

            <a
              href="#pricing"
              className="border border-[#105F68]/20 text-[#105F68] bg-white/80 hover:bg-white hover:border-[#105F68]/40 px-7 py-4 rounded-full text-base sm:text-lg flex justify-center items-center gap-2 hover:-translate-y-0.5 transition-all duration-300 font-light tracking-tight shadow-sm"
            >
              <span>Explore Pricing &amp; Plans</span>
              <ChevronRight className="w-4 h-4 text-[#3A9295]" />
            </a>
          </div>

          {/* Minimalist Trust Guarantees */}
          <div
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#3A9295] tracking-widest uppercase font-mono mb-12 opacity-0 animate-[blurFadeUp_1.2s_cubic-bezier(0.22,1,0.36,1)_forwards]"
            style={{ animationDelay: "550ms" }}
          >
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#105F68]" />
              0% Take-Rate
            </span>
            <span className="opacity-40">•</span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#105F68]" />
              Direct Card Deposits
            </span>
            <span className="opacity-40">•</span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#105F68]" />
              2-Way WhatsApp Reminders
            </span>
            <span className="opacity-40">•</span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#105F68]" />
              Legal Digital Proposals
            </span>
          </div>

          {/* Interactive Hero Showcase */}
          <div
            className="w-full opacity-0 animate-[blurFadeUp_1.3s_cubic-bezier(0.22,1,0.36,1)_forwards]"
            style={{ animationDelay: "650ms" }}
          >
            <HeroShowcase />
          </div>
        </section>

        {/* Section 01: The 3 Core Commerce Engines */}
        <section id="engines" className="py-24 sm:py-32 px-4 sm:px-8 max-w-7xl mx-auto border-t border-[#105F68]/10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <span className="text-xs uppercase font-mono tracking-widest text-[#3A9295]">
                01 / PLATFORM FOUNDATION
              </span>
              <h2 className="text-3xl sm:text-5xl font-light text-[#105F68] tracking-tight mt-3">
                Three Dedicated Engines. <br />
                One Sovereign Link.
              </h2>
            </div>
            <p className="text-sm text-[#3A9295] font-light max-w-md leading-relaxed">
              Whether you trade in professional service hours, rent out private architectural spaces, or craft bespoke products to order, Ovel adapts effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Engine 01 */}
            <div className="group p-8 rounded-3xl bg-white border border-[#105F68]/15 shadow-sm hover:shadow-xl hover:border-[#105F68]/30 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#C8E6E2]/40 text-[#105F68] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#105F68]/5 border border-[#105F68]/15 text-[#105F68]">
                    Engine 01
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-light text-[#105F68]">Appointments &amp; Service Shifts</h3>
                  <p className="text-xs text-[#3A9295] mt-3 leading-relaxed font-light">
                    Engineered for consultants, aesthetic clinics, master barbers, tutors, and therapists. Real-time slot computation with staff shift schedules, automated post-service buffer times, and round-robin specialist distribution.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-black/5 flex items-center justify-between text-xs text-[#105F68] font-light">
                <span>Automated Buffer Engine</span>
                <Check className="w-4 h-4 text-[#63C1BB]" />
              </div>
            </div>

            {/* Engine 02 */}
            <div className="group p-8 rounded-3xl bg-white border border-[#105F68]/15 shadow-sm hover:shadow-xl hover:border-[#105F68]/30 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#9ED5D1]/40 text-[#105F68] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#105F68]/5 border border-[#105F68]/15 text-[#105F68]">
                    Engine 02
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-light text-[#105F68]">Space &amp; Time-Slot Rentals</h3>
                  <p className="text-xs text-[#3A9295] mt-3 leading-relaxed font-light">
                    Tailored for daylight photography cycs, podcast booths, recording studios, vehicle detailing bays, and athletic sanctuaries. Reserve discrete blocks by hour or half-day with zero double-booking lock.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-black/5 flex items-center justify-between text-xs text-[#105F68] font-light">
                <span>Zero Double-Booking Guard</span>
                <Check className="w-4 h-4 text-[#63C1BB]" />
              </div>
            </div>

            {/* Engine 03 */}
            <div className="group p-8 rounded-3xl bg-white border border-[#105F68]/15 shadow-sm hover:shadow-xl hover:border-[#105F68]/30 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#63C1BB]/30 text-[#105F68] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#105F68]/5 border border-[#105F68]/15 text-[#105F68]">
                    Engine 03
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-light text-[#105F68]">Custom Orders &amp; Physical Retail</h3>
                  <p className="text-xs text-[#3A9295] mt-3 leading-relaxed font-light">
                    Built for artisanal bakeries, bespoke florists, culinary pre-orders, print ateliers, and custom craft makers. Supports upfront deposits, custom inscriptions, dietary notes, and scheduled pickup slots.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-black/5 flex items-center justify-between text-xs text-[#105F68] font-light">
                <span>Tree-Table Inventory Control</span>
                <Check className="w-4 h-4 text-[#63C1BB]" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 02: Transaction Lifecycle Flow */}
        <section id="process" className="py-24 sm:py-36 px-4 sm:px-8 max-w-7xl mx-auto border-t border-[#105F68]/10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs uppercase font-mono tracking-widest text-[#3A9295]">
              02 / OPERATIONAL LIFECYCLE
            </span>
            <h2 className="text-3xl sm:text-5xl font-light text-[#105F68] tracking-tight mt-3 mb-5">
              Quote → Book → Remind → Invoice → Settle
            </h2>
            <p className="text-sm sm:text-base text-[#3A9295] font-light leading-relaxed">
              Stop stitching together disconnected software tools. Ovel organizes the entire client transaction lifecycle into one unbroken continuum.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {LOOP_STEPS.map((item, idx) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={item.step}
                  className="group relative p-6 rounded-3xl bg-white border border-[#105F68]/15 hover:border-[#105F68]/35 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-xs font-mono text-[#3A9295]">{item.step}</span>
                      <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-[#C8E6E2]/40 text-[#105F68] font-medium">
                        {item.badge}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-[#C8E6E2]/30 flex items-center justify-center text-[#105F68] mb-4 group-hover:scale-105 transition-transform">
                      <ItemIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-light text-[#105F68] mb-2">{item.name}</h3>
                    <p className="text-xs text-[#3A9295] font-light leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between text-xs text-[#105F68] font-light">
                    <span>Phase 0{idx + 1}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#3A9295] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 03: Complete Architectural Feature Suite */}
        <section id="features" className="py-24 sm:py-32 px-4 sm:px-8 bg-gradient-to-b from-[#F6FAF9] via-[#C8E6E2]/15 to-[#F6FAF9] border-y border-[#105F68]/10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-xs uppercase font-mono tracking-widest text-[#3A9295]">
                03 / FULL FEATURE CAPABILITY
              </span>
              <h2 className="text-3xl sm:text-5xl font-light text-[#105F68] tracking-tight mt-3 mb-5">
                Every Capability Engineered for Excellence.
              </h2>
              <p className="text-sm sm:text-base text-[#3A9295] font-light leading-relaxed">
                A pristine collection of specialized commerce tools, designed specifically for boutique operators who demand simplicity and power.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES_LIST.map((feat) => {
                const FeatIcon = feat.icon;
                return (
                  <div
                    key={feat.id}
                    className="p-8 rounded-3xl bg-white border border-[#105F68]/15 shadow-sm hover:shadow-xl hover:border-[#105F68]/30 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-[#3A9295]">{feat.number}</span>
                        <div className="w-10 h-10 rounded-2xl bg-[#105F68]/5 border border-[#105F68]/15 text-[#105F68] flex items-center justify-center">
                          <FeatIcon className="w-5 h-5" />
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-light text-[#105F68] tracking-tight">{feat.title}</h3>
                        <p className="text-xs text-[#3A9295] font-light mt-2.5 leading-relaxed">{feat.summary}</p>
                      </div>

                      <ul className="space-y-2 pt-2">
                        {feat.bullets.map((b, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2 text-xs text-[#103438]/80 font-light leading-snug">
                            <Check className="w-3.5 h-3.5 text-[#63C1BB] shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between text-xs text-[#3A9295] font-mono">
                      <span>Feature 0{feat.number}</span>
                      <span className="text-[#105F68] uppercase text-[10px]">Active OS Module</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 04: Transparent Pricing Plans (Forma Spaces Minimalist Grid) */}
        <section id="pricing" className="py-24 sm:py-36 px-4 sm:px-8 max-w-7xl mx-auto border-b border-[#105F68]/10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs uppercase font-mono tracking-widest text-[#3A9295]">
              04 / TRANSPARENT PRICING
            </span>
            <h2 className="text-3xl sm:text-5xl font-light text-[#105F68] tracking-tight mt-3 mb-5">
              Flat Predictable Pricing. Zero Commission.
            </h2>
            <p className="text-sm sm:text-base text-[#3A9295] font-light leading-relaxed">
              No percentage take-rates on your hard work. Choose the tier that matches your studio scale and keep 100% of your earnings.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-20">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`relative p-8 sm:p-10 rounded-[2.5rem] flex flex-col justify-between transition-all duration-300 ${
                  tier.highlight
                    ? "bg-white border-2 border-[#105F68] shadow-2xl scale-[1.02]"
                    : "bg-white border border-[#105F68]/15 shadow-sm hover:shadow-lg"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full shadow-sm ${
                        tier.highlight
                          ? "bg-[#105F68] text-white"
                          : "bg-white border border-[#105F68]/20 text-[#105F68]"
                      }`}
                    >
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-light text-[#105F68]">{tier.name}</h3>
                    <p className="text-xs text-[#3A9295] font-light mt-1.5 leading-relaxed">{tier.tagline}</p>
                  </div>

                  {/* Price */}
                  <div className="py-4 border-y border-black/5 flex items-baseline gap-2">
                    <span className="text-xs font-mono text-[#3A9295] uppercase">{tier.currency}</span>
                    <span className="text-5xl font-light text-[#105F68] tracking-tight">{tier.price}</span>
                    <span className="text-xs text-[#3A9295] font-light">{tier.cadence}</span>
                  </div>

                  {/* Quotas */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-[#105F68] font-medium">
                      <Layers className="w-3.5 h-3.5 text-[#63C1BB]" />
                      <span>{tier.offerings}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#105F68] font-medium">
                      <Zap className="w-3.5 h-3.5 text-[#63C1BB]" />
                      <span>{tier.orders}</span>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#3A9295]">Included in plan:</span>
                    <ul className="space-y-2.5">
                      {tier.features.map((f, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-xs text-[#103438]/85 font-light leading-snug">
                          <Check className="w-4 h-4 text-[#105F68] shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-10 pt-4">
                  <ClickLink
                    href={tier.ctaHref}
                    className={`w-full py-4 rounded-full text-sm font-light tracking-tight flex items-center justify-center gap-2 transition-all duration-300 ${
                      tier.highlight
                        ? "bg-[#105F68] text-white hover:bg-[#0D4F57] shadow-lg shadow-[#105F68]/20"
                        : "border border-[#105F68]/20 text-[#105F68] bg-[#F6FAF9]/50 hover:bg-white hover:border-[#105F68]/40"
                    }`}
                  >
                    <span>{tier.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </ClickLink>
                </div>
              </div>
            ))}
          </div>

          {/* Architectural Side-by-Side Feature Comparison Matrix */}
          <div className="bg-white rounded-[2rem] border border-[#105F68]/15 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-[#3A9295]">
                  MATRIX COMPARISON
                </span>
                <h3 className="text-xl sm:text-2xl font-light text-[#105F68] mt-1">
                  Side-by-Side Plan Specification
                </h3>
              </div>
              <span className="text-xs text-[#3A9295] font-mono">All tiers include 0% platform commission</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-black/5 bg-[#F6FAF9]/50 text-[#3A9295] font-mono uppercase tracking-wider text-[11px]">
                    <th className="py-4 px-6 font-medium">Capability</th>
                    <th className="py-4 px-6 font-medium text-center">Starter</th>
                    <th className="py-4 px-6 font-medium text-center text-[#105F68] bg-[#C8E6E2]/20">Growth</th>
                    <th className="py-4 px-6 font-medium text-center">Scale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 font-light text-[#103438]">
                  {COMPARISON_ROWS.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-[#F6FAF9]/40 transition-colors">
                      <td className="py-3.5 px-6 font-medium text-[#105F68]">{row.feature}</td>
                      <td className="py-3.5 px-6 text-center">
                        {typeof row.free === "boolean" ? (
                          row.free ? (
                            <Check className="w-4 h-4 text-[#105F68] mx-auto" />
                          ) : (
                            <span className="text-[#3A9295]/40">—</span>
                          )
                        ) : (
                          <span className="font-mono text-xs">{row.free}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-center bg-[#C8E6E2]/10">
                        {typeof row.growth === "boolean" ? (
                          row.growth ? (
                            <Check className="w-4 h-4 text-[#105F68] mx-auto" />
                          ) : (
                            <span className="text-[#3A9295]/40">—</span>
                          )
                        ) : (
                          <span className="font-mono text-xs font-semibold text-[#105F68]">{row.growth}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        {typeof row.scale === "boolean" ? (
                          row.scale ? (
                            <Check className="w-4 h-4 text-[#105F68] mx-auto" />
                          ) : (
                            <span className="text-[#3A9295]/40">—</span>
                          )
                        ) : (
                          <span className="font-mono text-xs">{row.scale}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 05: Live Storefront Showroom */}
        <section id="demos" className="py-24 sm:py-32 px-4 sm:px-8 bg-gradient-to-b from-[#F6FAF9] via-[#C8E6E2]/20 to-[#F6FAF9] border-b border-[#105F68]/10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs uppercase font-mono tracking-widest text-[#3A9295]">
                05 / CURATED STOREFRONTS
              </span>
              <h2 className="text-3xl sm:text-5xl font-light text-[#105F68] tracking-tight mt-3 mb-5">
                Experience What Your Clients See
              </h2>
              <p className="text-sm sm:text-base text-[#3A9295] font-light leading-relaxed">
                Every Ovelink storefront displays customized brand fonts, palette colors, and tailored catalog layouts. Click any live sample below to test the client journey:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {DEMO_LINKS.map((sample) => (
                <div
                  key={sample.slug}
                  className={`p-6 rounded-[2rem] border border-black/10 shadow-lg flex flex-col justify-between space-y-6 ${sample.bg}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${sample.pill}`}>
                        {sample.category}
                      </span>
                      <span className="text-[10px] opacity-60 font-mono">/l/{sample.slug}</span>
                    </div>

                    <h4 className="text-xl font-bold tracking-tight">{sample.name}</h4>
                    <p className={`text-xs ${sample.accent}`}>{sample.theme}</p>
                    <p className="text-[11px] opacity-75">{sample.type}</p>
                  </div>

                  <div className="pt-4 border-t border-current/10 flex items-center justify-between">
                    <Link
                      href={sample.sampleUrl}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
                    >
                      <span>Try Customer View</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 06: Savings Calculator */}
        <section id="savings" className="py-24 sm:py-32 px-4 sm:px-8 max-w-5xl mx-auto border-b border-[#105F68]/10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-mono tracking-widest text-[#3A9295]">
              06 / REVENUE PROTECTION
            </span>
            <h2 className="text-3xl sm:text-5xl font-light text-[#105F68] tracking-tight mt-2 mb-4">
              Keep 100% of What You Earn.
            </h2>
            <p className="text-sm sm:text-base text-[#3A9295] font-light leading-relaxed">
              Traditional marketplaces take 15% to 25% of your gross earnings. See how much money returns to your pocket with Ovel’s flat monthly architecture:
            </p>
          </div>

          <SavingsCalculator />
        </section>

        {/* Section 07: Minimalist Architectural FAQ */}
        <section id="faq" className="py-24 sm:py-32 px-4 sm:px-8 max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-mono tracking-widest text-[#3A9295]">
              07 / ARCHITECTURAL FAQ
            </span>
            <h2 className="text-3xl sm:text-5xl font-light text-[#105F68] tracking-tight mt-2 mb-4">
              Frequently Clarified Questions
            </h2>
            <p className="text-sm text-[#3A9295] font-light">
              Clear, transparent answers on our zero-commission architecture and technical details.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, fIdx) => (
              <div
                key={fIdx}
                className="p-6 sm:p-8 rounded-3xl bg-white border border-[#105F68]/15 shadow-sm space-y-3"
              >
                <h4 className="text-lg font-light text-[#105F68] flex items-center gap-3">
                  <span className="text-xs font-mono text-[#3A9295]">Q{fIdx + 1}</span>
                  <span>{faq.q}</span>
                </h4>
                <p className="text-xs sm:text-sm text-[#3A9295] font-light leading-relaxed pl-7">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
