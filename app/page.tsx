"use client";

import { useState, useEffect, useCallback } from "react";
import ExchangeRates from "./components/ExchangeRates";
import InputSection from "./components/InputSection";
import ResultSection from "./components/ResultSection";
import { ExchangeRates as ExchangeRatesType, CalcInputs, FeeSettings, CalcResult } from "./types";
import { calculate, DEFAULT_FEES } from "./lib/calculate";

const STORAGE_KEY = "ebay-calc-fees";

function loadSavedFees(): FeeSettings {
  if (typeof window === "undefined") return DEFAULT_FEES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_FEES, ...JSON.parse(saved) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_FEES;
}

export default function Home() {
  const [rates, setRates] = useState<ExchangeRatesType | null>(null);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [ratesFallback, setRatesFallback] = useState(false);

  const [inputs, setInputs] = useState<CalcInputs>({
    purchasePrice: 0,
    sellingItemPrice: 0,
    sellingShippingPrice: 0,
    shippingCost: 3000,
    currency: "USD",
  });

  const [fees, setFees] = useState<FeeSettings>(DEFAULT_FEES);
  const [result, setResult] = useState<CalcResult | null>(null);

  useEffect(() => {
    setFees(loadSavedFees());
  }, []);

  useEffect(() => {
    async function fetchRates() {
      setRatesLoading(true);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        // クライアントから直接取得（PC経由の中継なし）
        const res = await fetch(
          "https://api.frankfurter.app/latest?from=JPY&to=USD,GBP,AUD,CAD,EUR",
          { signal: controller.signal }
        );
        const data = await res.json();
        const rates: ExchangeRatesType = { USD: 150, GBP: 190, AUD: 100, CAD: 110, EUR: 160 };
        for (const cur of ["USD", "GBP", "AUD", "CAD", "EUR"]) {
          if (data.rates?.[cur]) rates[cur] = 1 / data.rates[cur];
        }
        setRates(rates);
        if (data.date) setLastUpdated(data.date);
      } catch (err) {
        console.error("Failed to fetch exchange rates:", err);
        setRates({ USD: 150, GBP: 190, AUD: 100, CAD: 110, EUR: 160 });
        setRatesFallback(true);
      } finally {
        clearTimeout(timeout);
        setRatesLoading(false);
      }
    }
    fetchRates();
  }, []);

  useEffect(() => {
    if (!rates) return;
    const exchangeRate = rates[inputs.currency];
    const usdRate = rates["USD"] ?? 150;
    const calc = calculate(inputs, fees, exchangeRate, usdRate);
    setResult(calc);
  }, [inputs, fees, rates]);

  const handleInputChange = useCallback(
    (key: keyof CalcInputs, value: number | string) => {
      setInputs((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleFeeChange = useCallback(
    (key: keyof FeeSettings, value: number | boolean) => {
      setFees((prev) => {
        const next = { ...prev, [key]: value };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    []
  );

  const handleCurrencyChange = useCallback((currency: string) => {
    setInputs((prev) => ({ ...prev, currency }));
  }, []);

  const exchangeRate = rates ? rates[inputs.currency] : 0;

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-10">
        <div className="py-4">
          <h1 className="text-xl font-bold text-white">eBay輸出 利益計算</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {ratesLoading
            ? "TTMレートを取得中..."
            : ratesFallback
            ? "⚠ レート取得失敗 — 概算値で計算中"
            : `TTM  1 ${inputs.currency} = ¥${exchangeRate.toFixed(2)}`}
          </p>
        </div>

        <ExchangeRates
          rates={rates}
          selectedCurrency={inputs.currency}
          onCurrencyChange={handleCurrencyChange}
          loading={ratesLoading}
          lastUpdated={lastUpdated}
        />

        <div className="mb-4">
          <ResultSection
            result={result}
            currency={inputs.currency}
            sellingItemPrice={inputs.sellingItemPrice}
            sellingShippingPrice={inputs.sellingShippingPrice}
            exchangeRate={exchangeRate}
          />
        </div>

        <InputSection
          inputs={inputs}
          fees={fees}
          onInputChange={handleInputChange}
          onFeeChange={handleFeeChange}
        />

        <p className="text-center text-xs text-gray-600 mt-6">
          手数料設定は自動的にブラウザに保存されます
        </p>
      </div>
    </main>
  );
}
