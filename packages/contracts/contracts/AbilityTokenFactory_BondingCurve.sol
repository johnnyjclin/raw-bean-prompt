// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AbilityToken_BondingCurve.sol";

/**
 * @title AbilityTokenFactory_BondingCurve
 * @dev Factory for creating AbilityToken_BondingCurve instances.
 *      Each token uses a linear bonding curve — price rises as more tokens
 *      are minted and falls as tokens are burned.
 */
contract AbilityTokenFactory_BondingCurve {
    address[] public allAbilityTokens;

    mapping(address => address[]) public creatorTokens;
    mapping(address => TokenInfo) public tokenInfoMap;

    struct TokenInfo {
        string name;
        string symbol;
        string prompt;
        string description;
        address creator;
        uint256 basePrice;
        uint256 priceIncrement;
        uint256 timestamp;
        bool exists;
    }

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event AbilityTokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        string prompt,
        uint256 basePrice,
        uint256 priceIncrement,
        uint256 timestamp
    );

    // -------------------------------------------------------------------------
    // Factory
    // -------------------------------------------------------------------------

    /**
     * @notice Deploy a new bonding-curve AbilityToken.
     * @param name           Token name
     * @param symbol         Token symbol
     * @param prompt         The AI prompt/ability
     * @param description    Detailed description
     * @param category       Category (e.g. DeFi, Gaming)
     * @param basePrice      Base price in wei (price when supply = 0)
     * @param priceIncrement Wei added to price per token in circulation
     * @return address of the newly deployed token
     */
    function createAbilityToken(
        string memory name,
        string memory symbol,
        string memory prompt,
        string memory description,
        string memory category,
        uint256 basePrice,
        uint256 priceIncrement
    ) external returns (address) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        require(bytes(prompt).length > 0, "Prompt cannot be empty");
        require(basePrice > 0, "Base price must be greater than 0");

        AbilityToken_BondingCurve newToken = new AbilityToken_BondingCurve(
            name,
            symbol,
            prompt,
            description,
            category,
            msg.sender,
            basePrice,
            priceIncrement
        );

        address tokenAddress = address(newToken);

        allAbilityTokens.push(tokenAddress);
        creatorTokens[msg.sender].push(tokenAddress);

        tokenInfoMap[tokenAddress] = TokenInfo({
            name: name,
            symbol: symbol,
            prompt: prompt,
            description: description,
            creator: msg.sender,
            basePrice: basePrice,
            priceIncrement: priceIncrement,
            timestamp: block.timestamp,
            exists: true
        });

        emit AbilityTokenCreated(
            tokenAddress,
            msg.sender,
            name,
            symbol,
            prompt,
            basePrice,
            priceIncrement,
            block.timestamp
        );

        return tokenAddress;
    }

    // -------------------------------------------------------------------------
    // Query
    // -------------------------------------------------------------------------

    function getAllAbilityTokens() external view returns (address[] memory) {
        return allAbilityTokens;
    }

    function getCreatorTokens(address creator) external view returns (address[] memory) {
        return creatorTokens[creator];
    }

    function getTotalAbilityTokens() external view returns (uint256) {
        return allAbilityTokens.length;
    }

    /**
     * @notice Returns detailed info for a token, including current buy/sell prices for 1 token.
     */
    function getTokenInfo(address tokenAddress) external view returns (
        string memory name,
        string memory symbol,
        string memory prompt,
        string memory description,
        address creator,
        uint256 circulatingSupply,
        uint256 basePrice,
        uint256 priceIncrement,
        uint256 buyPrice1,
        uint256 sellPrice1
    ) {
        require(tokenInfoMap[tokenAddress].exists, "Token does not exist");

        AbilityToken_BondingCurve token = AbilityToken_BondingCurve(payable(tokenAddress));
        TokenInfo storage info = tokenInfoMap[tokenAddress];

        uint256 supply = token.circulatingSupply();
        uint256 bp1 = token.getBuyPrice(1);
        uint256 sp1 = supply > 0 ? token.getSellPrice(1) : 0;

        return (
            info.name,
            info.symbol,
            info.prompt,
            info.description,
            info.creator,
            supply,
            info.basePrice,
            info.priceIncrement,
            bp1,
            sp1
        );
    }

    /**
     * @notice Returns all AbilityToken addresses where `agent` currently holds > 0 tokens.
     * @dev    Pure on-chain scan — suitable for PoC. For production use events off-chain.
     * @param agent  Address of the AI agent wallet
     */
    function getActiveAbilities(address agent) external view returns (address[] memory) {
        uint256 total = allAbilityTokens.length;
        address[] memory temp = new address[](total);
        uint256 count = 0;

        for (uint256 i = 0; i < total; i++) {
            AbilityToken_BondingCurve token = AbilityToken_BondingCurve(payable(allAbilityTokens[i]));
            if (token.balanceOf(agent) > 0) {
                temp[count++] = allAbilityTokens[i];
            }
        }

        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        return result;
    }
}
