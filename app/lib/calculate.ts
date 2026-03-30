import { CalcInputs, CalcResult, FeeSettings } from "../types";

export function calculate(
  inputs: CalcInputs,
  fees: FeeSettings,
  exchangeRate: number,
  usdRate: number
): CalcResult | null {
  if (!inputs.sellingItemPrice || !exchangeRate) return null;

  const sellingItemPriceJPY = inputs.sellingItemPrice * exchangeRate;
  const sellingShippingPriceJPY = inputs.sellingShippingPrice * exchangeRate;
  const sellingPriceJPY = sellingItemPriceJPY + sellingShippingPriceJPY;

  // Customs duty: manual (USD → JPY) or auto (% of selling item price in JPY)
  const customsDuty = fees.customsDutyManual
    ? fees.customsDutyAmount * usdRate
    : sellingItemPriceJPY * (fees.customsDutyRate / 100);

  // eBay fee applied to total selling price in JPY
  const ebayFeeJPY = sellingPriceJPY * (fees.ebayFee / 100);

  // Payoneer fee applied to total selling price in JPY
  const payoneerFeeJPY = sellingPriceJPY * (fees.payoneerFee / 100);

  const outsourcingFeeJPY = fees.outsourcingFee;

  const miscExpenseJPY = inputs.purchasePrice * (fees.miscExpenseRate / 100);

  const shippingJPY = inputs.shippingCost;

  const totalCost =
    inputs.purchasePrice +
    customsDuty +
    ebayFeeJPY +
    payoneerFeeJPY +
    outsourcingFeeJPY +
    miscExpenseJPY +
    shippingJPY;

  const netProfit = sellingPriceJPY - totalCost;

  const profitMargin =
    sellingPriceJPY > 0 ? (netProfit / sellingPriceJPY) * 100 : 0;

  return {
    sellingItemPriceJPY,
    sellingShippingPriceJPY,
    sellingPriceJPY,
    purchasePriceJPY: inputs.purchasePrice,
    customsDuty,
    ebayFeeJPY,
    payoneerFeeJPY,
    outsourcingFeeJPY,
    miscExpenseJPY,
    shippingJPY,
    totalCost,
    netProfit,
    profitMargin,
  };
}

export const DEFAULT_FEES: FeeSettings = {
  ebayFee: 15,
  payoneerFee: 2,
  outsourcingFee: 0,
  miscExpenseRate: 1,
  customsDutyRate: 10,
  customsDutyManual: false,
  customsDutyAmount: 0,
};
