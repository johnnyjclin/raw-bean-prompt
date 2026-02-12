import { ethers } from "ethers";
import { TOKEN_FACTORY_BONDING_CURVE_ABI, TOKEN_FACTORY_BONDING_CURVE_ADDRESS } from "./contract-abi";

// Get ethers provider from user's wallet
export function getProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet provider found");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

// Get all token addresses from bonding curve factory
export async function getAllTokenAddresses(): Promise<string[]> {
  const provider = getProvider();
  const factoryContract = new ethers.Contract(
    TOKEN_FACTORY_BONDING_CURVE_ADDRESS,
    TOKEN_FACTORY_BONDING_CURVE_ABI,
    provider
  );
  const addresses = await factoryContract.getAllAbilityTokens();
  return addresses;
}

// Get token info from bonding curve factory
export async function getTokenInfo(tokenAddress: string) {
  const provider = getProvider();
  const factoryContract = new ethers.Contract(
    TOKEN_FACTORY_BONDING_CURVE_ADDRESS,
    TOKEN_FACTORY_BONDING_CURVE_ABI,
    provider
  );

  const [name, symbol, prompt, description, creator, circulatingSupply, basePrice, priceIncrement, buyPrice1, sellPrice1] =
    await factoryContract.getTokenInfo(tokenAddress);

  return {
    name,
    symbol,
    prompt,
    description,
    creator,
    circulatingSupply: circulatingSupply.toString(),
    basePrice: ethers.formatEther(basePrice),
    priceIncrement: ethers.formatEther(priceIncrement),
    buyPrice1: ethers.formatEther(buyPrice1),
    sellPrice1: circulatingSupply > BigInt(0) ? ethers.formatEther(sellPrice1) : "0",
  };
}

// Get user's token balance
export async function getTokenBalance(
  tokenAddress: string,
  userAddress: string
): Promise<bigint> {
  const provider = getProvider();
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ["function balanceOf(address account) view returns (uint256)"],
    provider
  );
  return await tokenContract.balanceOf(userAddress);
}

// Helper to add delay between calls
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
