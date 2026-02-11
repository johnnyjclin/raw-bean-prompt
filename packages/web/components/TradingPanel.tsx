"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { getTokenBalance } from "@/lib/contract-helpers";
import { ethers } from "ethers";

interface TradingPanelProps {
  tokenAddress: string;
  tokenSymbol: string;
  currentPrice?: string;  // buy price for 1 whole token (ETH string)
  sellPrice?: string;     // sell price for 1 whole token (ETH string)
  onBuy?: (tokenAmount: string, ethCost: string) => Promise<void>;
  onSell?: (tokenAmount: string) => Promise<void>;
}

export function TradingPanel({
  tokenAddress,
  tokenSymbol,
  currentPrice = "0.000001",
  sellPrice,
  onBuy,
  onSell,
}: TradingPanelProps) {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });

  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  // Buy mode: user inputs ETH → calculates tokens
  // Sell mode: user inputs tokens → calculates ETH refund
  const [inputValue, setInputValue] = useState("");
  const [outputValue, setOutputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<bigint>(BigInt(0));
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Fetch token balance when wallet connects or token changes
  useEffect(() => {
    async function fetchBalance() {
      // Skip on server side
      if (typeof window === "undefined") {
        setLoadingBalance(false);
        return;
      }
      
      if (!address || !isConnected) {
        setTokenBalance(BigInt(0));
        return;
      }
      try {
        setLoadingBalance(true);
        const balance = await getTokenBalance(tokenAddress, address);
        setTokenBalance(balance);
      } catch (e) {
        console.error("Error fetching token balance:", e);
        setTokenBalance(BigInt(0));
      } finally {
        setLoadingBalance(false);
      }
    }
    fetchBalance();
  }, [address, tokenAddress, isConnected]);

  // Reset inputs when switching tab
  const switchTab = (tab: "buy" | "sell") => {
    setActiveTab(tab);
    setInputValue("");
    setOutputValue("");
  };

  // --- Buy mode: input ETH, output whole tokens ---
  const handleBuyInputChange = (ethInput: string) => {
    setInputValue(ethInput);
    if (!ethInput || parseFloat(ethInput) <= 0) {
      setOutputValue("");
      return;
    }
    const ethVal = parseFloat(ethInput);
    const pricePerToken = parseFloat(currentPrice);
    if (pricePerToken <= 0) return;
    // whole tokens the user can buy (floor)
    const tokens = Math.floor(ethVal / pricePerToken);
    setOutputValue(tokens > 0 ? tokens.toString() : "0");
  };

  // --- Sell mode: input whole tokens, output ETH ---
  const handleSellInputChange = (tokenInput: string) => {
    setInputValue(tokenInput);
    if (!tokenInput || parseFloat(tokenInput) <= 0) {
      setOutputValue("");
      return;
    }
    const tokens = Math.floor(parseFloat(tokenInput));
    const pricePerToken = parseFloat(sellPrice ?? currentPrice);
    const ethRefund = (tokens * pricePerToken).toFixed(10);
    setOutputValue(ethRefund);
  };

  const handleInputChange = (value: string) => {
    if (activeTab === "buy") handleBuyInputChange(value);
    else handleSellInputChange(value);
  };

  // Validation
  const hasEnoughEth = () => {
    if (activeTab !== "buy" || !ethBalance || !inputValue) return true;
    try {
      const required = ethers.parseEther(inputValue);
      return ethBalance.value >= required;
    } catch { return true; }
  };

  const hasEnoughTokens = () => {
    if (activeTab !== "sell" || !inputValue) return true;
    const tokens = Math.floor(parseFloat(inputValue));
    const required = BigInt(tokens) * BigInt(10 ** 18);
    return tokenBalance >= required;
  };

  const canTrade = () => {
    if (!isConnected) return false;
    if (!inputValue || parseFloat(inputValue) <= 0) return false;
    if (activeTab === "buy") {
      if (!hasEnoughEth()) return false;
      const tokens = parseInt(outputValue || "0");
      return tokens > 0;
    } else {
      if (!hasEnoughTokens()) return false;
      const tokens = Math.floor(parseFloat(inputValue));
      return tokens > 0;
    }
  };

  const handleTrade = async () => {
    if (!canTrade()) return;
    setIsLoading(true);
    try {
      if (activeTab === "buy" && onBuy) {
        const tokens = outputValue; // whole token count
        const ethCost = inputValue; // ETH the user is sending
        await onBuy(tokens, ethCost);
      } else if (activeTab === "sell" && onSell) {
        const tokens = Math.floor(parseFloat(inputValue)).toString();
        await onSell(tokens);
      }
      setInputValue("");
      setOutputValue("");
      // Refresh balance
      if (address) {
        const balance = await getTokenBalance(tokenAddress, address);
        setTokenBalance(balance);
      }
    } catch (error) {
      console.error("Trade failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet";
    if (isLoading) return "Processing...";
    if (activeTab === "buy") {
      if (!hasEnoughEth()) return "Insufficient ETH";
      return `Buy ${tokenSymbol}`;
    } else {
      if (!hasEnoughTokens()) return "Insufficient Balance";
      return `Sell ${tokenSymbol}`;
    }
  };

  const tokenBalanceFormatted = parseFloat(
    ethers.formatEther(tokenBalance)
  ).toFixed(2);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      {/* Wallet warning */}
      {!isConnected && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-500 text-center">
            ⚠️ Please connect your wallet to trade
          </p>
        </div>
      )}

      {/* Balances */}
      {isConnected && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <Wallet className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-400">ETH</span>
            </div>
            <p className="text-sm font-mono font-bold">
              {ethBalance
                ? parseFloat(ethers.formatEther(ethBalance.value)).toFixed(6)
                : "—"}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <Wallet className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-400">{tokenSymbol}</span>
            </div>
            <p className="text-sm font-mono font-bold">
              {loadingBalance ? "..." : tokenBalanceFormatted}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => switchTab("buy")}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
            activeTab === "buy"
              ? "bg-green-500 text-black"
              : "bg-gray-700 text-gray-400 hover:bg-gray-600"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Buy
          </div>
        </button>
        <button
          onClick={() => switchTab("sell")}
          disabled={tokenBalance === BigInt(0)}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            activeTab === "sell"
              ? "bg-red-500 text-black"
              : "bg-gray-700 text-gray-400 hover:bg-gray-600"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Sell
          </div>
        </button>
      </div>

      {/* Price reference */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {activeTab === "buy" ? "Buy Price / token" : "Sell Price / token"}
          </span>
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-green-500" />
            <span className="font-mono text-sm font-bold text-green-500">
              {activeTab === "buy"
                ? parseFloat(currentPrice).toFixed(8)
                : parseFloat(sellPrice ?? currentPrice).toFixed(8)}{" "}
              ETH
            </span>
          </div>
        </div>
      </div>

      {/* Input / Output */}
      <div className="space-y-2 mb-4">
        {/* Input */}
        <div className="relative">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="0"
            min="0"
            step={activeTab === "buy" ? "0.000001" : "1"}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 pr-16 focus:outline-none focus:border-green-500 text-white"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">
            {activeTab === "buy" ? "ETH" : tokenSymbol}
          </span>
        </div>

        {/* Arrow */}
        <div className="text-center text-gray-500 text-xs">↓ you receive</div>

        {/* Output (read-only) */}
        <div className="relative">
          <input
            type="text"
            value={outputValue}
            readOnly
            placeholder="0"
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 pr-16 text-gray-300 cursor-default"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">
            {activeTab === "buy" ? tokenSymbol : "ETH"}
          </span>
        </div>
      </div>

      {/* Warnings */}
      {isConnected && inputValue && parseFloat(inputValue) > 0 && (
        <>
          {activeTab === "buy" && !hasEnoughEth() && (
            <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-500 text-center">
                Insufficient ETH — need {inputValue} ETH
              </p>
            </div>
          )}
          {activeTab === "sell" && !hasEnoughTokens() && (
            <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-500 text-center">
                Insufficient balance — you have {tokenBalanceFormatted} {tokenSymbol}
              </p>
            </div>
          )}
        </>
      )}

      {/* Trade button */}
      <button
        onClick={handleTrade}
        disabled={!canTrade() || isLoading}
        className={`w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          activeTab === "buy"
            ? "bg-green-500 hover:bg-green-600 text-black"
            : "bg-red-500 hover:bg-red-600 text-black"
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          getButtonText()
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-3">
        Bonding curve — price changes with supply
      </p>
    </div>
  );
}
