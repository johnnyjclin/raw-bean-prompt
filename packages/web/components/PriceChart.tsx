"use client";

import { TrendingUp, Activity } from "lucide-react";

interface PriceChartProps {
  tokenSymbol: string;
  currentPrice?: string;   // buy price for 1 token
  sellPrice?: string;      // sell price for 1 token
  circulatingSupply?: string;
  priceHistory?: Array<{ time: string; price: number }>;
}

export function PriceChart({
  tokenSymbol,
  currentPrice = "0.000001",
  sellPrice,
  circulatingSupply = "0",
  priceHistory = []
}: PriceChartProps) {
  // Mock price history data (will be replaced with real data)
  const mockHistory = priceHistory.length > 0 ? priceHistory : [
    { time: "1h", price: 0.0008 },
    { time: "2h", price: 0.0009 },
    { time: "3h", price: 0.00095 },
    { time: "4h", price: 0.001 },
  ];

  const priceChange = mockHistory.length > 1
    ? ((mockHistory[mockHistory.length - 1].price - mockHistory[0].price) / mockHistory[0].price * 100)
    : 0;

  const isPositive = priceChange >= 0;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">${tokenSymbol} Price</h3>
          <p className="text-2xl font-mono font-bold text-green-500 mt-1">
            {currentPrice} ETH
          </p>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
          isPositive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
        }`}>
          <TrendingUp className={`w-4 h-4 ${
            isPositive ? "" : "rotate-180"
          }`} />
          <span className="text-sm font-semibold">
            {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Simple Chart Visualization */}
      <div className="relative h-32 bg-gray-900 rounded-lg p-4 mb-3">
        <div className="flex items-end justify-between h-full gap-1">
          {mockHistory.map((point, index) => {
            const maxPrice = Math.max(...mockHistory.map(p => p.price));
            const minPrice = Math.min(...mockHistory.map(p => p.price));
            const range = maxPrice - minPrice || 0.0001;
            const height = ((point.price - minPrice) / range) * 100;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t transition-all hover:opacity-80"
                  style={{ height: `${Math.max(height, 10)}%` }}
                  title={`${point.price} ETH`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Time Labels */}
      <div className="flex justify-between text-xs text-gray-500">
        {mockHistory.map((point, index) => (
          <span key={index}>{point.time}</span>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-700">
        <div>
          <p className="text-xs text-gray-400">Buy Price</p>
          <p className="text-sm font-semibold mt-1 text-green-400 font-mono">
            {parseFloat(currentPrice).toFixed(8)} ETH
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Sell Price</p>
          <p className="text-sm font-semibold mt-1 text-red-400 font-mono">
            {sellPrice && parseFloat(sellPrice) > 0
              ? `${parseFloat(sellPrice).toFixed(8)} ETH`
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Circulating Supply</p>
          <p className="text-sm font-semibold mt-1">{circulatingSupply}</p>
        </div>
      </div>

      {/* Bonding Curve Info */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Activity className="w-3 h-3" />
          <span>Bonding Curve AMM - Price adjusts automatically</span>
        </div>
      </div>
    </div>
  );
}