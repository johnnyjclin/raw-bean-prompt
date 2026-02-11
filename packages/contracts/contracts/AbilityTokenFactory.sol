// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AbilityToken.sol";

/**
 * @title AbilityTokenFactory
 * @dev Factory contract for creating tokenized AI prompts/abilities
 * @notice Allows anyone to create ERC20 tokens representing AI prompts
 */
contract AbilityTokenFactory {
    // Array of all created tokens
    address[] public allAbilityTokens;
    
    // Mapping from creator to their tokens
    mapping(address => address[]) public creatorTokens;
    
    // Mapping from token address to token info (for quick lookup)
    mapping(address => TokenInfo) public tokenInfoMap;

    struct TokenInfo {
        string name;
        string symbol;
        string prompt;
        string description;
        address creator;
        uint256 timestamp;
        bool exists;
    }

    /**
     * @dev Emitted when a new Ability Token is created
     */
    event AbilityTokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        string prompt,
        uint256 timestamp
    );

    /**
     * @dev Creates a new Ability Token
     * @param name Token name
     * @param symbol Token symbol (max 10 characters recommended)
     * @param prompt The AI prompt/ability
     * @param description Detailed description
     * @param category Category of the prompt
     * @param initialSupply Initial token supply (will be multiplied by 10^18)
     * @return address of the newly created token
     */
    function createAbilityToken(
        string memory name,
        string memory symbol,
        string memory prompt,
        string memory description,
        string memory category,
        uint256 initialSupply
    ) external returns (address) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        require(bytes(prompt).length > 0, "Prompt cannot be empty");
        require(initialSupply > 0, "Initial supply must be greater than 0");

        // Create new token contract
        AbilityToken newToken = new AbilityToken(
            name,
            symbol,
            prompt,
            description,
            category,
            initialSupply,
            msg.sender
        );

        address tokenAddress = address(newToken);
        
        // Store token info
        allAbilityTokens.push(tokenAddress);
        creatorTokens[msg.sender].push(tokenAddress);
        
        tokenInfoMap[tokenAddress] = TokenInfo({
            name: name,
            symbol: symbol,
            prompt: prompt,
            description: description,
            creator: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        emit AbilityTokenCreated(
            tokenAddress,
            msg.sender,
            name,
            symbol,
            prompt,
            block.timestamp
        );

        return tokenAddress;
    }

    /**
     * @dev Get all created Ability Tokens
     * @return Array of all token addresses
     */
    function getAllAbilityTokens() external view returns (address[] memory) {
        return allAbilityTokens;
    }

    /**
     * @dev Get tokens created by a specific creator
     * @param creator Address of the creator
     * @return Array of token addresses created by the creator
     */
    function getCreatorTokens(address creator) external view returns (address[] memory) {
        return creatorTokens[creator];
    }

    /**
     * @dev Get total number of created tokens
     * @return Total count of tokens
     */
    function getTotalAbilityTokens() external view returns (uint256) {
        return allAbilityTokens.length;
    }

    /**
     * @dev Get detailed information about a token
     * @param tokenAddress Address of the token
     * @return name Token name
     * @return symbol Token symbol
     * @return prompt The AI prompt
     * @return description Token description
     * @return creator Creator address
     * @return totalSupply Total supply of the token
     */
    function getTokenInfo(address tokenAddress) external view returns (
        string memory name,
        string memory symbol,
        string memory prompt,
        string memory description,
        address creator,
        uint256 totalSupply
    ) {
        require(tokenInfoMap[tokenAddress].exists, "Token does not exist");
        
        AbilityToken token = AbilityToken(tokenAddress);
        
        return (
            tokenInfoMap[tokenAddress].name,
            tokenInfoMap[tokenAddress].symbol,
            tokenInfoMap[tokenAddress].prompt,
            tokenInfoMap[tokenAddress].description,
            tokenInfoMap[tokenAddress].creator,
            token.totalSupply()
        );
    }
}