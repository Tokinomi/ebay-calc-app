import { CalcInputs, CalcResult, FeeSettings, ReverseCalcResult } from "../types";

export function calculate(
  inputs: CalcInputs,
  fees: FeeSettings,
  exchangeRate: number,
  usdRate: number
): CalcResult | null {
  if (!inputs.sellingItemPrice || !exchangeRate) return null;

  const sellingItemPriceJPY = (inputs.sellingItemPrice - inputs.discount) * exchangeRate;
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

// Reverse calculation: given a target profit, find the required selling item price.
// Derivation (auto duty mode):
//   netProfit = x*(1 - dutyRate - feeRate) + s*(1 - feeRate) - fixedCosts
//   x = (targetProfit + fixedCosts - s*(1-feeRate)) / (1 - dutyRate - feeRate)
// where x = (sellingItemPrice - discount) * exchangeRate
export function reverseCalculate(
  inputs: CalcInputs,
  fees: FeeSettings,
  targetProfitJPY: number,
  exchangeRate: number,
  usdRate: number
): ReverseCalcResult | null {
  if (!exchangeRate) return null;

  const s = inputs.sellingShippingPrice * exchangeRate;
  const feeRate = (fees.ebayFee + fees.payoneerFee) / 100;
  const fixedCosts =
    inputs.purchasePrice +
    fees.outsourcingFee +
    inputs.purchasePrice * (fees.miscExpenseRate / 100) +
    inputs.shippingCost;

  let x: number;
  if (fees.customsDutyManual) {
    const manualDuty = fees.customsDutyAmount * usdRate;
    const denom = 1 - feeRate;
    if (denom <= 0) return null;
    x = (targetProfitJPY + fixedCosts + manualDuty - s * (1 - feeRate)) / denom;
  } else {
    const dutyRate = fees.customsDutyRate / 100;
    const denom = 1 - dutyRate - feeRate;
    if (denom <= 0) return null;
    x = (targetProfitJPY + fixedCosts - s * (1 - feeRate)) / denom;
  }

  const requiredItemPriceForeign = x / exchangeRate + inputs.discount;
  const result = calculate(
    { ...inputs, sellingItemPrice: requiredItemPriceForeign },
    fees,
    exchangeRate,
    usdRate
  );
  return result ? { requiredItemPriceForeign, result } : null;
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
