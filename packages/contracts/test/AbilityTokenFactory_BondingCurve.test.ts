import { expect } from "chai";
import { ethers } from "hardhat";
import {
  AbilityTokenFactory_BondingCurve,
  AbilityToken_BondingCurve,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

// Bonding curve params:
//   basePrice      = 0.000001 ETH  (price at supply = 0)
//   priceIncrement = 0.0000001 ETH (price increases by this per token minted)
//
// Price of the i-th token = basePrice + priceIncrement * i
//
// Buy cost for `n` tokens starting at supply `s`:
//   cost = n * basePrice + priceIncrement * (n*s + n*(n-1)/2)
//
// Sell refund for `n` tokens ending at supply `s`:
//   refund = n * basePrice + priceIncrement * (n*(s-n) + n*(n-1)/2)

const BASE_PRICE = ethers.parseEther("0.000001");
const PRICE_INCREMENT = ethers.parseEther("0.0000001");

function expectedBuyCost(amount: bigint, currentSupply: bigint): bigint {
  return (
    amount * BASE_PRICE +
    PRICE_INCREMENT * (amount * currentSupply + (amount * (amount - 1n)) / 2n)
  );
}

function expectedSellRefund(amount: bigint, currentSupply: bigint): bigint {
  return (
    amount * BASE_PRICE +
    PRICE_INCREMENT *
      (amount * (currentSupply - amount) + (amount * (amount - 1n)) / 2n)
  );
}

describe("AbilityTokenFactory_BondingCurve", function () {
  let factory: AbilityTokenFactory_BondingCurve;
  let creator: SignerWithAddress;
  let buyer1: SignerWithAddress;
  let buyer2: SignerWithAddress;
  let token: AbilityToken_BondingCurve;

  beforeEach(async function () {
    [, creator, buyer1, buyer2] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory(
      "AbilityTokenFactory_BondingCurve"
    );
    factory = await Factory.deploy();
    await factory.waitForDeployment();

    // Create one token
    await factory.connect(creator).createAbilityToken(
      "DeFi Expert", "DEFI",
      "You are a DeFi expert", "Grants DeFi analysis ability",
      "DeFi",
      BASE_PRICE,
      PRICE_INCREMENT
    );

    const tokenAddress = (await factory.getAllAbilityTokens())[0];
    token = await ethers.getContractAt("AbilityToken_BondingCurve", tokenAddress);
  });

  // ---------------------------------------------------------------------------
  // Token Creation
  // ---------------------------------------------------------------------------
  describe("Token Creation", function () {
    it("Should deploy with zero circulating supply", async function () {
      expect(await token.circulatingSupply()).to.equal(0n);
    });

    it("Should store correct bonding curve params", async function () {
      expect(await token.basePrice()).to.equal(BASE_PRICE);
      expect(await token.priceIncrement()).to.equal(PRICE_INCREMENT);
    });
  });

  // ---------------------------------------------------------------------------
  // Price curve — getBuyPrice / getSellPrice
  // ---------------------------------------------------------------------------
  describe("Price Curve", function () {
    it("First token costs exactly basePrice", async function () {
      // supply = 0, buying 1 token
      expect(await token.getBuyPrice(1n)).to.equal(BASE_PRICE);
    });

    it("Buy price increases as supply grows", async function () {
      const price0 = await token.getBuyPrice(1n); // supply = 0

      // Buy 5 tokens to increase supply to 5
      await token.connect(buyer1).buy(5n, { value: await token.getBuyPrice(5n) });

      const price5 = await token.getBuyPrice(1n); // supply = 5
      expect(price5).to.be.gt(price0);
    });

    it("getBuyPrice matches expected formula", async function () {
      // Buy 3 then check price for next 4
      await token.connect(buyer1).buy(3n, { value: await token.getBuyPrice(3n) });

      const supply = await token.circulatingSupply(); // 3
      const expected = expectedBuyCost(4n, supply);
      expect(await token.getBuyPrice(4n)).to.equal(expected);
    });

    it("Sell price decreases after selling (supply drops)", async function () {
      await token.connect(buyer1).buy(10n, { value: await token.getBuyPrice(10n) });

      const sellPrice10 = await token.getSellPrice(1n); // supply = 10

      await token.connect(buyer1).sell(5n); // supply drops to 5

      const sellPrice5 = await token.getSellPrice(1n); // supply = 5
      expect(sellPrice5).to.be.lt(sellPrice10);
    });

    it("getSellPrice matches expected formula", async function () {
      await token.connect(buyer1).buy(6n, { value: await token.getBuyPrice(6n) });

      const supply = await token.circulatingSupply(); // 6
      const expected = expectedSellRefund(3n, supply);
      expect(await token.getSellPrice(3n)).to.equal(expected);
    });

    it("Buy then sell same amount returns less ETH (spread is zero on linear curve)", async function () {
      // On a linear bonding curve: buy(n) at supply s == sell(n) at supply s+n
      // So buy cost at s=0 for 5 tokens should equal sell refund at s=5 for 5 tokens
      const buyCost = await token.getBuyPrice(5n);           // supply = 0
      await token.connect(buyer1).buy(5n, { value: buyCost });
      const sellRefund = await token.getSellPrice(5n);        // supply = 5

      expect(sellRefund).to.equal(buyCost); // perfect symmetry
    });
  });

  // ---------------------------------------------------------------------------
  // Buy
  // ---------------------------------------------------------------------------
  describe("Buy", function () {
    it("Should mint tokens and emit AbilityActivated", async function () {
      const amount = 3n;
      const cost = await token.getBuyPrice(amount);

      await expect(token.connect(buyer1).buy(amount, { value: cost }))
        .to.emit(token, "AbilityActivated")
        .withArgs(buyer1.address, await token.getAddress(), amount * ethers.parseEther("1"));

      expect(await token.balanceOf(buyer1.address)).to.equal(amount * ethers.parseEther("1"));
      expect(await token.circulatingSupply()).to.equal(amount);
    });

    it("Should add ETH to reserveBalance", async function () {
      const amount = 5n;
      const cost = await token.getBuyPrice(amount);
      await token.connect(buyer1).buy(amount, { value: cost });
      expect(await token.reserveBalance()).to.equal(cost);
    });

    it("Should refund excess ETH", async function () {
      const amount = 2n;
      const cost = await token.getBuyPrice(amount);
      const excess = ethers.parseEther("1");

      const before = await ethers.provider.getBalance(buyer1.address);
      const tx = await token.connect(buyer1).buy(amount, { value: cost + excess });
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const after = await ethers.provider.getBalance(buyer1.address);

      expect(before - after - gasUsed).to.equal(cost);
    });

    it("Should revert if ETH is insufficient", async function () {
      const cost = await token.getBuyPrice(3n);
      await expect(
        token.connect(buyer1).buy(3n, { value: cost - 1n })
      ).to.be.revertedWith("Insufficient ETH sent");
    });
  });

  // ---------------------------------------------------------------------------
  // Sell
  // ---------------------------------------------------------------------------
  describe("Sell", function () {
    beforeEach(async function () {
      // buyer1 buys 10 tokens first
      const cost = await token.getBuyPrice(10n);
      await token.connect(buyer1).buy(10n, { value: cost });
    });

    it("Should burn tokens and emit AbilityDeactivated", async function () {
      const amount = 4n;

      await expect(token.connect(buyer1).sell(amount))
        .to.emit(token, "AbilityDeactivated")
        .withArgs(buyer1.address, await token.getAddress(), amount * ethers.parseEther("1"));

      expect(await token.balanceOf(buyer1.address)).to.equal(
        (10n - amount) * ethers.parseEther("1")
      );
      expect(await token.circulatingSupply()).to.equal(10n - amount);
    });

    it("Should return correct ETH to seller", async function () {
      const amount = 5n;
      const refund = await token.getSellPrice(amount);

      const before = await ethers.provider.getBalance(buyer1.address);
      const tx = await token.connect(buyer1).sell(amount);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const after = await ethers.provider.getBalance(buyer1.address);

      expect(after - before + gasUsed).to.equal(refund);
    });

    it("Should decrease reserveBalance after sell", async function () {
      const reserveBefore = await token.reserveBalance();
      const refund = await token.getSellPrice(3n);
      await token.connect(buyer1).sell(3n);
      expect(await token.reserveBalance()).to.equal(reserveBefore - refund);
    });

    it("Should revert if user has insufficient tokens", async function () {
      await expect(token.connect(buyer2).sell(1n))
        .to.be.revertedWith("Insufficient token balance");
    });
  });

  // ---------------------------------------------------------------------------
  // Price Trend — buy 5 times then sell 5 times
  // ---------------------------------------------------------------------------
  describe("Price Trend", function () {
    it("Should show rising buy price and falling sell price across 5 buys then 5 sells", async function () {
      const buyPrices: bigint[] = [];
      const sellPrices: bigint[] = [];

      console.log("\n  📈 Buy price trend (1 token each round):");
      for (let i = 0; i < 5; i++) {
        const price = await token.getBuyPrice(1n);
        buyPrices.push(price);
        console.log(`    Round ${i + 1} | supply=${i} | buy price = ${ethers.formatEther(price)} ETH`);
        await token.connect(buyer1).buy(1n, { value: price });
      }

      console.log("\n  📉 Sell price trend (1 token each round):");
      for (let i = 0; i < 5; i++) {
        const supply = await token.circulatingSupply();
        const price = await token.getSellPrice(1n);
        sellPrices.push(price);
        console.log(`    Round ${i + 1} | supply=${supply} | sell price = ${ethers.formatEther(price)} ETH`);
        await token.connect(buyer1).sell(1n);
      }

      // Buy prices should strictly increase
      for (let i = 1; i < buyPrices.length; i++) {
        expect(buyPrices[i]).to.be.gt(buyPrices[i - 1]);
      }

      // Sell prices should strictly decrease
      for (let i = 1; i < sellPrices.length; i++) {
        expect(sellPrices[i]).to.be.lt(sellPrices[i - 1]);
      }

      // First sell price (supply=5) should equal last buy price (supply=4)
      expect(sellPrices[0]).to.equal(buyPrices[buyPrices.length - 1]);
    });
  });

  // ---------------------------------------------------------------------------
  // getActiveAbilities
  // ---------------------------------------------------------------------------
  describe("getActiveAbilities", function () {
    it("Should return token address after buy, empty after sell", async function () {
      const cost = await token.getBuyPrice(2n);
      await token.connect(buyer1).buy(2n, { value: cost });

      const tokenAddr = await token.getAddress();

      let active = await factory.getActiveAbilities(buyer1.address);
      expect(active).to.include(tokenAddr);

      await token.connect(buyer1).sell(2n);
      active = await factory.getActiveAbilities(buyer1.address);
      expect(active).to.not.include(tokenAddr);
    });
  });
});
