/**
 * Ovel Global Currency & Formatting System
 * Default Currency: LKR (Sri Lankan Rupee - Rs.)
 * Supports merchant-customizable operating currencies across all commercial loops.
 */

export type CurrencyCode =
  | "LKR"
  | "USD"
  | "EUR"
  | "GBP"
  | "AED"
  | "INR"
  | "AUD"
  | "CAD"
  | "SGD";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
  locale: string;
  decimals: number;
}

export const DEFAULT_CURRENCY: CurrencyCode = "LKR";

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  {
    code: "LKR",
    symbol: "Rs.",
    label: "LKR (Rs.) Sri Lankan Rupee [Default]",
    locale: "en-LK",
    decimals: 2,
  },
  {
    code: "USD",
    symbol: "$",
    label: "USD ($) US Dollar",
    locale: "en-US",
    decimals: 2,
  },
  {
    code: "EUR",
    symbol: "€",
    label: "EUR (€) Euro",
    locale: "de-DE",
    decimals: 2,
  },
  {
    code: "GBP",
    symbol: "£",
    label: "GBP (£) British Pound",
    locale: "en-GB",
    decimals: 2,
  },
  {
    code: "AED",
    symbol: "AED",
    label: "AED (AED) UAE Dirham",
    locale: "en-AE",
    decimals: 2,
  },
  {
    code: "INR",
    symbol: "₹",
    label: "INR (₹) Indian Rupee",
    locale: "en-IN",
    decimals: 2,
  },
  {
    code: "AUD",
    symbol: "A$",
    label: "AUD (A$) Australian Dollar",
    locale: "en-AU",
    decimals: 2,
  },
  {
    code: "CAD",
    symbol: "C$",
    label: "CAD (C$) Canadian Dollar",
    locale: "en-CA",
    decimals: 2,
  },
  {
    code: "SGD",
    symbol: "S$",
    label: "SGD (S$) Singapore Dollar",
    locale: "en-SG",
    decimals: 2,
  },
];

const CURRENCY_MAP = new Map<string, CurrencyConfig>(
  SUPPORTED_CURRENCIES.map((c) => [c.code, c])
);

export function getCurrencyConfig(code?: string): CurrencyConfig {
  if (!code) return CURRENCY_MAP.get(DEFAULT_CURRENCY)!;
  const upper = code.toUpperCase().trim() as CurrencyCode;
  return CURRENCY_MAP.get(upper) || CURRENCY_MAP.get(DEFAULT_CURRENCY)!;
}

export function getCurrencySymbol(code?: string): string {
  return getCurrencyConfig(code).symbol;
}

/**
 * Formats monetary amounts specified in cents (1/100 of a unit)
 * e.g., formatCurrency(450000, "LKR") => "Rs. 4,500.00"
 */
export function formatCurrency(
  amountCents: number,
  currencyCode: string = DEFAULT_CURRENCY,
  options?: {
    showDecimals?: boolean;
    useCodePrefix?: boolean;
  }
): string {
  const cfg = getCurrencyConfig(currencyCode);
  const val = (amountCents || 0) / 100;
  const showDecimals = options?.showDecimals ?? true;

  try {
    const formattedNum = val.toLocaleString(cfg.locale, {
      minimumFractionDigits: showDecimals ? cfg.decimals : 0,
      maximumFractionDigits: showDecimals ? cfg.decimals : 0,
    });

    if (cfg.code === "LKR") {
      return `Rs. ${formattedNum}`;
    }
    if (cfg.code === "AED") {
      return `AED ${formattedNum}`;
    }
    return `${cfg.symbol}${formattedNum}`;
  } catch {
    const fallbackFixed = showDecimals ? val.toFixed(2) : Math.round(val).toString();
    return `${cfg.symbol}${fallbackFixed}`;
  }
}

/**
 * Formats monetary amounts specified in whole major units (e.g. 4500)
 */
export function formatCurrencyRaw(
  amount: number,
  currencyCode: string = DEFAULT_CURRENCY,
  options?: {
    showDecimals?: boolean;
  }
): string {
  return formatCurrency(Math.round((amount || 0) * 100), currencyCode, options);
}
