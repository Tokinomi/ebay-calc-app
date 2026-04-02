"use client";

import { useState, useEffect, useCallback } from "react";
import ExchangeRates from "./components/ExchangeRates";
import InputSection from "./components/InputSection";
import ResultSection from "./components/ResultSection";
import HistorySection from "./components/HistorySection";
import StatsSection from "./components/StatsSection";
import { ExchangeRates as ExchangeRatesType, CalcInputs, FeeSettings, CalcResult, ReverseCalcResult, HistoryRecord, CATEGORIES, CategoryValue } from "./types";
import { calculate, reverseCalculate, DEFAULT_FEES } from "./lib/calculate";

const STORAGE_KEY = "ebay-calc-fees";
const HISTORY_KEY = "ebay-calc-history";

function loadHistory(): HistoryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

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

type Mode = "standard" | "reverse";

export default function Home() {
  const [mode, setMode] = useState<Mode>("standard");
  const [rates, setRates] = useState<ExchangeRatesType | null>(null);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [ratesFallback, setRatesFallback] = useState(false);

  const [inputs, setInputs] = useState<CalcInputs>({
    purchasePrice: 0,
    sellingItemPrice: 0,
    discount: 0,
    sellingShippingPrice: 0,
    shippingCost: 3000,
    currency: "USD",
  });

  const [fees, setFees] = useState<FeeSettings>(DEFAULT_FEES);
  const [targetProfit, setTargetProfit] = useState<number>(0);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [reverseResult, setReverseResult] = useState<ReverseCalcResult | null>(null);
  const [memo, setMemo] = useState("");
  const [category, setCategory] = useState<CategoryValue>("others");
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    setFees(loadSavedFees());
    setHistory(loadHistory());
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
    if (mode === "standard") {
      setResult(calculate(inputs, fees, exchangeRate, usdRate));
      setReverseResult(null);
    } else {
      setReverseResult(reverseCalculate(inputs, fees, targetProfit, exchangeRate, usdRate));
      setResult(null);
    }
  }, [inputs, fees, rates, mode, targetProfit]);

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

  const handleSave = useCallback(() => {
    const activeResult = mode === "standard" ? result : reverseResult?.result;
    const activePrice = mode === "standard" ? inputs.sellingItemPrice : (reverseResult?.requiredItemPriceForeign ?? 0);
    if (!activeResult) return;
    const record: HistoryRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      memo,
      category,
      mode,
      currency: inputs.currency,
      sellingItemPrice: activePrice,
      ...(mode === "reverse" ? { targetProfit } : {}),
      result: activeResult,
    };
    setHistory((prev) => {
      const next = [record, ...prev];
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [mode, result, reverseResult, inputs, memo, category, targetProfit]);

  const handleDeleteHistory = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((r) => r.id !== id);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
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

        {/* Tab Switcher */}
        <div className="flex bg-gray-800 rounded-xl p-1 mb-4">
          <button
            onClick={() => setMode("standard")}
            className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${
              mode === "standard" ? "bg-gray-600 text-white" : "text-gray-400"
            }`}
          >
            通常計算
          </button>
          <button
            onClick={() => setMode("reverse")}
            className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${
              mode === "reverse" ? "bg-blue-600 text-white" : "text-gray-400"
            }`}
          >
            逆算（目標利益）
          </button>
        </div>

        {/* Category Dropdown */}
        <div className="mb-4">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryValue)}
            className="w-full bg-gray-800 text-white text-sm font-medium px-4 py-3 rounded-xl outline-none appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", backgroundSize: "18px", paddingRight: "40px" }}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>カテゴリー：{c.label}</option>
            ))}
          </select>
        </div>

        <ExchangeRates
          rates={rates}
          selectedCurrency={inputs.currency}
          onCurrencyChange={handleCurrencyChange}
          loading={ratesLoading}
          lastUpdated={lastUpdated}
        />

        {mode === "reverse" && (
          <div className="bg-gray-800 rounded-2xl p-4 mb-4">
            <label className="text-xs text-gray-400">目標利益</label>
            <div className="flex items-center bg-gray-700 rounded-xl overflow-hidden mt-1">
              <span className="px-3 text-gray-400 text-sm border-r border-gray-600">¥</span>
              <input
                type="number"
                inputMode="decimal"
                value={targetProfit === 0 ? "" : targetProfit}
                placeholder="0"
                min={0}
                onChange={(e) => setTargetProfit(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                className="flex-1 bg-transparent px-3 py-3 text-white text-right text-base outline-none"
              />
            </div>
          </div>
        )}

        <div className="mb-4">
          <ResultSection
            result={result}
            reverseResult={reverseResult}
            mode={mode}
            currency={inputs.currency}
            sellingItemPrice={inputs.sellingItemPrice}
            sellingShippingPrice={inputs.sellingShippingPrice}
            exchangeRate={exchangeRate}
          />
        </div>

        <InputSection
          inputs={inputs}
          fees={fees}
          mode={mode}
          targetProfit={targetProfit}
          onInputChange={handleInputChange}
          onFeeChange={handleFeeChange}
          onTargetProfitChange={setTargetProfit}
        />

        {/* Save button */}
        {(result || reverseResult) && (
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="メモ（商品名など）"
              className="flex-1 bg-gray-800 text-white text-sm px-3 py-2.5 rounded-xl outline-none placeholder-gray-600"
            />
            <button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
            >
              保存
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-600 mt-6">
          手数料設定は自動的にブラウザに保存されます
        </p>

        <div className="mt-6 text-center">
          <a
            href="https://twitter.com/intent/tweet?text=eBay輸出の利益計算に便利なツールを見つけた！%20by%20@Tokinomi%20%F0%9F%91%87&url=https%3A%2F%2Febay-calc-app.vercel.app%2F"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-black text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </a>
        </div>

        <StatsSection records={history} />
        <HistorySection records={history} onDelete={handleDeleteHistory} />

        <p className="text-center text-xs text-gray-600 mt-4 px-4">
          This tool is for estimation purposes only. Please check official eBay fees.
        </p>
      </div>
    </main>
  );
}
