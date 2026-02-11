import { ethers } from "ethers";
import { TOKEN_FACTORY_ABI, TOKEN_FACTORY_ADDRESS } from "./contract-abi";

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)"
];

// Get ethers provider from user's wallet or fallback to RPC
export function getProvider() {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  // Fallback to Base Mainnet RPC for read-only access (matching deployed contract)
  return new ethers.JsonRpcProvider("https://mainnet.base.org");
}

// Singleton provider to avoid connection overhead
const READ_PROVIDER = new ethers.JsonRpcProvider("https://mainnet.base.org");

// Dedicated read-only provider to ensure consistent data regardless of user's wallet network
export function getReadProvider() {
  return READ_PROVIDER;
}

// Helper to retry failed requests
async function withRetry<T>(fn: () => Promise<T>, retries = 3, backoff = 500): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, backoff));
    return withRetry(fn, retries - 1, backoff * 1.5);
  }
}

// Get all token addresses from factory
export async function getAllTokenAddresses(): Promise<string[]> {
  // Always use the read provider to fetch the global list of tokens from Mainnet
  const provider = getReadProvider();
  const factoryContract = new ethers.Contract(
    TOKEN_FACTORY_ADDRESS,
    TOKEN_FACTORY_ABI,
    provider
  );
  
  return withRetry(() => factoryContract.getAllAbilityTokens());
}

// Get token info from factory
export async function getTokenInfo(tokenAddress: string) {
  // Always use read provider for metadata
  const provider = getReadProvider();
  const factoryContract = new ethers.Contract(
    TOKEN_FACTORY_ADDRESS,
    TOKEN_FACTORY_ABI,
    provider
  );
  
  // Retry this call specifically as it's prone to timeouts in loops
  const [name, symbol, prompt, description, creator, totalSupply] = 
    await withRetry(() => factoryContract.getTokenInfo(tokenAddress));
  
  return {
    name,
    symbol,
    prompt,
    description,
    creator,
    totalSupply: totalSupply.toString()
  };
}

// Get user's balance for a token
export async function getTokenBalance(
  tokenAddress: string,
  userAddress: string
): Promise<bigint> {
  // Balance can also be checked via read provider (public data)
  const provider = getReadProvider();
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  
  return withRetry(() => tokenContract.balanceOf(userAddress));
}

// Helper to add delay between calls
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
