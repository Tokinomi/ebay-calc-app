export interface ExchangeRates {
  USD: number;
  GBP: number;
  AUD: number;
  CAD: number;
  EUR: number;
  [key: string]: number;
}

export interface FeeSettings {
  ebayFee: number;            // % (default 15)
  payoneerFee: number;        // % (default 2)
  outsourcingFee: number;     // JPY (default 0)
  miscExpenseRate: number;    // % of purchase price (default 1)
  customsDutyRate: number;    // % of selling item price in JPY (default 10)
  customsDutyManual: boolean; // true = manual override
  customsDutyAmount: number;  // USD (manual override value)
}

export interface CalcInputs {
  purchasePrice: number;       // JPY
  sellingItemPrice: number;    // foreign currency (商品代)
  discount: number;            // foreign currency (割引)
  sellingShippingPrice: number; // foreign currency (送料)
  shippingCost: number;        // JPY (送料コスト, default 3000)
  currency: string;
}

export interface CalcResult {
  sellingItemPriceJPY: number;
  sellingShippingPriceJPY: number;
  sellingPriceJPY: number;
  purchasePriceJPY: number;
  customsDuty: number;
  ebayFeeJPY: number;
  payoneerFeeJPY: number;
  outsourcingFeeJPY: number;
  miscExpenseJPY: number;
  shippingJPY: number;
  totalCost: number;
  netProfit: number;
  profitMargin: number;
}

export interface ReverseCalcResult {
  requiredItemPriceForeign: number; // gross selling price in foreign currency
  result: CalcResult;
}

export const CATEGORIES = [
  { value: "cameras",              label: "カメラ" },
  { value: "watches",              label: "腕時計" },
  { value: "musical_instruments",  label: "楽器" },
  { value: "video_games",          label: "ゲーム" },
  { value: "toys",                 label: "おもちゃ・玩具" },
  { value: "brand_goods",          label: "ブランド品" },
  { value: "others",               label: "その他" },
] as const;

export type CategoryValue = typeof CATEGORIES[number]["value"];

export interface HistoryRecord {
  id: string;
  timestamp: number;
  memo: string;
  category: CategoryValue;
  mode: "standard" | "reverse";
  currency: string;
  sellingItemPrice: number;
  targetProfit?: number;
  result: CalcResult;
}
