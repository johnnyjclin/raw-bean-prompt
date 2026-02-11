"use client";

import { useAccount } from "wagmi";
import { Wallet, Rocket, Copy, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getAllTokenAddresses, getTokenInfo, getTokenBalance, delay } from "@/lib/contract-helpers";

interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  prompt: string;
  description: string;
  creator: string;
  balance: string;
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [ownedTokens, setOwnedTokens] = useState<TokenInfo[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOwnedTokens() {
      // Skip on server side
      if (typeof window === "undefined") {
        return;
      }
      
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const addresses = await getAllTokenAddresses();
        const owned: TokenInfo[] = [];

        for (const tokenAddr of addresses) {
          try {
            // Get token info
            const info = await getTokenInfo(tokenAddr);
            
            // Get balance
            const balance = await getTokenBalance(tokenAddr, address);
            
            if (balance > 0n) {
              owned.push({
                address: tokenAddr,
                balance: balance.toString(),
                ...info,
              });
            }

            // Small delay between requests
            await delay(100);
          } catch (error) {
            console.error(`Error fetching token ${tokenAddr}:`, error);
          }
        }

        setOwnedTokens(owned);
      } catch (error: any) {
        console.error("Error fetching owned tokens:", error);
        setError(error.message || "Failed to load tokens");
      } finally {
        setLoading(false);
      }
    }

    fetchOwnedTokens();
  }, [address]);

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
        <p className="text-gray-400">Tokens you own from the marketplace</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <p className="text-gray-400 mt-4">Loading your tokens...</p>
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-500 rounded-xl p-12 text-center">
          <h3 className="text-xl font-bold mb-2 text-red-500">Error</h3>
          <p className="text-gray-400">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Make sure your wallet is connected</p>
        </div>
      ) : ownedTokens.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Rocket className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-bold mb-2">No tokens yet</h3>
          <p className="text-gray-400 mb-6">Start by launching or acquiring tokens from the marketplace</p>
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
          {ownedTokens.map((token) => (
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
                  <span className="text-green-500 text-xs">✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedToken && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50"
          onClick={() => setSelectedToken(null)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-start justify-between">
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

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-500">Prompt Content</h3>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <p className="text-gray-300 whitespace-pre-wrap">{selectedToken.prompt}</p>
                </div>
              </div>

              {selectedToken.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-500">Description</h3>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-300 whitespace-pre-wrap">{selectedToken.description}</p>
                  </div>
                </div>
              )}

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Token Address</p>
                <button
                  type="button"
                  onClick={() => copyAddress(selectedToken.address)}
                  className="flex items-center gap-2 hover:text-green-500 transition-colors"
                >
                  <span className="text-sm font-mono">{selectedToken.address}</span>
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Creator Address</p>
                <button
                  type="button"
                  onClick={() => copyAddress(selectedToken.creator)}
                  className="flex items-center gap-2 hover:text-green-500 transition-colors"
                >
                  <span className="font-mono text-sm">{selectedToken.creator}</span>
                  <Copy className="w-4 h-4" />
                </button>
                {copiedAddress === selectedToken.creator && (
                  <p className="text-green-500 text-xs mt-2">✓ Copied</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}