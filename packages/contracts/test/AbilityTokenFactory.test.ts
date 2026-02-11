import { expect } from "chai";
import { ethers } from "hardhat";
import { AbilityTokenFactory, AbilityToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

const TOKEN_PRICE = ethers.parseEther("0.01"); // 0.01 ETH per whole token

describe("AbilityTokenFactory", function () {
  let factory: AbilityTokenFactory;
  let creator: SignerWithAddress;
  let buyer: SignerWithAddress;

  beforeEach(async function () {
    [, creator, buyer] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("AbilityTokenFactory");
    factory = await Factory.deploy();
    await factory.waitForDeployment();
  });

  describe("Token Creation", function () {
    it("Should create a token and store it", async function () {
      await factory.connect(creator).createAbilityToken(
        "DeFi Expert", "DEFI",
        "You are a DeFi expert", "Grants DeFi analysis ability",
        "DeFi", 1000, TOKEN_PRICE
      );
      expect(await factory.getTotalAbilityTokens()).to.equal(1);
    });

    it("Should reject zero price", async function () {
      await expect(
        factory.createAbilityToken("Name", "SYM", "prompt", "desc", "cat", 100, 0n)
      ).to.be.revertedWith("Price must be greater than 0");
    });
  });

  describe("Buy & Sell", function () {
    let token: AbilityToken;

    beforeEach(async function () {
      await factory.connect(creator).createAbilityToken(
        "DeFi Expert", "DEFI",
        "You are a DeFi expert", "Grants DeFi analysis ability",
        "DeFi", 1000, TOKEN_PRICE
      );
      const tokenAddress = (await factory.getAllAbilityTokens())[0];
      token = await ethers.getContractAt("AbilityToken", tokenAddress);
    });

    it("Buy: should transfer tokens and emit AbilityActivated", async function () {
      const amount = 5n;
      await expect(token.connect(buyer).buy(amount, { value: TOKEN_PRICE * amount }))
        .to.emit(token, "AbilityActivated")
        .withArgs(buyer.address, amount * ethers.parseEther("1"));

      expect(await token.balanceOf(buyer.address)).to.equal(amount * ethers.parseEther("1"));
    });

    it("Buy: should revert if insufficient ETH sent", async function () {
      await expect(
        token.connect(buyer).buy(5n, { value: TOKEN_PRICE * 4n })
      ).to.be.revertedWith("Insufficient ETH sent");
    });

    it("Sell: should return ETH and emit AbilityDeactivated", async function () {
      const amount = 5n;
      await token.connect(buyer).buy(amount, { value: TOKEN_PRICE * amount });

      await expect(token.connect(buyer).sell(amount))
        .to.emit(token, "AbilityDeactivated")
        .withArgs(buyer.address, amount * ethers.parseEther("1"));

      expect(await token.balanceOf(buyer.address)).to.equal(0n);
    });

    it("Sell: should revert if user has no tokens", async function () {
      await expect(token.connect(buyer).sell(1n))
        .to.be.revertedWith("Insufficient token balance");
    });
  });
});
