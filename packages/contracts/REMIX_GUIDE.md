# 🎨 Remix IDE Development Guide

## 📝 Overview

This guide shows how to develop and deploy the RawBean contracts using Remix IDE - perfect for hackathons when you need quick iterations!

## 🚀 Quick Start with Remix

### 1. Open Remix IDE

Go to [https://remix.ethereum.org](https://remix.ethereum.org)

### 2. Create File Structure

In Remix, create the following files:

```
contracts/
├── AbilityToken.sol
└── AbilityTokenFactory.sol
```

### 3. Import OpenZeppelin

Our contracts use OpenZeppelin v5. Remix will automatically fetch imports when you compile.

**Important**: Make sure the imports at the top of the files are correct:
```solidity
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
```

### 4. Compile

1. Go to the **Solidity Compiler** tab (left sidebar)
2. Select compiler version: `0.8.20+`
3. Enable optimization: `200` runs
4. Click **Compile AbilityTokenFactory.sol**

### 5. Deploy

#### Option A: Deploy to Remix VM (for testing)

1. Go to **Deploy & Run Transactions** tab
2. Select Environment: **Remix VM (Shanghai)**
3. Select Contract: **AbilityTokenFactory**
4. Click **Deploy**

#### Option B: Deploy to Base Sepolia

1. Install MetaMask and switch to **Base Sepolia** network
2. Get test ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
3. In Remix:
   - Select Environment: **Injected Provider - MetaMask**
   - Select Contract: **AbilityTokenFactory**
   - Click **Deploy**
   - Confirm transaction in MetaMask

#### Option C: Deploy to Base Mainnet

1. Switch MetaMask to **Base** network
2. Make sure you have real ETH on Base
3. Deploy same as testnet (be careful - this costs real money!)

### 6. Interact with Contract

After deployment, you'll see the contract in the **Deployed Contracts** section.

#### Create Your First Token

1. Expand your deployed contract
2. Find `createAbilityToken` function
3. Fill in parameters:
   ```
   name: "My First Prompt"
   symbol: "PROMPT1"
   prompt: "You are a creative AI assistant that helps with..."
   description: "A collection of creative AI prompts"
   category: "AI"
   initialSupply: 1000000
   ```
4. Click **transact**
5. Confirm in MetaMask (if using injected provider)

#### Query Tokens

- `getAllAbilityTokens()` - Get all token addresses
- `getTotalAbilityTokens()` - Get count
- `getCreatorTokens(address)` - Get tokens by creator
- `getTokenInfo(address)` - Get token details

## 🎯 Hackathon Tips

### Speed Up Development

1. **Use Remix VM First**: Test everything in the VM before deploying to testnet
2. **Save Your Work**: Download files regularly (`File > Download`)
3. **Use Remix Plugins**:
   - **Flattener**: Flatten contracts for verification
   - **Debugger**: Debug failed transactions
   - **Gas Profiler**: Optimize gas usage

### Common Issues

#### ❌ Import Not Found
**Solution**: Remix will auto-fetch OpenZeppelin. Wait a few seconds after pasting code.

#### ❌ Compilation Error
**Solution**: Check Solidity version is `0.8.20` or higher

#### ❌ Transaction Failed
**Solution**: Check you have enough ETH for gas

#### ❌ MetaMask Not Connecting
**Solution**: Refresh Remix and reconnect MetaMask

## 📊 Verify Contract on Basescan

### Method 1: Using Remix (Easiest)

1. Install **Sourcify** plugin in Remix
2. After deployment, click **Verify** in the plugin
3. Select your contract and network
4. Click **Verify**

### Method 2: Using Hardhat (Professional)

If you want to switch to Hardhat later:

```bash
# From packages/contracts
pnpm install
pnpm compile

# Deploy (saves deployment info)
pnpm deploy:base-sepolia

# Verify
pnpm verify
```

## 🔍 Testing in Remix

Create a test file `test_factory.js`:

```javascript
// Right-click on the test file
// Select "Run" to execute tests

const { expect } = require("chai");

describe("AbilityTokenFactory", function() {
    it("Should create a token", async function() {
        const factory = await ethers.getContractAt(
            "AbilityTokenFactory", 
            "FACTORY_ADDRESS"
        );
        
        const tx = await factory.createAbilityToken(
            "Test",
            "TST", 
            "Test prompt",
            "Test desc",
            "Test",
            1000
        );
        
        await tx.wait();
        
        const total = await factory.getTotalAbilityTokens();
        expect(total).to.equal(1);
    });
});
```

## 📋 Deployment Checklist

Before submitting for hackathon:

- [ ] Contracts compile without errors
- [ ] Tested basic functionality in Remix VM
- [ ] Deployed to testnet (Base Sepolia)
- [ ] Created test tokens successfully
- [ ] Verified contract on Basescan
- [ ] Documented contract address in README
- [ ] Tested with frontend integration
- [ ] Deployed to mainnet (if required)

## 🎨 Example: Complete Hackathon Flow

### 1. Develop in Remix (30 mins)
- Write contracts
- Test in Remix VM
- Fix bugs

### 2. Deploy to Testnet (10 mins)
- Connect MetaMask
- Deploy to Base Sepolia
- Create sample tokens

### 3. Build Frontend (2 hours)
- Use deployed address
- Test all functions
- Polish UI

### 4. Deploy to Mainnet (10 mins)
- Deploy factory to Base
- Verify on Basescan
- Update frontend config

### 5. Demo Prep (30 mins)
- Create demo tokens
- Prepare walkthrough
- Test user flow

## 🔗 Useful Links

- **Remix IDE**: https://remix.ethereum.org
- **Base Sepolia Faucet**: https://www.coinbase.com/faucets
- **Base Sepolia Explorer**: https://sepolia.basescan.org
- **Base Mainnet Explorer**: https://basescan.org
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts/5.x/
- **Solidity Docs**: https://docs.soliditylang.org/

## 💡 Pro Tips

1. **Gas Optimization**: Our contracts are already optimized, but you can:
   - Batch token creation if creating multiple
   - Use events instead of storage for historical data

2. **Frontend Integration**: Export ABI from Remix:
   - Compile contract
   - Click "ABI" button to copy
   - Paste into your `contract-abi.ts` file

3. **Demo Strategy**:
   - Pre-create interesting tokens before demo
   - Have test accounts ready
   - Show the full user journey

4. **Judging Criteria**:
   - ✅ Working demo on mainnet/testnet
   - ✅ Clean, commented code
   - ✅ Verified contracts
   - ✅ Good documentation
   - ✅ Innovative use case

## 🆘 Emergency Fixes

### Contract Has Bug After Deployment

**Can't upgrade deployed contract!** Options:
1. Deploy new version
2. Update frontend to use new address
3. Announce migration to users

### Out of Gas

**Increase gas limit in MetaMask**:
1. Click "Edit" on gas fee
2. Set higher gas limit (e.g., 500000)

### Wrong Network

**Check MetaMask network**:
- Base Mainnet: Chain ID 8453
- Base Sepolia: Chain ID 84532

---

**Happy Hacking! 🚀**
