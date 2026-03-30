"use client";

import { ExchangeRates as ExchangeRatesType } from "../types";

interface Props {
  rates: ExchangeRatesType | null;
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  loading: boolean;
  lastUpdated: string | null;
}

const CURRENCY_FLAGS: Record<string, string> = {
  USD: "🇺🇸",
  GBP: "🇬🇧",
  AUD: "🇦🇺",
  CAD: "🇨🇦",
  EUR: "🇪🇺",
};

export default function ExchangeRates({
  rates,
  selectedCurrency,
  onCurrencyChange,
  loading,
  lastUpdated,
}: Props) {
  return (
    <div className="bg-gray-800 rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            TTM（仲値）対JPY
          </h2>
        </div>
        {lastUpdated && (
          <span className="text-xs text-gray-500">{lastUpdated} 基準</span>
        )}
      </div>
      {loading ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["USD", "GBP", "AUD", "CAD", "EUR"].map((c) => (
            <div
              key={c}
              className="flex-shrink-0 h-14 w-20 bg-gray-700 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {rates &&
            Object.entries(rates).map(([currency, rate]) => (
              <button
                key={currency}
                onClick={() => onCurrencyChange(currency)}
                className={`flex-shrink-0 flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all ${
                  selectedCurrency === currency
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <span className="text-lg">{CURRENCY_FLAGS[currency]}</span>
                <span className="text-xs font-bold">{currency}</span>
                <span className="text-xs tabular-nums">
                  ¥{rate.toFixed(1)}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
