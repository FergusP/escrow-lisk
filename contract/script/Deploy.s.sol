// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/LiskEscrow.sol";
import "../src/MockUSDC.sol";
import "../src/EscrowRelayer.sol";

contract DeployScript is Script {
    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy MockUSDC
        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC deployed at:", address(usdc));
        
        // 2. Deploy Relayer (temporary address, will update)
        address tempRelayer = address(0x1);
        
        // 3. Deploy LiskEscrow with relayer address
        LiskEscrow escrow = new LiskEscrow(tempRelayer);
        console.log("LiskEscrow deployed at:", address(escrow));
        
        // 4. Deploy actual Relayer with escrow address
        EscrowRelayer relayer = new EscrowRelayer(address(escrow));
        console.log("EscrowRelayer deployed at:", address(relayer));
        
        // 5. Update escrow's trusted forwarder to actual relayer
        escrow.updateTrustedForwarder(address(relayer));
        console.log("Updated trusted forwarder to:", address(relayer));
        
        // 6. Mint some USDC to the relayer for testing
        usdc.mint(address(relayer), 10000 * 10**6); // 10k USDC
        
        vm.stopBroadcast();
        
        // Log summary
        console.log("\n=== Deployment Summary ===");
        console.log("MockUSDC:", address(usdc));
        console.log("LiskEscrow:", address(escrow));
        console.log("EscrowRelayer:", address(relayer));
        console.log("=========================\n");
    }
}