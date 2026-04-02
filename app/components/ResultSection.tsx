"use client";

import { CalcResult, ReverseCalcResult } from "../types";

interface Props {
  result: CalcResult | null;
  reverseResult: ReverseCalcResult | null;
  mode: "standard" | "reverse";
  currency: string;
  sellingItemPrice: number;
  sellingShippingPrice: number;
  exchangeRate: number;
}

function formatJPY(value: number) {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

interface RowProps {
  label: string;
  value: string;
  sub?: boolean;
  highlight?: "red" | "blue";
}

function Row({ label, value, sub, highlight }: RowProps) {
  return (
    <div
      className={`flex justify-between items-center py-1.5 ${
        sub ? "pl-4" : ""
      }`}
    >
      <span className={`text-sm ${sub ? "text-gray-500" : "text-gray-300"}`}>
        {label}
      </span>
      <span
        className={`text-sm tabular-nums font-medium ${
          highlight === "red"
            ? "text-red-400"
            : highlight === "blue"
            ? "text-blue-400"
            : sub
            ? "text-gray-400"
            : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", GBP: "£", AUD: "A$", CAD: "C$", EUR: "€",
};

function Breakdown({ result, currency, sellingItemPrice, sellingShippingPrice }: {
  result: CalcResult;
  currency: string;
  sellingItemPrice: number;
  sellingShippingPrice: number;
}) {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;
  const profitColor = result.netProfit > 0 ? "text-emerald-400" : "text-red-400";
  return (
    <div className="bg-gray-800 rounded-2xl p-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
        内訳
      </h2>
      <div className="divide-y divide-gray-700/50">
        <div className="py-1">
          <Row label="販売価格合計" value={formatJPY(result.sellingPriceJPY)} highlight="blue" />
          <Row label={`商品代（${sym}${sellingItemPrice.toFixed(2)}）`} value={formatJPY(result.sellingItemPriceJPY)} sub />
          {result.sellingShippingPriceJPY > 0 && (
            <Row label={`送料（${sym}${sellingShippingPrice}）`} value={formatJPY(result.sellingShippingPriceJPY)} sub />
          )}
        </div>
        <div className="py-1">
          <p className="text-xs text-gray-500 pt-1 pb-0.5">コスト</p>
          <Row label="仕入値" value={formatJPY(result.purchasePriceJPY)} sub />
          <Row label="送料コスト" value={formatJPY(result.shippingJPY)} sub />
          <Row label="関税（商品代ベース）" value={formatJPY(result.customsDuty)} sub />
          <Row label="eBay手数料" value={formatJPY(result.ebayFeeJPY)} sub />
          <Row label="Payoneer手数料" value={formatJPY(result.payoneerFeeJPY)} sub />
          {result.outsourcingFeeJPY > 0 && (
            <Row label="外注費" value={formatJPY(result.outsourcingFeeJPY)} sub />
          )}
          <Row label="諸経費" value={formatJPY(result.miscExpenseJPY)} sub />
        </div>
        <Row label="総コスト" value={formatJPY(result.totalCost)} highlight="red" />
        <div className="pt-2 mt-1">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-white">純利益</span>
            <span className={`text-base font-bold tabular-nums ${profitColor}`}>
              {formatJPY(result.netProfit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultSection({
  result,
  reverseResult,
  mode,
  currency,
  sellingItemPrice,
  sellingShippingPrice,
  exchangeRate,
}: Props) {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;

  if (mode === "reverse") {
    if (!reverseResult || !exchangeRate) {
      return (
        <div className="bg-gray-800 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            逆算結果
          </h2>
          <p className="text-gray-500 text-center py-4 text-sm">
            目標利益を入力してください
          </p>
        </div>
      );
    }
    const { requiredItemPriceForeign, result: r } = reverseResult;
    const marginColor =
      r.profitMargin >= 20 ? "text-emerald-400" : r.profitMargin >= 10 ? "text-yellow-400" : "text-red-400";
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 rounded-2xl p-4">
            <p className="text-xs text-gray-400 mb-1">必要販売価格</p>
            <p className="text-xl font-bold tabular-nums text-blue-400">
              {sym}{requiredItemPriceForeign.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4">
            <p className="text-xs text-gray-400 mb-1">利益率</p>
            <p className={`text-xl font-bold tabular-nums ${marginColor}`}>
              {r.profitMargin.toFixed(1)}%
            </p>
          </div>
        </div>
        <Breakdown result={r} currency={currency} sellingItemPrice={requiredItemPriceForeign} sellingShippingPrice={sellingShippingPrice} />
      </div>
    );
  }

  // Standard mode
  if (!result || !sellingItemPrice || !exchangeRate) {
    return (
      <div className="bg-gray-800 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          計算結果
        </h2>
        <p className="text-gray-500 text-center py-4 text-sm">
          販売価格（商品代）を入力してください
        </p>
      </div>
    );
  }

  const profitColor = result.netProfit > 0 ? "text-emerald-400" : "text-red-400";
  const marginColor =
    result.profitMargin >= 20 ? "text-emerald-400" : result.profitMargin >= 10 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">純利益</p>
          <p className={`text-xl font-bold tabular-nums ${profitColor}`}>
            {formatJPY(result.netProfit)}
          </p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">利益率</p>
          <p className={`text-xl font-bold tabular-nums ${marginColor}`}>
            {result.profitMargin.toFixed(1)}%
          </p>
        </div>
      </div>
      <Breakdown result={result} currency={currency} sellingItemPrice={sellingItemPrice} sellingShippingPrice={sellingShippingPrice} />
    </div>
  );
}
