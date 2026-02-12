import React from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { formatEther } from "viem";
import { 
  TOKEN_FACTORY_BONDING_CURVE_ADDRESS, 
  TOKEN_FACTORY_BONDING_CURVE_ABI,
  ABILITY_TOKEN_BONDING_CURVE_ABI 
} from "../contract-abi";

export interface AbilityToken {
  address: `0x${string}`;
  name: string;
  symbol: string;
  prompt: string;
  description: string;
  balance: bigint;
  balanceFormatted: string;
  category?: string; // "owned" or "purchased"
}

export function useUserAbilityTokens() {
  const { address: userAddress, isConnected } = useAccount();

  // Step 1: Get all ability tokens from factory
  const { data: allTokenAddresses, isLoading: isLoadingTokens } = useReadContract({
    address: TOKEN_FACTORY_BONDING_CURVE_ADDRESS,
    abi: TOKEN_FACTORY_BONDING_CURVE_ABI,
    functionName: "getAllAbilityTokens",
    query: {
      enabled: isConnected,
    },
  });

  // Step 2: For each token, get info and balance
  const tokenContracts = (allTokenAddresses as `0x${string}`[] | undefined)?.map((tokenAddress) => [
    // Get token info
    {
      address: TOKEN_FACTORY_BONDING_CURVE_ADDRESS,
      abi: TOKEN_FACTORY_BONDING_CURVE_ABI,
      functionName: "getTokenInfo",
      args: [tokenAddress],
    },
    // Get user balance
    {
      address: tokenAddress,
      abi: ABILITY_TOKEN_BONDING_CURVE_ABI,
      functionName: "balanceOf",
      args: [userAddress],
    },
  ]).flat() || [];

  const { data: tokenData, isLoading: isLoadingData } = useReadContracts({
    contracts: tokenContracts as any[],
    query: {
      enabled: isConnected && !!allTokenAddresses && allTokenAddresses.length > 0,
    },
  });

  // Step 3: Parse and filter tokens with balance > 0 OR user is creator
  const userTokens: AbilityToken[] = [];
  
  if (tokenData && allTokenAddresses) {
    for (let i = 0; i < allTokenAddresses.length; i++) {
      const infoIndex = i * 2;
      const balanceIndex = i * 2 + 1;
      
      const infoResult = tokenData[infoIndex];
      const balanceResult = tokenData[balanceIndex];
      
      if (infoResult?.status === "success" && balanceResult?.status === "success") {
        const [name, symbol, prompt, description, creator] = infoResult.result as [string, string, string, string, string, bigint, bigint, bigint, bigint, bigint];
        const balance = balanceResult.result as bigint;
        
        // Include tokens if: balance > 0 OR user is the creator
        const isCreator = creator.toLowerCase() === userAddress?.toLowerCase();
        
        if (balance > 0n || isCreator) {
          userTokens.push({
            address: allTokenAddresses[i],
            name,
            symbol,
            prompt,
            description,
            balance,
            balanceFormatted: formatEther(balance),
            category: isCreator ? "owned" : "purchased",
          });
        }
      }
    }
  }

  // Memoize to prevent unnecessary rerenders when data hasn't changed
  const memoizedTokens = React.useMemo(() => userTokens, [
    JSON.stringify(userTokens.map(t => ({ address: t.address, balance: t.balance.toString() })))
  ]);

  return {
    tokens: memoizedTokens,
    isLoading: isLoadingTokens || isLoadingData,
    isConnected,
  };
}
