"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Rocket } from "lucide-react";
import Link from "next/link";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { TOKEN_FACTORY_BONDING_CURVE_ABI, TOKEN_FACTORY_BONDING_CURVE_ADDRESS } from "@/lib/contract-abi";

export default function LaunchPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    prompt: "",
    description: "",
    category: "",
    basePrice: "0.000001",
    priceIncrement: "0.0000001",
  });

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      writeContract({
        address: TOKEN_FACTORY_BONDING_CURVE_ADDRESS as `0x${string}`,
        abi: TOKEN_FACTORY_BONDING_CURVE_ABI,
        functionName: "createAbilityToken",
        args: [
          formData.name,
          formData.symbol,
          formData.prompt,
          formData.description,
          formData.category,
          parseEther(formData.basePrice),
          parseEther(formData.priceIncrement),
        ]
      } as any);
    } catch (error) {
      console.error("Launch error:", error);
      alert("Launch failed: " + (error as Error).message);
    }
  };

  if (isConfirmed) {
    setTimeout(() => router.push("/"), 2000);
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      {/* Back Button */}
      <Link 
        href="/" 
        prefetch={false}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to startups</span>
      </Link>

      {/* Title */}
      <h1 className="text-4xl font-bold mb-2">Launch your prompt</h1>
      <p className="text-gray-400 mb-8">
        Create a strategic prompt that's instantly tradeable in one click
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Details Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h2 className="text-xl font-bold mb-2">Details</h2>
          <p className="text-gray-400 text-sm mb-6">
            Choose carefully, these can't be changed after launch
          </p>

          {/* Name and Ticker */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                placeholder="Name your prompt"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 placeholder:text-gray-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Symbol</label>
              <input
                type="text"
                placeholder="Token symbol (e.g. ACME)"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 placeholder:text-gray-500"
                required
                maxLength={10}
              />
            </div>
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
              required
            >
              <option value="">Select a category</option>
              <option value="AI">AI & Machine Learning</option>
              <option value="Development">Development</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Writing">Writing</option>
              <option value="Data">Data Analysis</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Prompt */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Prompt Content</label>
              <span className="text-sm text-gray-500">
                {formData.prompt.length}
              </span>
            </div>
            <textarea
              placeholder="Enter the actual prompt that will be tokenized as an ability"
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 h-32 resize-none placeholder:text-gray-500"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Description</label>
              <span className="text-sm text-gray-500">
                {formData.description.length}/300
              </span>
            </div>
            <textarea
              placeholder="Brief description that will be shown to buyers. Currently supports up to 300 characters."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value.slice(0, 300) })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 h-24 resize-none placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Bonding Curve Pricing Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h2 className="text-xl font-bold mb-2">Bonding Curve Pricing</h2>
          <p className="text-gray-400 text-sm mb-6">
            Price rises as more tokens are bought, and falls as they are sold.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Base Price (ETH)</label>
              <input
                type="number"
                step="0.0000001"
                min="0.0000001"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Price of the first token</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Price Increment (ETH)</label>
              <input
                type="number"
                step="0.00000001"
                min="0"
                value={formData.priceIncrement}
                onChange={(e) => setFormData({ ...formData, priceIncrement: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Price increase per token minted</p>
            </div>
          </div>
        </div>

        {/* Initial Supply Section (disabled — bonding curve mints on demand) */}
        {/* <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h2 className="text-xl font-bold mb-2">Initial Supply</h2>
          <p className="text-gray-400 text-sm mb-6">
            Total supply of tokens to be minted for this ability.
          </p>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <input
                type="number"
                step="1"
                min="1"
                value={formData.initialSupply}
                onChange={(e) => setFormData({ ...formData, initialSupply: e.target.value })}
                placeholder="1000000"
                className="flex-1 bg-transparent text-4xl font-bold focus:outline-none placeholder:text-gray-700"
                required
              />
              <span className="text-2xl font-bold text-gray-400">TOKENS</span>
            </div>
          </div>
        </div> */}

        {/* Launch Button */}
        <button
          type="submit"
          disabled={!isConnected || isPending || isConfirming}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-black disabled:text-gray-500 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Rocket className="w-5 h-5" />
          {isPending ? "Confirming..." : isConfirming ? "Waiting..." : isConfirmed ? "✓ Success!" : "Launch Prompt"}
        </button>

        {!isConnected && (
          <p className="text-center text-gray-400 text-sm">
            Please connect your wallet to launch a token
          </p>
        )}
      </form>
    </main>
  );
}