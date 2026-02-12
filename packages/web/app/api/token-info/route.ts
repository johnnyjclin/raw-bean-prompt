import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { TOKEN_FACTORY_ABI, TOKEN_FACTORY_ADDRESS } from "@/lib/contract-abi";

const publicClient = createPublicClient({
  chain: base,
  transport: http()
});

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    const tokenInfo = await publicClient.readContract({
      address: TOKEN_FACTORY_ADDRESS as `0x${string}`,
      abi: TOKEN_FACTORY_ABI,
      functionName: "getTokenInfo",
      args: [address as `0x${string}`]
    } as any);

    const [name, symbol, prompt, description, creator, totalSupply, price] = tokenInfo as readonly [string, string, string, string, `0x${string}`, bigint, bigint];

    return NextResponse.json({
      name,
      symbol,
      prompt,
      description,
      creator,
      totalSupply: totalSupply.toString(),
      price: price.toString()
    });
  } catch (error) {
    console.error("Error fetching token info:", error);
    return NextResponse.json({ error: "Failed to fetch token info" }, { status: 500 });
  }
}