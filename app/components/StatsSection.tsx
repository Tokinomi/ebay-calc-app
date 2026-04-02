"use client";

import { HistoryRecord, CATEGORIES } from "../types";

interface Props {
  records: HistoryRecord[];
}

function fmt(v: number) {
  return `¥${Math.round(v).toLocaleString("ja-JP")}`;
}

export default function StatsSection({ records }: Props) {
  if (records.length < 2) return null;

  // Aggregate by category
  const agg = CATEGORIES.map((cat) => {
    const recs = records.filter((r) => r.category === cat.value);
    if (recs.length === 0) return null;
    const avgProfit = recs.reduce((s, r) => s + r.result.netProfit, 0) / recs.length;
    const avgMargin = recs.reduce((s, r) => s + r.result.profitMargin, 0) / recs.length;
    return { label: cat.label, count: recs.length, avgProfit, avgMargin };
  }).filter(Boolean) as { label: string; count: number; avgProfit: number; avgMargin: number }[];

  if (agg.length === 0) return null;

  const maxMargin = Math.max(...agg.map((a) => Math.abs(a.avgMargin)));
  const totalCount = records.length;
  const overallAvgMargin = records.reduce((s, r) => s + r.result.profitMargin, 0) / totalCount;
  const overallAvgProfit = records.reduce((s, r) => s + r.result.netProfit, 0) / totalCount;

  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        集計
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-800 rounded-2xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">記録数</p>
          <p className="text-lg font-bold text-white">{totalCount}</p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">平均利益率</p>
          <p className={`text-lg font-bold tabular-nums ${overallAvgMargin >= 20 ? "text-emerald-400" : overallAvgMargin >= 10 ? "text-yellow-400" : "text-red-400"}`}>
            {overallAvgMargin.toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">平均利益</p>
          <p className={`text-base font-bold tabular-nums ${overallAvgProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {fmt(overallAvgProfit)}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-gray-800 rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">カテゴリ別</p>
        <div className="flex flex-col gap-4">
          {agg.sort((a, b) => b.count - a.count).map((cat) => {
            const barWidth = maxMargin > 0 ? Math.abs(cat.avgMargin) / maxMargin * 100 : 0;
            const marginColor = cat.avgMargin >= 20 ? "bg-emerald-500" : cat.avgMargin >= 10 ? "bg-yellow-500" : "bg-red-500";
            const marginTextColor = cat.avgMargin >= 20 ? "text-emerald-400" : cat.avgMargin >= 10 ? "text-yellow-400" : "text-red-400";
            return (
              <div key={cat.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">{cat.label}</span>
                    <span className="text-xs text-gray-500">{cat.count}件</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 tabular-nums">{fmt(cat.avgProfit)}</span>
                    <span className={`text-sm font-semibold tabular-nums ${marginTextColor}`}>
                      {cat.avgMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${marginColor}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
