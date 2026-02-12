"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bot, ArrowLeft, Loader2, Play, Wallet } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useAccount } from "wagmi";
import { useUserAbilityTokens } from "../../lib/hooks/useUserAbilityTokens";

interface Skill {
  id: string;
  name: string;
  rarity: string;
  description?: string;
  balance?: string;
  category?: string; // "owned" or "purchased"
}

interface ScrapedProject {
  hash: string;
  href: string;
  title?: string;
  ticker?: string;
  imageUrl?: string;
  price?: string;
  marketCap?: string;
  description?: string;
  creator?: string;
  createdAgo?: string;
  priceChange?: string;
}

interface RecommendedProject {
  hash: string;
  title: string;
  ticker?: string;
  score: number;
  reason: string;
  marketCap?: string;
  priceChange?: string;
  price?: string;
  contractAddress?: string;
}

interface AnalysisData {
  recommendedProjects: RecommendedProject[];
  summary: string;
  reasoning: string;
}

interface TokenDetail {
  contractAddress: string;
  ticker: string;
  name: string;
  description?: string;
  creator?: string;
  createdAgo?: string;
  ethPrice?: string;
  usdPrice?: string;
  marketCap?: string;
  marketCapUSD?: string;
  athMarketCap?: string;
  priceChange24h?: string;
  volume24h?: string;
  slippage?: string;
  buyEnabled: boolean;
  sellEnabled: boolean;
  hasChart: boolean;
  chartDataPoints?: number;
}

interface ScrapedData {
  projects: ScrapedProject[];
  pageText: string;
  url: string;
}

// Lottie animations for different skill counts
const BOT_LOTTIES = [
  'https://lottie.host/6d8da68c-9bae-41c8-a3e5-e03d3f014182/M0iCPHQxoa.lottie', // 0 skills
  'https://lottie.host/8b2d85e6-0f57-4b48-ae58-4d43bb1e396c/wEntREqzNY.lottie', // 1 skill
  'https://lottie.host/195d5bc3-1bf2-42a4-a98f-8116a937a97a/pa7luwwhBC.lottie', // 2 skills
  'https://lottie.host/90e892a0-b21c-43fc-bd7f-7f5d8c90b007/VvejiIExdJ.lottie', // 3 skills (executing)
];

// MOCK DATA for simulation
const MOCK_TOKEN_DETAILS: TokenDetail = {
  contractAddress: "0x713b7F49F5700e24544710fe0dF868793ABFD8D5", // Using Factory Address as mock placeholder content
  ticker: "RBNP",
  name: "RobinPump AI",
  description: "The official AI agent token of the RobinPump ecosystem. Automatically analyzes and trades high-potential memecoins with advanced sentiment analysis.",
  creator: "Robin Dev",
  createdAgo: "2 days ago",
  ethPrice: "0.0042 ETH",
  usdPrice: "$12.50",
  marketCap: "$1.2M",
  marketCapUSD: "$1,200,000",
  athMarketCap: "$1.5M",
  priceChange24h: "+15.4%",
  volume24h: "$450K",
  slippage: "1%",
  buyEnabled: true,
  sellEnabled: true,
  hasChart: true
};

const MOCK_ANALYSIS_RESULT: AnalysisData = {
  summary: "Based on the prompt, I've analyzed the RobinPump ecosystem. The sentiment is bullish with high user engagement.",
  reasoning: "1. Token momentum is strong with a 15% increase in the last 24h.\n2. Social volume is up 200%.\n3. Liquidity is locked and safe.\n4. Developer team is active and doxxed.",
  recommendedProjects: [
    {
      hash: "mock-robin-pump",
      title: "RobinPump AI",
      ticker: "RBNP",
      score: 95,
      reason: "High growth potential & strong community backing.",
      marketCap: "$1.2M",
      priceChange: "+15.4%",
      price: "0.000042",
      contractAddress: "0x18f6a4c6d274d35d819af45c2a12Dc27c2cdba5e"
    },
    {
      hash: "mock-bean-ai",
      title: "Bean AI",
      ticker: "BEAN",
      score: 88,
      reason: "Rising star in the legume-based AI sector.",
      marketCap: "$800K",
      priceChange: "+5.2%",
      price: "0.000035",
      contractAddress: "0x18f6a4c6d274d35d819af45c2a12Dc27c2cdba5e"
    }
  ]
};

