import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

// Contract Addresses
const CONTRACTS = {
    safeReceiver: '0xaee44c38633f7ed683c0c61840663c04d6c4c937',
    tokenContract: '0x18f6a4c6d274d35d819af45c2a12Dc27c2cdba5e',
    purchaseContract: '0x1c47d62dabfe2753fdf90ddc49d6509570cad72f'
};

// ABIs
const ABIS = {
    safeReceiver: [
        'function safeReceive(address sender, uint256 value) external',
        'event SafeReceived(address indexed sender, uint256 value)'
    ],
    token: [
        'function transfer(address to, uint256 amount) external returns (bool)',
        'function approve(address spender, uint256 amount) external returns (bool)',
        'function balanceOf(address account) external view returns (uint256)',
        'event Transfer(address indexed from, address indexed to, uint256 value)'
    ],
    purchase: [
        'function purchaseTokens(uint256 usdcAmount) external',
        'function buyTokens(address buyer, uint256 usdcValue) external',
        'function buy(uint256 amount, uint256 deadline) external payable',
        'event TokensPurchased(address indexed buyer, uint256 indexed round, uint256 usdcValue, uint256 tokens)'
    ]
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { ethValue, tokenAmount } = body;

        if (!process.env.PRIVATE_KEY) {
            return NextResponse.json({ error: "Server misconfigured: PRIVATE_KEY missing" }, { status: 500 });
        }

        console.log('🚀 Starting Trade execution...');
        
        // 1. Setup Provider & Wallet
        const rpcUrl = process.env.RPC_URL || 'https://mainnet.base.org';
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

        console.log(`📝 Wallet: ${wallet.address}`);

        // 2. Contract Instances
        const safeReceiverContract = new ethers.Contract(CONTRACTS.safeReceiver, ABIS.safeReceiver, wallet);
        const tokenContract = new ethers.Contract(CONTRACTS.tokenContract, ABIS.token, wallet);
        const purchaseContract = new ethers.Contract(CONTRACTS.purchaseContract, ABIS.purchase, wallet);

        // 3. Prepare Transaction
        const buyAmount = tokenAmount ? BigInt(tokenAmount) : 43763261019685000000n;
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); 
        const parsedEthValue = ethValue ? ethers.parseEther(ethValue.toString()) : ethers.parseEther('0.0000001');

        console.log(`   Amount: ${buyAmount}`);
        console.log(`   Deadline: ${deadline}`);
        console.log(`   Value: ${ethers.formatEther(parsedEthValue)} ETH`);

        // 4. Execute Transaction
        console.log('\n🚀 Sending transaction to purchaseContract.buy()...');
        const tx = await purchaseContract.buy(
            buyAmount,
            deadline,
            { 
                value: parsedEthValue
            }
        );

        console.log(`   ⏳ Transaction sent! Hash: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log('   ✅ Transaction confirmed!');

        // 5. Parse Logs
        const logs = receipt.logs.map((log: any, index: number) => {
            let parsedLog = null;
            let source = '';

            try { parsedLog = safeReceiverContract.interface.parseLog(log); source = 'SafeReceiver'; } catch(e) {}
            if (!parsedLog) try { parsedLog = tokenContract.interface.parseLog(log); source = 'Token'; } catch(e) {}
            if (!parsedLog) try { parsedLog = purchaseContract.interface.parseLog(log); source = 'Purchase'; } catch(e) {}

            if (parsedLog) {
                return { index, source, name: parsedLog.name, args: sanitizeArgs(parsedLog.args) };
            } else {
                return { index, source: 'Unknown', topic: log.topics[0] };
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                logs: logs,
                message: "Trade executed successfully"
            }
        });

    } catch (error: any) {
        console.error('❌ Execution failed:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || "Transaction failed",
            details: error.reason || error.data
        }, { status: 500 });
    }
}

// Helper to make BigInt serializable
function sanitizeArgs(args: any): any {
    const res: any = {};
    if (args) {
        Object.keys(args).forEach(key => {
            if (isNaN(Number(key))) { // only named keys
                const val = args[key];
                res[key] = typeof val === 'bigint' ? val.toString() : val;
            }
        });
    }
    return res;
}
