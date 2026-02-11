import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia, base, baseSepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Raw Bean Prompt",
  // Get your Project ID from https://cloud.walletconnect.com/
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7", // Temporary for testing
  chains: [mainnet, sepolia, base, baseSepolia],
  ssr: true, // Next.js SSR support
});
