import { expect } from "chai";
import { ethers } from "hardhat";
import { AbilityTokenFactory, AbilityToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AbilityTokenFactory", function () {
  let factory: AbilityTokenFactory;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const AbilityTokenFactory = await ethers.getContractFactory("AbilityTokenFactory");
    factory = await AbilityTokenFactory.deploy();
    await factory.waitForDeployment();
  });

  describe("Token Creation", function () {
    it("Should create a new ability token", async function () {
      const tx = await factory.connect(user1).createAbilityToken(
        "AI Prompt Token",
        "PROMPT",
        "Generate creative AI art prompts",
        "A collection of AI prompts for image generation",
        "AI",
        1000000
      );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      const totalTokens = await factory.getTotalAbilityTokens();
      expect(totalTokens).to.equal(1);
    });

    it("Should emit AbilityTokenCreated event", async function () {
      await expect(
        factory.connect(user1).createAbilityToken(
          "Test Token",
          "TEST",
          "Test prompt",
          "Test description",
          "Test",
          1000
        )
      )
        .to.emit(factory, "AbilityTokenCreated")
        .withArgs(
          (await factory.getAllAbilityTokens())[0] || ethers.ZeroAddress,
          user1.address,
          "Test Token",
          "TEST",
          "Test prompt",
          await (await ethers.provider.getBlock("latest"))?.timestamp
        );
    });

    it("Should reject empty name", async function () {
      await expect(
        factory.createAbilityToken("", "TEST", "prompt", "desc", "cat", 1000)
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should reject empty symbol", async function () {
      await expect(
        factory.createAbilityToken("Name", "", "prompt", "desc", "cat", 1000)
      ).to.be.revertedWith("Symbol cannot be empty");
    });

    it("Should reject empty prompt", async function () {
      await expect(
        factory.createAbilityToken("Name", "SYM", "", "desc", "cat", 1000)
      ).to.be.revertedWith("Prompt cannot be empty");
    });

    it("Should reject zero initial supply", async function () {
      await expect(
        factory.createAbilityToken("Name", "SYM", "prompt", "desc", "cat", 0)
      ).to.be.revertedWith("Initial supply must be greater than 0");
    });
  });

  describe("Token Retrieval", function () {
    beforeEach(async function () {
      await factory.connect(user1).createAbilityToken(
        "Token 1",
        "TK1",
        "Prompt 1",
        "Desc 1",
        "Cat 1",
        1000
      );
      await factory.connect(user2).createAbilityToken(
        "Token 2",
        "TK2",
        "Prompt 2",
        "Desc 2",
        "Cat 2",
        2000
      );
      await factory.connect(user1).createAbilityToken(
        "Token 3",
        "TK3",
        "Prompt 3",
        "Desc 3",
        "Cat 3",
        3000
      );
    });

    it("Should return all created tokens", async function () {
      const allTokens = await factory.getAllAbilityTokens();
      expect(allTokens.length).to.equal(3);
    });

    it("Should return correct creator tokens", async function () {
      const user1Tokens = await factory.getCreatorTokens(user1.address);
      const user2Tokens = await factory.getCreatorTokens(user2.address);

      expect(user1Tokens.length).to.equal(2);
      expect(user2Tokens.length).to.equal(1);
    });

    it("Should return correct total count", async function () {
      const total = await factory.getTotalAbilityTokens();
      expect(total).to.equal(3);
    });

    it("Should return correct token info", async function () {
      const allTokens = await factory.getAllAbilityTokens();
      const tokenAddress = allTokens[0];

      const [name, symbol, prompt, description, creator, totalSupply] =
        await factory.getTokenInfo(tokenAddress);

      expect(name).to.equal("Token 1");
      expect(symbol).to.equal("TK1");
      expect(prompt).to.equal("Prompt 1");
      expect(description).to.equal("Desc 1");
      expect(creator).to.equal(user1.address);
      expect(totalSupply).to.equal(ethers.parseEther("1000"));
    });
  });

  describe("Created Token Properties", function () {
    let tokenAddress: string;
    let token: AbilityToken;

    beforeEach(async function () {
      await factory.connect(user1).createAbilityToken(
        "My Token",
        "MTK",
        "My Prompt",
        "My Description",
        "My Category",
        5000
      );

      const allTokens = await factory.getAllAbilityTokens();
      tokenAddress = allTokens[0];
      token = await ethers.getContractAt("AbilityToken", tokenAddress);
    });

    it("Should have correct ERC20 properties", async function () {
      expect(await token.name()).to.equal("My Token");
      expect(await token.symbol()).to.equal("MTK");
      expect(await token.decimals()).to.equal(18);
    });

    it("Should mint initial supply to creator", async function () {
      const balance = await token.balanceOf(user1.address);
      expect(balance).to.equal(ethers.parseEther("5000"));
    });

    it("Should have correct metadata", async function () {
      const [prompt, description, category, creator, createdAt] = await token.getMetadata();

      expect(prompt).to.equal("My Prompt");
      expect(description).to.equal("My Description");
      expect(category).to.equal("My Category");
      expect(creator).to.equal(user1.address);
      expect(createdAt).to.be.gt(0);
    });

    it("Should allow token transfers", async function () {
      const transferAmount = ethers.parseEther("100");
      await token.connect(user1).transfer(user2.address, transferAmount);

      expect(await token.balanceOf(user2.address)).to.equal(transferAmount);
      expect(await token.balanceOf(user1.address)).to.equal(
        ethers.parseEther("4900")
      );
    });
  });
});