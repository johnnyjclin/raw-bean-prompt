"use client";

import { useState } from "react";
import { Bot, Zap, Settings } from "lucide-react";

interface TradingBotToggleProps {
  tokenAddress: string;
  tokenSymbol: string;
  onToggle?: (enabled: boolean) => void;
}

export function TradingBotToggle({ 
  tokenAddress, 
  tokenSymbol,
  onToggle 
}: TradingBotToggleProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [strategy, setStrategy] = useState<"conservative" | "balanced" | "aggressive">("balanced");
  const [showSettings, setShowSettings] = useState(false);

  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    onToggle?.(newState);
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className={`w-5 h-5 ${
            isEnabled ? "text-green-500" : "text-gray-400"
          }`} />
          <h3 className="font-bold">Trading Bot</h3>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Toggle Switch */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-900 rounded-lg">
        <div>
          <p className="text-sm font-semibold">Auto Trade ${tokenSymbol}</p>
          <p className="text-xs text-gray-400 mt-1">
            {isEnabled ? "Bot is actively trading" : "Bot is inactive"}
          </p>
        </div>
        <button
          onClick={handleToggle}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isEnabled ? "bg-green-500" : "bg-gray-700"
          }`}
        >
          <div
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
              isEnabled ? "translate-x-6" : ""
            }`}
          />
        </button>
      </div>

      {/* Status Indicator */}
      {isEnabled && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-green-500 text-sm">
            <Zap className="w-4 h-4 animate-pulse" />
            <span>Bot is monitoring market trends...</span>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Trading Strategy</label>
            <div className="grid grid-cols-3 gap-2">
              {["conservative", "balanced", "aggressive"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStrategy(s as typeof strategy)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    strategy === s
                      ? "bg-green-500 text-black"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-700">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">Strategy Details</h4>
            <div className="space-y-1 text-xs text-gray-500">
              {strategy === "conservative" && (
                <>
                  <p>• Buy when price drops 5%</p>
                  <p>• Sell when price rises 10%</p>
                  <p>• Max trade: 10% of holdings</p>
                </>
              )}
              {strategy === "balanced" && (
                <>
                  <p>• Buy when price drops 3%</p>
                  <p>• Sell when price rises 7%</p>
                  <p>• Max trade: 20% of holdings</p>
                </>
              )}
              {strategy === "aggressive" && (
                <>
                  <p>• Buy when price drops 2%</p>
                  <p>• Sell when price rises 5%</p>
                  <p>• Max trade: 30% of holdings</p>
                </>
              )}
            </div>
          </div>

          {/* Recent Actions */}
          {isEnabled && (
            <div className="pt-3 border-t border-gray-700">
              <h4 className="text-xs font-semibold text-gray-400 mb-2">Recent Actions</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">2 min ago</span>
                  <span className="text-green-500">Bought 10 ${tokenSymbol}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">1 hour ago</span>
                  <span className="text-red-500">Sold 5 ${tokenSymbol}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warning */}
      {!isEnabled && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-500">
            ⚠️ Bot trades automatically based on market conditions. Use at your own risk.
          </p>
        </div>
      )}
    </div>
  );
}