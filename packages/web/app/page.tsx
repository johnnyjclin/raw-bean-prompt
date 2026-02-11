"use client";

import { Rocket, Copy, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getAllTokenAddresses, getTokenInfo, delay } from "@/lib/contract-helpers";
import { TradingPanel } from "@/components/TradingPanel";
import { PriceChart } from "@/components/PriceChart";
import { TradingBotToggle } from "@/components/TradingBotToggle";

interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  prompt: string;
  description: string;
  creator: string;
  totalSupply: string;
}

export default function Home() {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all tokens using ethers.js
  useEffect(() => {
    async function fetchTokensInfo() {
      try {
        setLoading(true);
        setError(null);
        
        const addresses = await getAllTokenAddresses();
        const tokensData: TokenInfo[] = [];
        
        for (const address of addresses) {
          try {
            const info = await getTokenInfo(address);
            tokensData.push({ address, ...info });
            
            // Small delay between requests to avoid rate limits
            await delay(100);
          } catch (error) {
            console.error(`Error fetching token ${address}:`, error);
          }
        }
        
        setTokens(tokensData);
      } catch (error: any) {
        console.error("Error fetching tokens:", error);
        setError(error.message || "Failed to load tokens");
      } finally {
        setLoading(false);
      }
    }

    fetchTokensInfo();
  }, []);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Trading handlers (will be connected to contract later)
  const handleBuyToken = async (ethAmount: string) => {
    console.log("Buying token with", ethAmount, "ETH");
    // TODO: Connect to contract buyToken function
    alert(`Buy function will be connected when contract is updated!\nAmount: ${ethAmount} ETH`);
  };

  const handleSellToken = async (tokenAmount: string) => {
    console.log("Selling", tokenAmount, "tokens");
    // TODO: Connect to contract sellToken function
    alert(`Sell function will be connected when contract is updated!\nAmount: ${tokenAmount} tokens`);
  };

  const handleBotToggle = (enabled: boolean) => {
    console.log("Trading bot", enabled ? "enabled" : "disabled");
    // TODO: Implement bot logic
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">Launch Your Token in One Click</h1>
        <p className="text-xl text-gray-400 mb-8">Create instantly tradeable tokens</p>
      </div>

      {/* Marketplace */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Marketplace</h2>
          <Link 
            href="/launch"
            className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <Rocket className="w-5 h-5" />
            Launch Token
          </Link>
        </div>

        {/* Token Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            <p className="text-gray-400 mt-4">Loading tokens...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-500 rounded-xl p-12 text-center">
            <h3 className="text-xl font-bold mb-2 text-red-500">Error</h3>
            <p className="text-gray-400">{error}</p>
            <p className="text-sm text-gray-500 mt-2">Make sure your wallet is connected</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <Rocket className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-bold mb-2">No tokens yet</h3>
            <p className="text-gray-400 mb-6">Be the first to launch a tokenized prompt!</p>
            <Link 
              href="/launch"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Rocket className="w-5 h-5" />
              Launch Your First Token
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokens.map((token) => (
              <div
                key={token.address}
                onClick={() => setSelectedToken(token)}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-green-500 transition-colors cursor-pointer"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-1">{token.name}</h3>
                  <p className="text-green-500 font-mono text-sm">${token.symbol}</p>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Creator:</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyAddress(token.creator);
                    }}
                    className="flex items-center gap-1 hover:text-green-500 transition-colors"
                  >
                    <span className="font-mono">{token.creator.slice(0, 6)}...{token.creator.slice(-4)}</span>
                    <Copy className="w-3 h-3" />
                  </button>
                  {copiedAddress === token.creator && (
                    <span className="text-green-500 text-xs">✓ Copied</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedToken && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50"
          onClick={() => setSelectedToken(null)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-start justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold mb-1">{selectedToken.name}</h2>
                <p className="text-green-500 font-mono">${selectedToken.symbol}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedToken(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Token Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Prompt Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-green-500">Prompt Content</h3>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <p className="text-gray-300 whitespace-pre-wrap">{selectedToken.prompt}</p>
                    </div>
                  </div>

                  {/* Description Section */}
                  {selectedToken.description && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-blue-500">Description</h3>
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <p className="text-gray-300 whitespace-pre-wrap">{selectedToken.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Token Address */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-2">Token Address</p>
                    <button
                      type="button"
                      onClick={() => copyAddress(selectedToken.address)}
                      className="flex items-center gap-2 hover:text-green-500 transition-colors"
                    >
                      <span className="text-sm font-mono break-all">{selectedToken.address}</span>
                      <Copy className="w-4 h-4 flex-shrink-0" />
                    </button>
                  </div>

                  {/* Creator Info */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-2">Creator Address</p>
                    <button
                      type="button"
                      onClick={() => copyAddress(selectedToken.creator)}
                      className="flex items-center gap-2 hover:text-green-500 transition-colors"
                    >
                      <span className="font-mono text-sm break-all">{selectedToken.creator}</span>
                      <Copy className="w-4 h-4 flex-shrink-0" />
                    </button>
                    {copiedAddress === selectedToken.creator && (
                      <p className="text-green-500 text-xs mt-2">✓ Address copied to clipboard</p>
                    )}
                  </div>
                </div>

                {/* Right Column - Trading Panel */}
                <div className="space-y-6">
                  {/* Price Chart */}
                  <PriceChart 
                    tokenSymbol={selectedToken.symbol}
                    currentPrice="0.001"
                  />

                  {/* Trading Panel */}
                  <TradingPanel
                    tokenAddress={selectedToken.address}
                    tokenSymbol={selectedToken.symbol}
                    currentPrice="0.001"
                    onBuy={handleBuyToken}
                    onSell={handleSellToken}
                  />

                  {/* Trading Bot */}
                  <TradingBotToggle
                    tokenAddress={selectedToken.address}
                    tokenSymbol={selectedToken.symbol}
                    onToggle={handleBotToggle}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}