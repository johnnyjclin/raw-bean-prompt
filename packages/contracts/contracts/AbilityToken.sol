// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AbilityToken
 * @dev ERC20 token representing a tokenized AI prompt/ability
 * @notice Each token represents ownership of an AI prompt with metadata.
 *         Buying tokens activates the ability for the buyer's AI agent;
 *         selling tokens deactivates it.
 */
contract AbilityToken is ERC20, Ownable {
    // Metadata for the prompt
    string public prompt;
    string public description;
    string public category;
    address public creator;
    uint256 public createdAt;

    // Pricing (ETH wei per 1 token unit, i.e. per 10^18 base units)
    uint256 public price;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /// @notice Emitted when an agent buys tokens and gains the ability
    event AbilityActivated(address indexed agent, uint256 amount);

    /// @notice Emitted when an agent sells tokens and loses the ability
    event AbilityDeactivated(address indexed agent, uint256 amount);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /**
     * @dev Constructor to create a new Ability Token
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _prompt The AI prompt/ability description
     * @param _description Detailed description of the token
     * @param _category Category (e.g., Meme, DeFi, Gaming)
     * @param _initialSupply Initial token supply (whole tokens, will be scaled by 10^18)
     * @param _creator Address of the creator
     * @param _price ETH price per whole token (in wei)
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _prompt,
        string memory _description,
        string memory _category,
        uint256 _initialSupply,
        address _creator,
        uint256 _price
    ) ERC20(_name, _symbol) Ownable(_creator) {
        require(_creator != address(0), "Creator address cannot be zero");
        require(bytes(_prompt).length > 0, "Prompt cannot be empty");
        require(_initialSupply > 0, "Initial supply must be greater than 0");
        require(_price > 0, "Price must be greater than 0");

        prompt = _prompt;
        description = _description;
        category = _category;
        creator = _creator;
        createdAt = block.timestamp;
        price = _price;

        // Mint entire supply to the contract itself so tokens are available for purchase
        _mint(address(this), _initialSupply * 10 ** decimals());
    }

    // -------------------------------------------------------------------------
    // Buy & Sell
    // -------------------------------------------------------------------------

    /**
     * @notice Buy `amount` whole tokens by sending ETH.
     *         Activates the corresponding AI ability for msg.sender.
     * @param amount Number of whole tokens to buy (will be scaled by 10^18 internally)
     */
    function buy(uint256 amount) external payable {
        require(amount > 0, "Amount must be greater than 0");

        uint256 tokenAmount = amount * 10 ** decimals();
        uint256 totalCost = price * amount;

        require(msg.value >= totalCost, "Insufficient ETH sent");
        require(balanceOf(address(this)) >= tokenAmount, "Not enough tokens available");

        _transfer(address(this), msg.sender, tokenAmount);

        // Refund excess ETH
        if (msg.value > totalCost) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - totalCost}("");
            require(refunded, "ETH refund failed");
        }

        emit AbilityActivated(msg.sender, tokenAmount);
    }

    /**
     * @notice Sell `amount` whole tokens back to the contract and receive ETH.
     *         Deactivates the corresponding AI ability for msg.sender.
     *         Caller must approve this contract to spend their tokens first.
     * @param amount Number of whole tokens to sell (will be scaled by 10^18 internally)
     */
    function sell(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        uint256 tokenAmount = amount * 10 ** decimals();
        uint256 ethReturn = price * amount;

        require(balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");
        require(address(this).balance >= ethReturn, "Contract has insufficient ETH reserve");

        // Pull tokens back to the contract
        _transfer(msg.sender, address(this), tokenAmount);

        // Return ETH to seller
        (bool sent, ) = payable(msg.sender).call{value: ethReturn}("");
        require(sent, "ETH transfer failed");

        emit AbilityDeactivated(msg.sender, tokenAmount);
    }

    // -------------------------------------------------------------------------
    // View helpers
    // -------------------------------------------------------------------------

    /**
     * @notice Returns the ETH cost for buying `amount` whole tokens
     * @param amount Number of whole tokens
     * @return Total ETH cost in wei
     */
    function getPrice(uint256 amount) external view returns (uint256) {
        return price * amount;
    }

    /**
     * @notice Returns how many whole tokens are still available for purchase
     */
    function availableSupply() external view returns (uint256) {
        return balanceOf(address(this)) / 10 ** decimals();
    }

    /**
     * @dev Returns all metadata for the token
     * @return All token metadata as a tuple
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
     * @notice Owner (creator) can withdraw accumulated ETH from token sales
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Nothing to withdraw");
        (bool sent, ) = payable(owner()).call{value: balance}("");
        require(sent, "Withdraw failed");
    }

    /// @dev Allow the contract to receive ETH directly (e.g. for reserve top-up)
    receive() external payable {}
}
