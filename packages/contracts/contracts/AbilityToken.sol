// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AbilityToken
 * @dev ERC20 token representing a tokenized AI prompt/ability
 * @notice Each token represents ownership of an AI prompt with metadata
 */
contract AbilityToken is ERC20, Ownable {
    // Metadata for the prompt
    string public prompt;
    string public description;
    string public category;
    address public creator;
    uint256 public createdAt;

    /**
     * @dev Constructor to create a new Ability Token
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _prompt The AI prompt/ability description
     * @param _description Detailed description of the token
     * @param _category Category (e.g., Meme, DeFi, Gaming)
     * @param _initialSupply Initial token supply (with 18 decimals)
     * @param _creator Address of the creator
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _prompt,
        string memory _description,
        string memory _category,
        uint256 _initialSupply,
        address _creator
    ) ERC20(_name, _symbol) Ownable(_creator) {
        require(_creator != address(0), "Creator address cannot be zero");
        require(bytes(_prompt).length > 0, "Prompt cannot be empty");
        require(_initialSupply > 0, "Initial supply must be greater than 0");

        prompt = _prompt;
        description = _description;
        category = _category;
        creator = _creator;
        createdAt = block.timestamp;

        // Mint initial supply to creator
        _mint(_creator, _initialSupply * 10**decimals());
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
}