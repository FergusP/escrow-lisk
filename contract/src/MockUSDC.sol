// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC token for testing with faucet functionality
 */
contract MockUSDC is ERC20, Ownable {
    uint256 public constant FAUCET_AMOUNT = 1000 * 10**6; // 1000 USDC
    uint256 public constant FAUCET_COOLDOWN = 1 days;
    
    mapping(address => uint256) public lastFaucetClaim;
    
    constructor() ERC20("Mock USDC", "USDC") Ownable(msg.sender) {
        // Mint initial supply to deployer
        _mint(msg.sender, 1000000 * 10**6); // 1M USDC
    }
    
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    
    /**
     * @dev Faucet function - users can claim free USDC for testing
     */
    function faucet() external {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN,
            "Faucet cooldown not met"
        );
        
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
    }
    
    /**
     * @dev Mint tokens to any address (owner only)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Approve and call in one transaction for better UX
     */
    function approveAndCall(
        address spender,
        uint256 amount,
        bytes calldata data
    ) external returns (bool) {
        approve(spender, amount);
        
        // Call the target contract
        (bool success,) = spender.call(data);
        require(success, "Call failed");
        
        return true;
    }
}