"use client";

import { CalcInputs, FeeSettings } from "../types";

interface Props {
  inputs: CalcInputs;
  fees: FeeSettings;
  onInputChange: (key: keyof CalcInputs, value: number | string) => void;
  onFeeChange: (key: keyof FeeSettings, value: number | boolean) => void;
}

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
}

function NumberInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  min = 0,
}: NumberInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400">{label}</label>
      <div className="flex items-center bg-gray-700 rounded-xl overflow-hidden">
        {prefix && (
          <span className="px-3 text-gray-400 text-sm border-r border-gray-600">
            {prefix}
          </span>
        )}
        <input
          type="number"
          inputMode="decimal"
          value={value === 0 ? "" : value}
          placeholder="0"
          min={min}
          step={step}
          onChange={(e) =>
            onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))
          }
          className="flex-1 bg-transparent px-3 py-3 text-white text-right text-base outline-none"
        />
        {suffix && (
          <span className="px-3 text-gray-400 text-sm border-l border-gray-600">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  GBP: "£",
  AUD: "A$",
  CAD: "C$",
  EUR: "€",
};

export default function InputSection({
  inputs,
  fees,
  onInputChange,
  onFeeChange,
}: Props) {
  const currencySymbol = CURRENCY_SYMBOLS[inputs.currency] ?? inputs.currency;

  return (
    <div className="flex flex-col gap-4">
      {/* Basic Inputs */}
      <div className="bg-gray-800 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          基本情報
        </h2>
        <div className="flex flex-col gap-3">
          <NumberInput
            label="仕入値"
            value={inputs.purchasePrice}
            onChange={(v) => onInputChange("purchasePrice", v)}
            prefix="¥"
          />
          <NumberInput
            label={`販売価格 商品代（${inputs.currency}）`}
            value={inputs.sellingItemPrice}
            onChange={(v) => onInputChange("sellingItemPrice", v)}
            prefix={currencySymbol}
            step={0.01}
          />
          <NumberInput
            label={`販売価格 送料（${inputs.currency}）`}
            value={inputs.sellingShippingPrice}
            onChange={(v) => onInputChange("sellingShippingPrice", v)}
            prefix={currencySymbol}
            step={0.01}
          />
          <NumberInput
            label="送料コスト"
            value={inputs.shippingCost}
            onChange={(v) => onInputChange("shippingCost", v)}
            prefix="¥"
          />
          <NumberInput
            label={`割引（${inputs.currency}）`}
            value={inputs.discount}
            onChange={(v) => onInputChange("discount", v)}
            prefix={currencySymbol}
            step={0.01}
          />
        </div>
      </div>

      {/* Fee Settings */}
      <div className="bg-gray-800 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          手数料・経費設定
        </h2>
        <div className="flex flex-col gap-3">
          <NumberInput
            label="eBay手数料"
            value={fees.ebayFee}
            onChange={(v) => onFeeChange("ebayFee", v)}
            suffix="%"
            step={0.1}
          />
          <NumberInput
            label="Payoneer手数料"
            value={fees.payoneerFee}
            onChange={(v) => onFeeChange("payoneerFee", v)}
            suffix="%"
            step={0.1}
          />
          <NumberInput
            label="外注費"
            value={fees.outsourcingFee}
            onChange={(v) => onFeeChange("outsourcingFee", v)}
            prefix="¥"
          />
          <NumberInput
            label="諸経費率（仕入値の）"
            value={fees.miscExpenseRate}
            onChange={(v) => onFeeChange("miscExpenseRate", v)}
            suffix="%"
            step={0.1}
          />

          {/* Customs Duty */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">
                関税
                {!fees.customsDutyManual && (
                  <span className="ml-1 text-gray-500">（商品代の）</span>
                )}
              </label>
              <button
                onClick={() =>
                  onFeeChange("customsDutyManual", !fees.customsDutyManual)
                }
                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                  fees.customsDutyManual
                    ? "bg-orange-600 text-white"
                    : "bg-gray-600 text-gray-300"
                }`}
              >
                {fees.customsDutyManual ? "手動(USD)" : "自動"}
              </button>
            </div>
            {fees.customsDutyManual ? (
              <div className="flex items-center bg-gray-700 rounded-xl overflow-hidden">
                <span className="px-3 text-gray-400 text-sm border-r border-gray-600">
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={fees.customsDutyAmount === 0 ? "" : fees.customsDutyAmount}
                  placeholder="0"
                  min={0}
                  step={0.01}
                  onChange={(e) =>
                    onFeeChange(
                      "customsDutyAmount",
                      e.target.value === "" ? 0 : parseFloat(e.target.value)
                    )
                  }
                  className="flex-1 bg-transparent px-3 py-3 text-white text-right text-base outline-none"
                />
              </div>
            ) : (
              <div className="flex items-center bg-gray-700 rounded-xl overflow-hidden">
                <input
                  type="number"
                  inputMode="decimal"
                  value={fees.customsDutyRate === 0 ? "" : fees.customsDutyRate}
                  placeholder="0"
                  min={0}
                  step={0.1}
                  onChange={(e) =>
                    onFeeChange(
                      "customsDutyRate",
                      e.target.value === "" ? 0 : parseFloat(e.target.value)
                    )
                  }
                  className="flex-1 bg-transparent px-3 py-3 text-white text-right text-base outline-none"
                />
                <span className="px-3 text-gray-400 text-sm border-l border-gray-600">
                  %
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
