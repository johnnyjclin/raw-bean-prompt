"use client";

import { useAccount } from "wagmi";
import { Wallet, Rocket, Copy, X, Crown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useUserAbilityTokens } from "@/lib/hooks/useUserAbilityTokens";
import { formatEther } from "viem";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { tokens, isLoading, isConnected: hasWallet } = useUserAbilityTokens();
  const [selectedToken, setSelectedToken] = useState<typeof tokens[0] | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  if (!isConnected) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to view your tokens</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Tokens</h1>
        <p className="text-gray-400">Your owned and created ability tokens</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <p className="text-gray-400 mt-4">Loading your tokens...</p>
        </div>
      ) : tokens.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Rocket className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-bold mb-2">No tokens yet</h3>
          <p className="text-gray-400 mb-6">Start by launching or acquiring tokens from the marketplace</p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/launch"
              prefetch={false}
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Rocket className="w-5 h-5" />
              Launch Token
            </Link>
            <Link
              href="/"
              prefetch={false}
              className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-1">Total Tokens</p>
              <p className="text-3xl font-bold">{tokens.length}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-1">Owned Tokens</p>
              <p className="text-3xl font-bold text-green-500">
                {tokens.filter(t => t.category === "owned").length}
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-1">Purchased Tokens</p>
              <p className="text-3xl font-bold text-blue-500">
                {tokens.filter(t => t.category === "purchased").length}
              </p>
            </div>
          </div>

          {/* Token Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokens.map((token) => (
              <div
                key={token.address}
                onClick={() => setSelectedToken(token)}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-green-500 transition-colors cursor-pointer relative"
              >
                {token.category === "owned" && (
                  <div className="absolute top-4 right-4 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    OWNER
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-1">{token.name}</h3>
                  <p className="text-green-500 font-mono text-sm">${token.symbol}</p>
                </div>

                <div className="mb-4 bg-gray-800 rounded-lg px-4 py-3">
                  <span className="text-xs text-gray-400 block mb-1">Your Balance</span>
                  <span className="text-green-400 font-mono font-semibold text-sm">
                    {parseFloat(token.balanceFormatted).toFixed(4)} {token.symbol}
                  </span>
                </div>

                <div className="text-xs text-gray-400">
                  <p className="line-clamp-2">{token.description || token.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {selectedToken && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50"
          onClick={() => setSelectedToken(null)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-start justify-between z-10">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">{selectedToken.name}</h2>
                  {selectedToken.category === "owned" && (
                    <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      OWNER
                    </span>
                  )}
                </div>
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
            <div className="p-6 space-y-6">
              {/* Balance Info */}
              <div className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border border-green-500/30 rounded-lg p-6">
                <p className="text-sm text-gray-400 mb-2">Your Balance</p>
                <p className="text-3xl font-bold text-green-400">
                  {parseFloat(selectedToken.balanceFormatted).toFixed(4)} {selectedToken.symbol}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  ({formatEther(selectedToken.balance)} ETH equivalent)
                </p>
              </div>

              {/* Prompt Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-500">💡 Prompt Content</h3>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <p className="text-gray-300 whitespace-pre-wrap">{selectedToken.prompt}</p>
                </div>
              </div>

              {/* Description Section */}
              {selectedToken.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-500">📝 Description</h3>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-300 whitespace-pre-wrap">{selectedToken.description}</p>
                  </div>
                </div>
              )}

              {/* Token Address */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Token Contract Address</p>
                <button
                  type="button"
                  onClick={() => copyAddress(selectedToken.address)}
                  className="flex items-center gap-2 hover:text-green-500 transition-colors group w-full"
                >
                  <span className="text-sm font-mono break-all flex-1 text-left">{selectedToken.address}</span>
                  <Copy className="w-4 h-4 flex-shrink-0 group-hover:text-green-500" />
                </button>
                {copiedAddress === selectedToken.address && (
                  <p className="text-green-500 text-xs mt-2">✓ Address copied to clipboard</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Link
                  href={`/?token=${selectedToken.address}`}
                  prefetch={false}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-lg font-semibold text-center transition-colors"
                >
                  Trade in Marketplace
                </Link>
                <Link
                  href="/agent"
                  prefetch={false}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold text-center transition-colors"
                >
                  Use in Agent
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}