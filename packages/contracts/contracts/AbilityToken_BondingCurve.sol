// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AbilityToken_BondingCurve
 * @dev ERC20 token representing a tokenized AI prompt/ability with a linear bonding curve.
 *
 * Pricing formula (linear bonding curve):
 *   Price of the i-th token = basePrice + priceIncrement * i
 *
 * Buy cost for `amount` tokens when current circulating supply is `s`:
 *   cost = amount * basePrice + priceIncrement * (amount * s + amount * (amount - 1) / 2)
 *
 * Sell refund for `amount` tokens when current circulating supply is `s`:
 *   refund = amount * basePrice + priceIncrement * (amount * (s - amount) + amount * (amount - 1) / 2)
 *
 * Tokens are minted on buy and burned on sell — no pre-minted supply.
 */
contract AbilityToken_BondingCurve is ERC20, Ownable {
    // -------------------------------------------------------------------------
    // Metadata
    // -------------------------------------------------------------------------
    string public prompt;
    string public description;
    string public category;
    address public creator;
    uint256 public createdAt;

    // -------------------------------------------------------------------------
    // Bonding curve parameters
    // -------------------------------------------------------------------------

    /// @notice Base price in wei for the very first token (i = 0)
    uint256 public basePrice;

    /// @notice Price increase in wei per additional token in circulation
    uint256 public priceIncrement;

    /// @notice ETH held in reserve to back sell refunds
    uint256 public reserveBalance;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /// @notice Emitted when an agent buys tokens and gains the ability
    event AbilityActivated(address indexed agent, address indexed token, uint256 amount);

    /// @notice Emitted when an agent sells tokens and loses the ability
    event AbilityDeactivated(address indexed agent, address indexed token, uint256 amount);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /**
     * @param _name            Token name
     * @param _symbol          Token symbol
     * @param _prompt          The AI prompt/ability description
     * @param _description     Detailed description
     * @param _category        Category (e.g. DeFi, Gaming)
     * @param _creator         Address of the creator / owner
     * @param _basePrice       Base price in wei (price of token #0)
     * @param _priceIncrement  Wei added to price per token in circulation
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _prompt,
        string memory _description,
        string memory _category,
        address _creator,
        uint256 _basePrice,
        uint256 _priceIncrement
    ) ERC20(_name, _symbol) Ownable(_creator) {
        require(_creator != address(0), "Creator cannot be zero address");
        require(bytes(_prompt).length > 0, "Prompt cannot be empty");
        require(_basePrice > 0, "Base price must be greater than 0");

        prompt = _prompt;
        description = _description;
        category = _category;
        creator = _creator;
        createdAt = block.timestamp;
        basePrice = _basePrice;
        priceIncrement = _priceIncrement;
        // No pre-mint: supply starts at 0, tokens are minted on buy
    }

    // -------------------------------------------------------------------------
    // Pricing helpers
    // -------------------------------------------------------------------------

    /**
     * @notice Calculate the ETH cost to buy `amount` whole tokens.
     * @dev Uses closed-form sum of arithmetic series.
     *      cost = amount * basePrice
     *           + priceIncrement * (amount * currentSupply + amount*(amount-1)/2)
     *      where currentSupply is in whole tokens (totalSupply / 1e18).
     * @param amount Number of whole tokens to buy
     * @return Total cost in wei
     */
    function getBuyPrice(uint256 amount) public view returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        uint256 s = totalSupply() / 10 ** decimals(); // current circulating supply in whole tokens
        return amount * basePrice
            + priceIncrement * (amount * s + amount * (amount - 1) / 2);
    }

    /**
     * @notice Calculate the ETH refund for selling `amount` whole tokens.
     * @dev Uses closed-form sum of arithmetic series.
     *      refund = amount * basePrice
     *             + priceIncrement * (amount * (currentSupply - amount) + amount*(amount-1)/2)
     * @param amount Number of whole tokens to sell
     * @return Total refund in wei
     */
    function getSellPrice(uint256 amount) public view returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        uint256 s = totalSupply() / 10 ** decimals();
        require(amount <= s, "Amount exceeds circulating supply");
        return amount * basePrice
            + priceIncrement * (amount * (s - amount) + amount * (amount - 1) / 2);
    }

    // -------------------------------------------------------------------------
    // Buy & Sell
    // -------------------------------------------------------------------------

    /**
     * @notice Buy `amount` whole tokens. ETH is added to the reserve.
     *         AI agent gains the ability associated with this token's prompt.
     * @param amount Number of whole tokens to buy
     */
    function buy(uint256 amount) external payable {
        require(amount > 0, "Amount must be greater than 0");

        uint256 cost = getBuyPrice(amount);
        require(msg.value >= cost, "Insufficient ETH sent");

        uint256 tokenAmount = amount * 10 ** decimals();
        reserveBalance += cost;

        _mint(msg.sender, tokenAmount);

        // Refund excess ETH
        if (msg.value > cost) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - cost}("");
            require(refunded, "ETH refund failed");
        }

        emit AbilityActivated(msg.sender, address(this), tokenAmount);
    }

    /**
     * @notice Sell `amount` whole tokens back to the bonding curve.
     *         AI agent loses the ability associated with this token's prompt.
     * @param amount Number of whole tokens to sell
     */
    function sell(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        uint256 tokenAmount = amount * 10 ** decimals();
        require(balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");

        uint256 refund = getSellPrice(amount);
        require(reserveBalance >= refund, "Insufficient reserve");

        reserveBalance -= refund;
        _burn(msg.sender, tokenAmount);

        (bool sent, ) = payable(msg.sender).call{value: refund}("");
        require(sent, "ETH transfer failed");

        emit AbilityDeactivated(msg.sender, address(this), tokenAmount);
    }

    // -------------------------------------------------------------------------
    // View helpers
    // -------------------------------------------------------------------------

    /**
     * @notice Circulating supply in whole tokens (excludes decimals)
     */
    function circulatingSupply() external view returns (uint256) {
        return totalSupply() / 10 ** decimals();
    }

    /**
     * @dev Returns all metadata for the token
     */
    function getMetadata() external view returns (
        string memory,
        string memory,
        string memory,
        address,
        uint256
    ) {
        return (prompt, description, category, creator, createdAt);
    }

    // -------------------------------------------------------------------------
    // Admin
    // -------------------------------------------------------------------------

    /**
     * @notice Owner can withdraw ETH that is NOT part of the reserve
     *         (e.g. direct ETH sent to the contract).
     */
    function withdraw() external onlyOwner {
        uint256 surplus = address(this).balance - reserveBalance;
        require(surplus > 0, "No surplus to withdraw");
        (bool sent, ) = payable(owner()).call{value: surplus}("");
        require(sent, "Withdraw failed");
    }

    receive() external payable {
        // Accept direct ETH (counts as surplus, not reserve)
    }
}
