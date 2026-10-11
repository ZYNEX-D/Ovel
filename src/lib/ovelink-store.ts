/**
 * Ovelink Store & Customization Engine
 * Powers universal public booking & ordering pages (ovel.app/l/[slug])
 * for ALL businesses taking Appointments, Bookings, or Orders.
 */

export type OfferingType = "appointment" | "booking" | "order";

export interface OvelinkOffering {
  id: string;
  type: OfferingType;
  name: string;
  description: string;
  priceCents: number;
  depositCents: number;
  durationMinutes?: number;
  requiresTimeSlot?: boolean;
  badge?: string;
  category?: string;
  isActive: boolean;
}

export type OvelinkFont = 
  | "Kaleko 105" 
  | "Disolve" 
  | "Inter" 
  | "Outfit" 
  | "Playfair Display" 
  | "Space Grotesk" 
  | "Syne";

export interface OvelinkThemePreset {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  textColor: string;
  surfaceColor: string;
  fontFamily: OvelinkFont;
  coverGradient: string;
}

export interface OvelinkCustomization {
  slug: string;
  businessName: string;
  businessTagline: string;
  businessBio: string;
  businessCategory: string;
  avatarInitials: string;
  coverGradient: string;
  
  // Customization: Font & Colors & Styling
  fontFamily: OvelinkFont;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  textColor: string;
  surfaceColor: string;
  cardRadius: "rounded-xl" | "rounded-2xl" | "rounded-3xl" | "rounded-none";
  buttonStyle: "pill" | "rounded" | "sharp";
  
  // Contact & Socials
  whatsappNumber: string;
  instagramHandle?: string;
  websiteUrl?: string;
  location?: string;
  currency: string;
  
  // Offerings Catalog
  offerings: OvelinkOffering[];
}

export const THEME_PRESETS: OvelinkThemePreset[] = [
  {
    id: "ovel_signature",
    name: "Ovel Signature Teal",
    primaryColor: "#105F68",
    accentColor: "#63C1BB",
    bgColor: "#F6FAF9",
    textColor: "#103438",
    surfaceColor: "#FFFFFF",
    fontFamily: "Kaleko 105",
    coverGradient: "from-[#105F68] to-[#0D4F57]",
  },
  {
    id: "velvet_dark",
    name: "Velvet Obsidian (Dark Mode)",
    primaryColor: "#38BDF8",
    accentColor: "#818CF8",
    bgColor: "#090D16",
    textColor: "#F8FAFC",
    surfaceColor: "#131A29",
    fontFamily: "Space Grotesk",
    coverGradient: "from-[#0F172A] to-[#1E293B]",
  },
  {
    id: "nordic_sand",
    name: "Nordic Warm Clay",
    primaryColor: "#854D0E",
    accentColor: "#D97706",
    bgColor: "#FEFCE8",
    textColor: "#451A03",
    surfaceColor: "#FFFFFF",
    fontFamily: "Playfair Display",
    coverGradient: "from-[#78350F] to-[#92400E]",
  },
  {
    id: "botanical_sage",
    name: "Botanical Olive & Sage",
    primaryColor: "#166534",
    accentColor: "#22C55E",
    bgColor: "#F0FDF4",
    textColor: "#14532D",
    surfaceColor: "#FFFFFF",
    fontFamily: "Outfit",
    coverGradient: "from-[#14532D] to-[#166534]",
  },
  {
    id: "hyper_studio",
    name: "Hyper Modern Minimal",
    primaryColor: "#18181B",
    accentColor: "#6366F1",
    bgColor: "#FAFAFA",
    textColor: "#18181B",
    surfaceColor: "#FFFFFF",
    fontFamily: "Syne",
    coverGradient: "from-[#18181B] to-[#27272A]",
  },
];