export default function AgentPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { tokens: userTokens, isLoading: isLoadingTokens } = useUserAbilityTokens();
  
  const [robotHeadSlots, setRobotHeadSlots] = useState<(Skill | null)[]>([null, null, null]);
  const [inventory, setInventory] = useState<(Skill | null)[]>([null, null, null, null]);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [dragOverInventory, setDragOverInventory] = useState<number | null>(null);
  const [absorbed, setAbsorbed] = useState(false);
  const [draggingFromHead, setDraggingFromHead] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  // scrapedData removed as we use mock data
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenDetail | null>(null);
  const [isTrading, setIsTrading] = useState(false);
  const [tradeAmount, setTradeAmount] = useState("0.0000001"); // Default from user script
  const [tokenAmount, setTokenAmount] = useState("43763261019685000000"); // Default from user script
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<RecommendedProject | null>(null);
  const [buyInputETH, setBuyInputETH] = useState("");
  const [buyOutputTokens, setBuyOutputTokens] = useState("");

  const equippedCount = robotHeadSlots.filter(Boolean).length;
  const lottieIndex = Math.min(equippedCount, BOT_LOTTIES.length - 1);
  const currentLottie = BOT_LOTTIES[lottieIndex];

  // Preload lottie animations
  useEffect(() => {
    BOT_LOTTIES.forEach((url) => {
      fetch(url, { mode: 'cors' }).catch(() => {});
    });
  }, []);

  // Memoize user tokens string to prevent unnecessary rerenders
  const userTokensKey = useMemo(() => 
    userTokens.map(t => `${t.address}-${t.balanceFormatted}`).join(','),
    [userTokens]
  );

  // Load user's ability tokens from wallet
  useEffect(() => {
    if (isConnected && userTokens.length > 0) {
      // Convert ability tokens to skills format
      const skills: (Skill | null)[] = userTokens.slice(0, 4).map(token => ({
        id: token.address,
        name: token.symbol,
        rarity: token.category === "owned" ? "legendary" : "rare",
        description: token.prompt,
        balance: token.balanceFormatted,
        category: token.category,
      }));
      
      // Fill remaining slots with null
      while (skills.length < 4) {
        skills.push(null);
      }
      
      setInventory(skills as (Skill | null)[]);
    } else if (!isConnected) {
      // Show placeholder when not connected
      setInventory([null, null, null, null]);
    }
  }, [isConnected, userTokensKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load scraped data from extension (URL parameters) - OPTIONAL: Keep if we still want this to work from extension
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('source');
    const encodedData = params.get('data');
    
    if (source === 'extension' && encodedData) {
      try {
        const decodedData = JSON.parse(atob(encodedData)) as TokenDetail;
        setSelectedToken(decodedData);
      } catch (error) {
        console.error('Failed to parse extension data', error);
      }
      window.history.replaceState({}, '', '/agent');
    }
  }, []);



  const handleInventoryDragStart = (e: React.DragEvent, slotIndex: number) => {
    const skill = inventory[slotIndex];
    if (!skill) return;
    e.dataTransfer.setData("application/json", JSON.stringify({ skill, from: "inventory", slotIndex }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleHeadDragStart = (e: React.DragEvent, headSlot: number) => {
    const skill = robotHeadSlots[headSlot];
    if (!skill) return;
    setDraggingFromHead(true);
    e.dataTransfer.setData("application/json", JSON.stringify({ skill, from: "head", headSlot }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleHeadSlotDragOver = (e: React.DragEvent, headSlot: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(headSlot);
  };

  const handleHeadSlotDrop = (e: React.DragEvent, headSlot: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json") || "{}");
      const { skill, from, slotIndex } = data;
      if (skill && from === "inventory") {
        // Check if skill is already equipped in head slots
        const alreadyEquipped = robotHeadSlots.some(s => s?.id === skill.id);
        if (alreadyEquipped) return; // Prevent duplicate
        
        const newHeadSlots = [...robotHeadSlots];
        newHeadSlots[headSlot] = skill;
        setRobotHeadSlots(newHeadSlots);
        
        // Clear from inventory
        const newInventory = [...inventory];
        newInventory[slotIndex] = null;
        setInventory(newInventory);
        
        setAbsorbed(true);
        setTimeout(() => setAbsorbed(false), 500);
      }
    } catch {}
  };

  const handleInventoryDrop = (e: React.DragEvent, targetSlot: number) => {
    e.preventDefault();
    setDragOverInventory(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json") || "{}");
      const { skill, from, headSlot } = data;
      if (from === "head" && headSlot !== undefined) {
        // Only allow dropping to empty slots
        if (inventory[targetSlot] !== null) {
          return; // Slot already occupied
        }
        
        const newHeadSlots = [...robotHeadSlots];
        newHeadSlots[headSlot] = null;
        setRobotHeadSlots(newHeadSlots);
        
        // Put back in inventory
        const newInventory = [...inventory];
        newInventory[targetSlot] = skill;
        setInventory(newInventory);
      }
    } catch {}
  };

  const handleDragEnd = () => {
    setDraggingFromHead(false);
    setDragOverSlot(null);
  };

  const handleExecute = async () => {
    setAnalysisData(null);
    setIsExecuting(true);
    setErrorMessage(null);

    try {
      // Get equipped skills and their prompts
      const equippedSkills = robotHeadSlots.filter(Boolean);
      const prompts = equippedSkills
        .map(s => s!.description || s!.name)
        .filter(Boolean);
      
      // Call Google AI API to analyze
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Analysis failed");
      }

      // Generate dynamic summary based on equipped skills
      let summaryText = result.data.summary;
      if (equippedSkills.length > 0 && !summaryText.includes(equippedSkills[0]!.name)) {
        const skillNames = equippedSkills.map(s => s!.name).join(" and ");
        summaryText = `Based on the ${skillNames} prompt: ${summaryText}`;
      }
      
      // Set the AI analysis data
      setAnalysisData({
        ...result.data,
        summary: summaryText
      });
      
    } catch (error) {
      console.error("Error executing agent:", error);
      setErrorMessage("Simulation failed");
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle opening trading modal
  const handleOpenTradingModal = (project: RecommendedProject) => {
    setSelectedProject(project);
    setShowTradingModal(true);
    setBuyInputETH("");
    setBuyOutputTokens("");
  };

  // Calculate tokens based on ETH input
  const handleBuyInputChange = (ethInput: string) => {
    setBuyInputETH(ethInput);
    if (!ethInput || parseFloat(ethInput) <= 0 || !selectedProject?.price) {
      setBuyOutputTokens("");
      return;
    }
    const ethVal = parseFloat(ethInput);
    const pricePerToken = parseFloat(selectedProject.price);
    if (pricePerToken <= 0) return;
    const tokens = Math.floor(ethVal / pricePerToken);
    setBuyOutputTokens(tokens > 0 ? tokens.toString() : "0");
  };

  const handleTrade = async (action: "buy" | "sell") => {
    if (!selectedToken) return;
    if (action === "sell") {
      alert("Sell functionality coming soon");
      return;
    }

    setIsTrading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ethValue: tradeAmount,
          tokenAmount: tokenAmount
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Trade failed");
      }

      alert(`Transaction submitted!\n\nTx Hash: ${result.data.txHash}\nLogs found: ${result.data.logs.length}`);
      console.log("Trade result:", result.data);
    } catch (error) {
      console.error("Error trading:", error);
      setErrorMessage(error instanceof Error ? error.message : "Trade failed");
    } finally {
      setIsTrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold">🤖 Raw Bean Prompt</h1>
        </header>

        <p className="text-center text-gray-300 mb-6">
          Drag skills to the bot&apos;s head to equip, then execute to scrape data
        </p>

        {/* Robot Display & AI Results - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Robot Area */}
          <div>
            <p className="text-sm text-gray-300 mb-3">Robot Agent</p>
            <div
              className={`relative bg-gradient-to-br from-amber-200 to-amber-300 border-4 border-gray-800 rounded-2xl p-8 transition-all duration-300 min-h-[500px] ${
                absorbed ? "scale-105 shadow-2xl shadow-green-500/50" : ""
              } ${dragOverSlot !== null ? "shadow-2xl shadow-blue-500/50" : ""} ${
                draggingFromHead ? "shadow-2xl shadow-orange-500/50" : ""
              }`}
              onDragEnd={handleDragEnd}
            >
              <div className="flex flex-col items-center">
                {/* Head Slots */}
            <p className="text-xs text-gray-700 mb-2 text-center">
              Three slots: drag skills here to equip
            </p>
            <div className="flex gap-3 mb-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-20 h-12 bg-white/60 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                    dragOverSlot === i ? "bg-blue-300 border-blue-600 scale-110" : ""
                  }`}
                  draggable={!!robotHeadSlots[i]}
                  onDragStart={(e) => handleHeadDragStart(e, i)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleHeadSlotDragOver(e, i)}
                  onDragLeave={() => setDragOverSlot(null)}
                  onDrop={(e) => handleHeadSlotDrop(e, i)}
                >
                  {robotHeadSlots[i] ? (
                    <span className="text-xs font-bold text-gray-800 truncate px-1">
                      {robotHeadSlots[i]!.name}
                    </span>
                  ) : (
                    <span className="text-2xl text-gray-400">+</span>
                  )}
                </div>
              ))}
            </div>

            {/* Robot */}
            <div className="relative w-64 h-64 mb-4 mx-auto">
              <DotLottieReact
                key={lottieIndex}
                src={currentLottie}
                loop
                autoplay
                className="w-full h-full"
              />
            </div>

            {/* URL Input */}
            {/* <div className="w-full max-w-md mb-2">
              <label className="text-xs text-gray-700 mb-1 block">Target URL:</label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="Enter URL to scrape..."
                className="w-full px-4 py-2 bg-white/80 border-2 border-gray-600 rounded-lg text-gray-800 placeholder-gray-500"
              />
            </div> */}

            {/* Search Prompt */}
            {/* <div className="w-full max-w-md mb-4">
              <label className="text-xs text-gray-700 mb-1 block">Search Criteria (for LLM):</label>
              <textarea
                value={searchPrompt}
                onChange={(e) => setSearchPrompt(e.target.value)}
                placeholder="Describe what kind of tokens you're looking for..."
                rows={2}
                className="w-full px-4 py-2 bg-white/80 border-2 border-gray-600 rounded-lg text-gray-800 placeholder-gray-500 resize-none"
              />
            </div> */}

            {/* Execute Button */}
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="absolute bottom-4 right-4 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold rounded-lg shadow-lg transition flex items-center gap-2"
            >
              {isExecuting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play size={20} />
                  Execute
                </>
              )}
            </button>

            {/* Error Message */}
            {errorMessage && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
                ⚠️ {errorMessage}
              </div>
            )}
          </div>
        </div>
        </div>

        {/* AI Results Chat Box */}
        <div className="relative mt-6 lg:mt-0">
          <p className="text-sm text-gray-300 mb-3">AI Analysis</p>
          <div className="bg-white/95 border-2 border-gray-600 rounded-2xl p-6 min-h-[500px] max-h-[700px] overflow-y-auto">
            {isExecuting ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-800">
                {/* Lottie Animation */}
                <div className="w-64 h-64 mb-6">
                  <DotLottieReact
                    src="https://lottie.host/90e892a0-b21c-43fc-bd7f-7f5d8c90b007/VvejiIExdJ.lottie"
                    loop
                    autoplay
                    className="w-full h-full"
                  />
                </div>
                
                {/* Glowing Thinking Process Text */}
                <div className="text-center space-y-3">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse text-left">
                    Thinking Process
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700 text-left">
                    <p className="opacity-0 animate-fade-in" style={{animationDelay: '0s', animationFillMode: 'forwards'}}>
                      Analyzing RobinPump tokens...
                    </p>
                    <p className="opacity-0 animate-fade-in" style={{animationDelay: '3s', animationFillMode: 'forwards'}}>
                      Processing equipped skills: {robotHeadSlots.filter(Boolean).map(s => s!.name).join(", ") || "None"}
                    </p>
                    <p className="opacity-0 animate-fade-in" style={{animationDelay: '6s', animationFillMode: 'forwards'}}>
                      Evaluating market trends and token performance...
                    </p>
                    <p className="opacity-0 animate-fade-in" style={{animationDelay: '9s', animationFillMode: 'forwards'}}>
                      Generating investment recommendations...
                    </p>
                  </div>
                </div>
                
                <style jsx>{`
                  @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                  .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                  }
                `}</style>
              </div>
            ) : analysisData ? (
              <div className="space-y-4">
                {/* AI Thinking Process - LLM Style */}
                <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex gap-1 mt-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-mono mb-2">// Analyzing RobinPump ecosystem...</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{analysisData.summary}</p>
                    </div>
                  </div>
                </div>

                {/* Recommended Projects */}
                {analysisData.recommendedProjects.length > 0 && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      🎯
                    </div>
                    <div className="flex-1 bg-blue-50 rounded-2xl rounded-tl-none p-4">
                      <p className="text-sm text-gray-800 font-semibold mb-3">
                        Top {analysisData.recommendedProjects.length} Recommendations
                      </p>
                      <div className="space-y-2">
                        {analysisData.recommendedProjects.map((project, idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-blue-200 rounded-lg p-3 hover:border-blue-400 transition"
                          >
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm">{project.title}</h4>
                                {project.ticker && (
                                  <span className="text-xs text-purple-600">{project.ticker}</span>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-yellow-600">{project.score}</div>
                                <div className="text-xs text-gray-500">Score</div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{project.reason}</p>
                            {project.price && (
                              <div className="text-xs text-gray-700 mb-2">
                                <span className="font-semibold">Price:</span> {project.price} ETH
                              </div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTradingModal(project);
                              }}
                              className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition font-semibold"
                            >
                              ✓ Confirm
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Detailed Analysis */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    📊
                  </div>
                  <div className="flex-1 bg-green-50 rounded-2xl rounded-tl-none p-4">
                    <p className="text-sm text-gray-800 font-semibold mb-2">Detailed Analysis</p>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">{analysisData.reasoning}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Bot size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Execute agent to see AI analysis results</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div>
          {!isConnected ? (
            <div className="mb-3 p-4 bg-yellow-500/20 border border-yellow-500 rounded-lg">
              <p className="text-sm text-yellow-300 flex items-center gap-2">
                <Wallet size={16} />
                Connect your wallet to see your Ability Tokens
              </p>
            </div>
          ) : isLoadingTokens ? (
            <p className="text-sm text-gray-300 mb-3 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Loading your tokens...
            </p>
          ) : userTokens.length === 0 ? (
            <div className="mb-3 p-4 bg-blue-500/20 border border-blue-500 rounded-lg">
              <p className="text-sm text-blue-300">
                You don&apos;t have any Ability Tokens yet. Buy some from the Shop!
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-300 mb-3">
              Your tokens ({userTokens.length}): drag to equip
            </p>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((slot) => {
              const skill = inventory[slot];
              return (
                <div
                  key={slot}
                  className={`min-h-[180px] bg-[#d4c4b0] border-2 rounded-2xl cursor-grab active:cursor-grabbing transition-all relative overflow-hidden ${
                    dragOverInventory === slot 
                      ? "scale-105 border-green-500 shadow-lg" 
                      : "border-[#8b7355] hover:border-gray-700"
                  }`}
                  draggable={!!skill}
                  onDragStart={(e) => handleInventoryDragStart(e, slot)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    // Only allow drag over empty slots when dragging from head
                    if (!skill) {
                      setDragOverInventory(slot);
                    }
                  }}
                  onDragLeave={() => setDragOverInventory(null)}
                  onDrop={(e) => handleInventoryDrop(e, slot)}
                >
                  {skill ? (
                    <div className="h-full flex items-center justify-center p-4 relative">
                      <span className="text-base font-bold text-gray-900 text-center">
                        {skill.name}
                      </span>
                    </div>
                  ) : !isConnected ? (
                    <div className="h-full flex items-center justify-center">
                      <Wallet size={32} className="text-gray-500/40" />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-5xl text-gray-500/40 font-light">+</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Token Detail & Trading Panel - Removed as user requested direct trading */}

        {/* Trading Modal */}
        {showTradingModal && selectedProject && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowTradingModal(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedProject.title}</h3>
                  {selectedProject.ticker && (
                    <p className="text-sm text-purple-600">{selectedProject.ticker}</p>
                  )}
                </div>
                <button
                  onClick={() => setShowTradingModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Price Info */}
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Price per token</span>
                  <span className="font-mono text-sm font-bold text-green-600">
                    {selectedProject.price} ETH
                  </span>
                </div>
              </div>

              {/* Input / Output */}
              <div className="space-y-2 mb-4">
                {/* ETH Input */}
                <div className="relative">
                  <label className="block text-xs text-gray-600 mb-1">Pay (ETH)</label>
                  <input
                    type="number"
                    value={buyInputETH}
                    onChange={(e) => handleBuyInputChange(e.target.value)}
                    placeholder="0.000"
                    min="0"
                    step="0.000001"
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 pr-16 focus:outline-none focus:border-green-500 text-gray-900"
                  />
                  <span className="absolute right-4 top-8 text-gray-500 font-mono text-sm">
                    ETH
                  </span>
                </div>

                {/* Arrow */}
                <div className="text-center text-gray-500 text-xs">↓ you receive</div>

                {/* Token Output */}
                <div className="relative">
                  <label className="block text-xs text-gray-600 mb-1">Receive</label>
                  <input
                    type="text"
                    value={buyOutputTokens}
                    readOnly
                    placeholder="0"
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 pr-16 text-gray-900 cursor-default"
                  />
                  <span className="absolute right-4 top-8 text-gray-500 font-mono text-sm">
                    {selectedProject.ticker || 'Tokens'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTradingModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!buyInputETH || parseFloat(buyInputETH) <= 0) {
                      alert("Please enter an amount");
                      return;
                    }
                    setIsTrading(true);
                    try {
                      // Calculate raw token amount for contract
                      const tokens = parseFloat(buyOutputTokens || "0");
                      const tokenAmountRaw = (tokens * 1e18).toString();
                      
                      const response = await fetch("/api/trade", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ethValue: buyInputETH,
                          tokenAmount: tokenAmountRaw
                        }),
                      });
                      const result = await response.json();
                      if (!response.ok) {
                        throw new Error(result.error || "Trade failed");
                      }
                      alert(`Transaction submitted!\\n\\nTx Hash: ${result.data.txHash}`);
                      setShowTradingModal(false);
                      setBuyInputETH("");
                      setBuyOutputTokens("");
                    } catch (error) {
                      console.error("Trade error:", error);
                      alert(error instanceof Error ? error.message : "Trade failed");
                    } finally {
                      setIsTrading(false);
                    }
                  }}
                  disabled={!buyInputETH || parseFloat(buyInputETH) <= 0 || isTrading}
                  className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                >
                  {isTrading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Trading...
                    </>
                  ) : (
                    "Buy Now"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
