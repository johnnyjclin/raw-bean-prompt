import { ethers } from "ethers";
import { TOKEN_FACTORY_ABI, TOKEN_FACTORY_ADDRESS } from "./contract-abi";

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)"
];

// Get ethers provider from user's wallet
export function getProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet provider found");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

// Get all token addresses from factory
export async function getAllTokenAddresses(): Promise<string[]> {
  const provider = getProvider();
  const factoryContract = new ethers.Contract(
    TOKEN_FACTORY_ADDRESS,
    TOKEN_FACTORY_ABI,
    provider
  );
  
  const addresses = await factoryContract.getAllAbilityTokens();
  return addresses;
}

// Get token info from factory
export async function getTokenInfo(tokenAddress: string) {
  const provider = getProvider();
  const factoryContract = new ethers.Contract(
    TOKEN_FACTORY_ADDRESS,
    TOKEN_FACTORY_ABI,
    provider
  );
  
  const [name, symbol, prompt, description, creator, totalSupply] = 
    await factoryContract.getTokenInfo(tokenAddress);
  
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
  const provider = getProvider();
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  
  const balance = await tokenContract.balanceOf(userAddress);
  return balance;
}

// Helper to add delay between calls
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
