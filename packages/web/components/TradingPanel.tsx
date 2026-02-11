"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { getTokenBalance } from "@/lib/contract-helpers";
import { ethers } from "ethers";

interface TradingPanelProps {
  tokenAddress: string;
  tokenSymbol: string;
  currentPrice?: string; // Will be calculated from bonding curve later
  onBuy?: (amount: string) => Promise<void>;
  onSell?: (amount: string) => Promise<void>;
}

export function TradingPanel({ 
  tokenAddress, 
  tokenSymbol, 
  currentPrice = "0.001",
  onBuy,
  onSell 
}: TradingPanelProps) {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [ethAmount, setEthAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<bigint>(0n);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // Fetch token balance
  useEffect(() => {
    async function fetchBalance() {
      if (!address || !isConnected) {
        setTokenBalance(0n);
        setLoadingBalance(false);
        return;
      }

      try {
        setLoadingBalance(true);
        const balance = await getTokenBalance(tokenAddress, address);
        setTokenBalance(balance);
      } catch (error) {
        console.error("Error fetching token balance:", error);
        setTokenBalance(0n);
      } finally {
        setLoadingBalance(false);
      }
    }

    fetchBalance();
  }, [address, tokenAddress, isConnected]);

  // Auto-switch to buy tab if no token balance
  useEffect(() => {
    if (tokenBalance === 0n && activeTab === "sell") {
      setActiveTab("buy");
    }
  }, [tokenBalance, activeTab]);

  // Mock price calculation (will be replaced with bonding curve)
  const calculatePrice = (tokenAmount: string) => {
    if (!tokenAmount) return "0";
    const tokens = parseFloat(tokenAmount);
    const price = parseFloat(currentPrice);
    return (tokens * price).toFixed(4);
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setEthAmount(calculatePrice(value));
  };

  // Check if user has enough balance
  const hasEnoughEth = () => {
    if (!ethBalance || !ethAmount) return true;
    const required = ethers.parseEther(ethAmount);
    return ethBalance.value >= required;
  };

  const hasEnoughTokens = () => {
    if (!amount) return true;
    const required = ethers.parseEther(amount);
    return tokenBalance >= required;
  };

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setIsLoading(true);
    try {
      if (activeTab === "buy" && onBuy) {
        await onBuy(ethAmount);
      } else if (activeTab === "sell" && onSell) {
        await onSell(amount);
      }
      // Reset form
      setAmount("");
      setEthAmount("");
    } catch (error) {
      console.error("Trade failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const canTrade = () => {
    if (!isConnected) return false;
    if (!amount || parseFloat(amount) <= 0) return false;
    if (activeTab === "buy" && !hasEnoughEth()) return false;
    if (activeTab === "sell" && !hasEnoughTokens()) return false;
    return true;
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

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      {/* Wallet Connection Warning */}
      {!isConnected && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-500 text-center">
            ⚠️ Please connect your wallet to trade
          </p>
        </div>
      )}

      {/* Balance Display */}
      {isConnected && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <Wallet className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-400">ETH</span>
            </div>
            <p className="text-sm font-mono font-bold">
              {ethBalance ? parseFloat(ethers.formatEther(ethBalance.value)).toFixed(4) : "0.0000"}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <Wallet className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-400">${tokenSymbol}</span>
            </div>
            <p className="text-sm font-mono font-bold">
              {loadingBalance ? "..." : parseFloat(ethers.formatEther(tokenBalance)).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("buy")}
          disabled={!isConnected}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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
          onClick={() => setActiveTab("sell")}
          disabled={!isConnected || tokenBalance === 0n}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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

      {/* No tokens warning for sell */}
      {activeTab === "sell" && tokenBalance === 0n && isConnected && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-xs text-red-500 text-center">
            You don't own any ${tokenSymbol} tokens
          </p>
        </div>
      )}

      {/* Current Price Display */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Current Price</span>
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="font-mono font-bold text-green-500">{currentPrice} ETH</span>
          </div>
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            {activeTab === "buy" ? "Amount to Buy" : "Amount to Sell"}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.0"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 pr-20 focus:outline-none focus:border-green-500"
              step="0.01"
              min="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono">
              ${tokenSymbol}
            </span>
          </div>
        </div>

        {/* ETH Amount */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            {activeTab === "buy" ? "You Pay" : "You Receive"}
          </label>
          <div className="relative">
            <input
              type="text"
              value={ethAmount}
              readOnly
              placeholder="0.0"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 pr-16 focus:outline-none text-gray-300"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono">
              ETH
            </span>
          </div>
        </div>

        {/* Trade Button */}
        <button
          onClick={handleTrade}
          disabled={!canTrade() || isLoading}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            activeTab === "buy"
              ? "bg-green-500 hover:bg-green-600 text-black"
              : "bg-red-500 hover:bg-red-600 text-black"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
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

        {/* Insufficient balance warnings */}
        {isConnected && amount && parseFloat(amount) > 0 && (
          <>
            {activeTab === "buy" && !hasEnoughEth() && (
              <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-500 text-center">
                  Need {ethAmount} ETH, you have {ethBalance ? parseFloat(ethers.formatEther(ethBalance.value)).toFixed(4) : "0"} ETH
                </p>
              </div>
            )}
            {activeTab === "sell" && !hasEnoughTokens() && (
              <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-500 text-center">
                  Need {amount} ${tokenSymbol}, you have {parseFloat(ethers.formatEther(tokenBalance)).toFixed(2)} ${tokenSymbol}
                </p>
              </div>
            )}
          </>
        )}

        {/* Info Text */}
        <p className="text-xs text-gray-500 text-center">
          {activeTab === "buy" 
            ? "Prices update based on bonding curve formula"
            : "2% fee goes to token creator"}
        </p>
      </div>
    </div>
  );
}