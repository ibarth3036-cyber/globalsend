import { useState, useEffect } from 'react'
import { getPreferredCurrency, setPreferredCurrency, formatCurrency, getCurrencyInfo, currencies, type CurrencyCode, convertFromUSD } from '../lib/currency'
import { useAuth } from '../contexts/AuthContext'

export function useCurrency() {
  const { profile } = useAuth()
  const [code, setCode] = useState<CurrencyCode>(profile?.preferred_currency as CurrencyCode || getPreferredCurrency())

  useEffect(() => {
    if (profile?.preferred_currency) {
      setCode(profile.preferred_currency as CurrencyCode)
      setPreferredCurrency(profile.preferred_currency as CurrencyCode)
    }
  }, [profile?.preferred_currency])

  useEffect(() => {
    const handler = () => setCode(getPreferredCurrency())
    window.addEventListener('currency-changed', handler)
    return () => window.removeEventListener('currency-changed', handler)
  }, [])

  return {
    currency: code,
    setCurrency: setPreferredCurrency,
    format: (amountUSD: number, currencyCode?: CurrencyCode) => {
      const target = currencyCode || code
      const converted = convertFromUSD(amountUSD, target)
      return formatCurrency(converted, target)
    },
    info: getCurrencyInfo(code),
    currencies,
  }
}