export const PRESET_OVELINKS: Record<string, OvelinkCustomization> = {
  "leclat": {
    slug: "leclat",
    businessName: "L'Éclat Studio",
    businessTagline: "Aesthetic Treatments & Barrier Restoration",
    businessBio: "Private boutique studio specialized in tailored clinical skincare, lymphatic sculpts, and bespoke consultations.",
    businessCategory: "Appointments & Services",
    avatarInitials: "LE",
    coverGradient: "from-[#105F68] to-[#0D4F57]",
    fontFamily: "Kaleko 105",
    primaryColor: "#105F68",
    accentColor: "#63C1BB",
    bgColor: "#F6FAF9",
    textColor: "#103438",
    surfaceColor: "#FFFFFF",
    cardRadius: "rounded-3xl",
    buttonStyle: "pill",
    whatsappNumber: "+1 (415) 890-1200",
    instagramHandle: "@leclat.studio",
    websiteUrl: "leclat.studio",
    location: "450 Sutter St, San Francisco, CA",
    currency: "USD",
    offerings: [
      {
        id: "off_1",
        type: "appointment",
        name: "Hydrafacial Glow & Lymphatic Drainage",
        description: "Deep vortex pore cleanse, customized peptide infusion, and sculpt lymphatic drainage.",
        priceCents: 19500,
        depositCents: 5000,
        durationMinutes: 60,
        requiresTimeSlot: true,
        badge: "Bestseller",
        category: "Facials & Skin",
        isActive: true,
      },
      {
        id: "off_2",
        type: "appointment",
        name: "Complexion Roadmap Consultation",
        description: "Digital skin barrier analysis, prescription protocol setup, and 90-day roadmap.",
        priceCents: 12000,
        depositCents: 3500,
        durationMinutes: 45,
        requiresTimeSlot: true,
        category: "Consultations",
        isActive: true,
      },
      {
        id: "off_3",
        type: "order",
        name: "Barrier Rescue Home Care Kit",
        description: "Custom-formulated peptide moisturizer, gentle lipid cleanser, and SPF 50 mineral shield.",
        priceCents: 8800,
        depositCents: 8800,
        requiresTimeSlot: false,
        badge: "Take-Home Order",
        category: "Products & Orders",
        isActive: true,
      },
    ],
  },

  "apex-studio": {
    slug: "apex-studio",
    businessName: "Apex Auto & Detailing Lab",
    businessTagline: "Precision Paint Correction & Ceramic Coatings",
    businessBio: "High-end vehicle detailing, interior steam restoration, and certified multi-year ceramic coating installs.",
    businessCategory: "Auto & Detailing",
    avatarInitials: "AA",
    coverGradient: "from-[#0F172A] to-[#1E293B]",
    fontFamily: "Space Grotesk",
    primaryColor: "#0284C7",
    accentColor: "#38BDF8",
    bgColor: "#090D16",
    textColor: "#F8FAFC",
    surfaceColor: "#131A29",
    cardRadius: "rounded-2xl",
    buttonStyle: "rounded",
    whatsappNumber: "+1 (512) 440-9821",
    instagramHandle: "@apexautolab",
    websiteUrl: "apexautolab.io",
    location: "South Congress Blvd, Austin, TX",
    currency: "USD",
    offerings: [
      {
        id: "off_apex_1",
        type: "booking",
        name: "Signature Stage 1 Paint Correction Slot",
        description: "Full single-stage machine polish eliminating 70% of swirls, deep wheel de-ironing, and paint sealant.",
        priceCents: 45000,
        depositCents: 10000,
        durationMinutes: 240,
        requiresTimeSlot: true,
        badge: "Popular Service",
        category: "Paint Correction",
        isActive: true,
      },
      {
        id: "off_apex_2",
        type: "booking",
        name: "Full Interior Steam Extraction Booking",
        description: "Heated carpet shampoo extraction, leather conditioner conditioning, ozone odor elimination.",
        priceCents: 26000,
        depositCents: 5000,
        durationMinutes: 180,
        requiresTimeSlot: true,
        category: "Interior Care",
        isActive: true,
      },
      {
        id: "off_apex_3",
        type: "order",
        name: "Graphene Quick Detailer (500ml Bottle)",
        description: "Slick hydrophobic booster spray for weekly wipe-downs. Ships or pickup at studio.",
        priceCents: 3200,
        depositCents: 3200,
        requiresTimeSlot: false,
        category: "Care Products",
        isActive: true,
      },
    ],
  },

  "craft-bakes": {
    slug: "craft-bakes",
    businessName: "Velvet Crumb Artisanal Bakes",
    businessTagline: "Custom Celebration Cakes & Sourdough Pastries",
    businessBio: "Micro-bakery crafting small-batch seasonal cakes, laminated pastries, and event dessert tables.",
    businessCategory: "Custom Orders & Food",
    avatarInitials: "VC",
    coverGradient: "from-[#78350F] to-[#92400E]",
    fontFamily: "Playfair Display",
    primaryColor: "#854D0E",
    accentColor: "#D97706",
    bgColor: "#FEFCE8",
    textColor: "#451A03",
    surfaceColor: "#FFFFFF",
    cardRadius: "rounded-3xl",
    buttonStyle: "pill",
    whatsappNumber: "+1 (212) 555-7832",
    instagramHandle: "@velvetcrumbbakes",
    websiteUrl: "velvetcrumb.com",
    location: "SoHo, New York, NY",
    currency: "USD",
    offerings: [
      {
        id: "off_bake_1",
        type: "order",
        name: "Custom 3-Tier Pistachio Raspberry Cake",
        description: "Brown butter sponge, roasted Sicilian pistachio buttercream, and fresh raspberry coulis.",
        priceCents: 14500,
        depositCents: 5000,
        requiresTimeSlot: false,
        badge: "Weekend Pre-Order",
        category: "Cakes & Celebrations",
        isActive: true,
      },
      {
        id: "off_bake_2",
        type: "order",
        name: "Weekend Viennoiserie Pastry Box (6 Pack)",
        description: "2 Cardamom buns, 2 Valrhona pain au chocolat, and 2 seasonal fruit Danish pastries.",
        priceCents: 3800,
        depositCents: 3800,
        requiresTimeSlot: false,
        badge: "Sold Out Weekly",
        category: "Pastry Boxes",
        isActive: true,
      },
      {
        id: "off_bake_3",
        type: "appointment",
        name: "Wedding Cake Tasting & Design Consultation",
        description: "Private 1-on-1 tasting flight of 5 flavor profiles and custom styling sketch.",
        priceCents: 7500,
        depositCents: 7500,
        durationMinutes: 45,
        requiresTimeSlot: true,
        category: "Weddings",
        isActive: true,
      },
    ],
  },

  "vance-studio": {
    slug: "vance-studio",
    businessName: "Vance Creative & Production Loft",
    businessTagline: "Daylight Photo & Video Studio Space",
    businessBio: "2,400 sq ft industrial daylight studio with cyclorama wall, Profoto lighting packages, and sound-dampened podcast booth.",
    businessCategory: "Studios & Rentals",
    avatarInitials: "VS",
    coverGradient: "from-[#18181B] to-[#27272A]",
    fontFamily: "Syne",
    primaryColor: "#18181B",
    accentColor: "#6366F1",
    bgColor: "#FAFAFA",
    textColor: "#18181B",
    surfaceColor: "#FFFFFF",
    cardRadius: "rounded-2xl",
    buttonStyle: "sharp",
    whatsappNumber: "+1 (310) 902-1144",
    instagramHandle: "@vancestudios",
    websiteUrl: "vancecreativeloft.com",
    location: "Arts District, Los Angeles, CA",
    currency: "USD",
    offerings: [
      {
        id: "off_vance_1",
        type: "booking",
        name: "Main Cyclorama Bay (Half Day - 4 Hours)",
        description: "Access to 30ft white cyc wall, grip package, 3x Profoto D2 heads, and hair/makeup station.",
        priceCents: 38000,
        depositCents: 15000,
        durationMinutes: 240,
        requiresTimeSlot: true,
        badge: "Instant Confirmation",
        category: "Studio Rentals",
        isActive: true,
      },
      {
        id: "off_vance_2",
        type: "booking",
        name: "Acoustic Podcast Booth (2 Hours)",
        description: "Sound-treated studio with 4x Shure SM7B mics, Rodecaster Pro II, and 4K Sony camera setup.",
        priceCents: 18000,
        depositCents: 5000,
        durationMinutes: 120,
        requiresTimeSlot: true,
        category: "Audio & Podcast",
        isActive: true,
      },
      {
        id: "off_vance_3",
        type: "order",
        name: "Full Grip & Seamless Paper Backdrops Kit",
        description: "Pre-hung 9ft Savage paper backdrop in chosen hue with C-stands and sandbags.",
        priceCents: 4500,
        depositCents: 4500,
        requiresTimeSlot: false,
        category: "Equipment Add-Ons",
        isActive: true,
      },
    ],
  },
};

const STORAGE_KEY = "ovel_customized_ovelinks_v1";

export function getAllOvelinks(): Record<string, OvelinkCustomization> {
  if (typeof window === "undefined") return PRESET_OVELINKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...PRESET_OVELINKS, ...parsed };
    }
  } catch {
    // fallback
  }
  return PRESET_OVELINKS;
}

export function getOvelink(slug: string): OvelinkCustomization {
  const all = getAllOvelinks();
  return all[slug] || all["leclat"] || PRESET_OVELINKS["leclat"];
}

export function saveOvelink(config: OvelinkCustomization): void {
  if (typeof window === "undefined") return;
  const all = getAllOvelinks();
  all[config.slug] = config;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
