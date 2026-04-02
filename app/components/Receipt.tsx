"use client";

import { forwardRef } from "react";
import { HistoryRecord } from "../types";

interface Props {
  record: HistoryRecord | null;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", GBP: "£", AUD: "A$", CAD: "C$", EUR: "€",
};

function fmt(v: number) {
  return `¥${Math.round(v).toLocaleString("ja-JP")}`;
}

const Receipt = forwardRef<HTMLDivElement, Props>(({ record }, ref) => {
  if (!record) return <div ref={ref} />;

  const { result, currency, sellingItemPrice, mode, targetProfit, memo, timestamp } = record;
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;
  const profitColor = result.netProfit >= 0 ? "#34d399" : "#f87171";
  const marginColor =
    result.profitMargin >= 20 ? "#34d399" : result.profitMargin >= 10 ? "#fbbf24" : "#f87171";
  const date = new Date(timestamp).toLocaleString("ja-JP", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div
      ref={ref}
      style={{
        width: 360,
        background: "#111827",
        padding: "28px 24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#f9fafb",
        borderRadius: 20,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
          eBay輸出
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#ffffff" }}>利益計算レポート</div>
        {memo && (
          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>{memo}</div>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, background: "#1f2937", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>
            {mode === "reverse" ? "必要販売価格" : "純利益"}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: mode === "reverse" ? "#60a5fa" : profitColor }}>
            {mode === "reverse"
              ? `${sym}${sellingItemPrice.toFixed(2)}`
              : fmt(result.netProfit)}
          </div>
        </div>
        <div style={{ flex: 1, background: "#1f2937", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>利益率</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: marginColor }}>
            {result.profitMargin.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px dashed #374151", marginBottom: 14 }} />

      {/* Data rows */}
      {[
        { label: mode === "reverse" ? "目標利益" : "販売価格合計", value: mode === "reverse" ? fmt(targetProfit ?? 0) : fmt(result.sellingPriceJPY) },
        { label: `商品代（${sym}${sellingItemPrice.toFixed(2)}）`, value: fmt(result.sellingItemPriceJPY) },
        result.sellingShippingPriceJPY > 0
          ? { label: "送料", value: fmt(result.sellingShippingPriceJPY) }
          : null,
        { label: "仕入値", value: fmt(result.purchasePriceJPY) },
        { label: "送料コスト", value: fmt(result.shippingJPY) },
        { label: "eBay手数料", value: fmt(result.ebayFeeJPY) },
        { label: "Payoneer手数料", value: fmt(result.payoneerFeeJPY) },
        result.outsourcingFeeJPY > 0 ? { label: "外注費", value: fmt(result.outsourcingFeeJPY) } : null,
        { label: "諸経費", value: fmt(result.miscExpenseJPY) },
        { label: "関税", value: fmt(result.customsDuty) },
      ].filter(Boolean).map((row, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13 }}>
          <span style={{ color: "#9ca3af" }}>{row!.label}</span>
          <span style={{ color: "#e5e7eb", fontVariantNumeric: "tabular-nums" }}>{row!.value}</span>
        </div>
      ))}

      <div style={{ borderTop: "1px dashed #374151", margin: "12px 0" }} />

      {/* Total cost + profit */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
        <span style={{ color: "#f87171" }}>総コスト</span>
        <span style={{ color: "#f87171", fontVariantNumeric: "tabular-nums" }}>{fmt(result.totalCost)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700 }}>
        <span style={{ color: "#ffffff" }}>純利益</span>
        <span style={{ color: profitColor, fontVariantNumeric: "tabular-nums" }}>{fmt(result.netProfit)}</span>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #1f2937", marginTop: 20, paddingTop: 12, textAlign: "center" }}>
        <div style={{ fontSize: 10, color: "#4b5563" }}>{date}</div>
        <div style={{ fontSize: 10, color: "#374151", marginTop: 2 }}>ebay-calc-app.vercel.app</div>
      </div>
    </div>
  );
});

Receipt.displayName = "Receipt";
export default Receipt;
