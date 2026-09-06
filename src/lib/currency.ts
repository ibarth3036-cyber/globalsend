export interface Currency {
  code: string
  symbol: string
  name: string
  locale: string
  rate: number // Exchange rate relative to USD (base currency)
}

export const currencies: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', rate: 1 },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', rate: 0.93 },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', rate: 0.79 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', rate: 155 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN', rate: 7.25 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', rate: 1.52 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA', rate: 1.37 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH', rate: 0.88 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', rate: 83 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR', rate: 5.2 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR', rate: 1350 },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', locale: 'es-MX', rate: 18 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', rate: 1.35 },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', locale: 'en-NZ', rate: 1.62 },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA', rate: 19 },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE', rate: 10.5 },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', locale: 'nb-NO', rate: 10.8 },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', locale: 'da-DK', rate: 6.95 },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', locale: 'pl-PL', rate: 4.0 },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', locale: 'tr-TR', rate: 32 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE', rate: 3.67 },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', locale: 'ar-SA', rate: 3.75 },
]

export type CurrencyCode = typeof currencies[number]['code']

const STORAGE_KEY = 'preferred_currency'

export function getPreferredCurrency(): CurrencyCode {
  if (typeof window === 'undefined') return 'USD'
  return (localStorage.getItem(STORAGE_KEY) as CurrencyCode) || 'USD'
}

export function setPreferredCurrency(code: CurrencyCode) {
  localStorage.setItem(STORAGE_KEY, code)
  window.dispatchEvent(new Event('currency-changed'))
}

export function getCurrencyInfo(code: CurrencyCode): Currency {
  return currencies.find(c => c.code === code) || currencies[0]
}

// Convert amount from USD to target currency
export function convertFromUSD(amount: number, targetCode: CurrencyCode): number {
  const cur = getCurrencyInfo(targetCode)
  return amount * cur.rate
}

// Convert amount from source currency to USD
export function convertToUSD(amount: number, sourceCode: CurrencyCode): number {
  const cur = getCurrencyInfo(sourceCode)
  return amount / cur.rate
}

export function formatCurrency(amount: number, code?: CurrencyCode): string {
  const cur = getCurrencyInfo(code || getPreferredCurrency())
  try {
    return new Intl.NumberFormat(cur.locale, {
      style: 'currency',
      currency: cur.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${cur.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
}

// Format amount in target currency (converts from USD)
export function formatCurrencyIn(amountUSD: number, code: CurrencyCode): string {
  const converted = convertFromUSD(amountUSD, code)
  return formatCurrency(converted, code)
}
