"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { HistoryRecord, CATEGORIES } from "../types";
import Receipt from "./Receipt";

interface Props {
  records: HistoryRecord[];
  onDelete: (id: string) => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", GBP: "£", AUD: "A$", CAD: "C$", EUR: "€",
};

function fmt(v: number) {
  return `¥${Math.round(v).toLocaleString("ja-JP")}`;
}

export default function HistorySection({ records, onDelete }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [receiptRecord, setReceiptRecord] = useState<HistoryRecord | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (record: HistoryRecord) => {
    setReceiptRecord(record);
    setDownloading(record.id);
    // Wait for React to render the receipt
    await new Promise((r) => setTimeout(r, 100));
    try {
      const node = receiptRef.current;
      if (!node) return;
      const dataUrl = await toPng(node, { pixelRatio: 2 });
      const link = document.createElement("a");
      const date = new Date(record.timestamp).toISOString().slice(0, 10);
      link.download = `ebay-calc-${date}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Image export failed:", e);
    } finally {
      setDownloading(null);
    }
  };

  if (records.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        履歴
      </h2>
      <div className="flex flex-col gap-3">
        {records.map((rec) => {
          const sym = CURRENCY_SYMBOLS[rec.currency] ?? rec.currency;
          const profitColor = rec.result.netProfit >= 0 ? "text-emerald-400" : "text-red-400";
          const marginColor =
            rec.result.profitMargin >= 20
              ? "text-emerald-400"
              : rec.result.profitMargin >= 10
              ? "text-yellow-400"
              : "text-red-400";
          const date = new Date(rec.timestamp).toLocaleString("ja-JP", {
            month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
          });

          return (
            <div key={rec.id} className="bg-gray-800 rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
                      {CATEGORIES.find((c) => c.value === rec.category)?.label ?? "その他"}
                    </span>
                    {rec.memo && (
                      <p className="text-sm font-medium text-white">{rec.memo}</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{date}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(rec)}
                    disabled={downloading === rec.id}
                    className="p-1.5 rounded-lg bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600 transition-colors disabled:opacity-50"
                    title="画像をダウンロード"
                  >
                    {downloading === rec.id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => onDelete(rec.id)}
                    className="p-1.5 rounded-lg bg-gray-700 text-gray-400 hover:text-red-400 hover:bg-gray-600 transition-colors"
                    title="削除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">
                    {rec.mode === "reverse" ? "必要価格" : "販売価格"}
                  </p>
                  <p className="text-sm font-medium text-blue-400 tabular-nums">
                    {sym}{rec.sellingItemPrice.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">純利益</p>
                  <p className={`text-sm font-medium tabular-nums ${profitColor}`}>
                    {fmt(rec.result.netProfit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">利益率</p>
                  <p className={`text-sm font-medium tabular-nums ${marginColor}`}>
                    {rec.result.profitMargin.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden receipt for image export */}
      <div style={{ position: "fixed", left: "-9999px", top: "-9999px", zIndex: -1 }}>
        <Receipt ref={receiptRef} record={receiptRecord} />
      </div>
    </div>
  );
}
