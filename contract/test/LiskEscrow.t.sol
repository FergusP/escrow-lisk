// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/LiskEscrow.sol";
import "../src/MockUSDC.sol";
import "../src/EscrowRelayer.sol";

contract LiskEscrowTest is Test {
    LiskEscrow public escrow;
    MockUSDC public usdc;
    
    address public owner = address(this);
    address public buyer = address(0x2);
    address public seller = address(0x3);
    
    uint256 public constant ESCROW_AMOUNT = 1000 * 10**6; // 1000 USDC
    uint256 public constant DELIVERY_DEADLINE = 7 days;
    
    function setUp() public {
        // Deploy contracts
        address trustedForwarder = address(0x999); // Mock forwarder for testing
        escrow = new LiskEscrow(trustedForwarder);
        usdc = new MockUSDC();
        
        // Fund test accounts
        usdc.transfer(buyer, 10000 * 10**6); // 10k USDC to buyer
        
        // Approve escrow contract
        vm.prank(buyer);
        usdc.approve(address(escrow), type(uint256).max);
    }
    
    function testCreateEscrow() public {
        vm.prank(buyer);
        bytes32 escrowId = escrow.createEscrow(
            seller,
            ESCROW_AMOUNT,
            address(usdc),
            block.timestamp + DELIVERY_DEADLINE
        );
        
        // Check escrow details
        (
            address _buyer,
            address _seller,
            uint256 _amount,
            ,
            LiskEscrow.EscrowStatus _status,
            address _token,
            ,
            ,
            
        ) = escrow.getEscrowDetails(escrowId);
        
        assertEq(_buyer, buyer);
        assertEq(_seller, seller);
        assertEq(_amount, ESCROW_AMOUNT);
        assertEq(uint256(_status), uint256(LiskEscrow.EscrowStatus.CREATED));
        assertEq(_token, address(usdc));
    }
    
    function testFundEscrow() public {
        // Create escrow
        vm.prank(buyer);
        bytes32 escrowId = escrow.createEscrow(
            seller,
            ESCROW_AMOUNT,
            address(usdc),
            block.timestamp + DELIVERY_DEADLINE
        );
        
        // Fund escrow
        uint256 buyerBalanceBefore = usdc.balanceOf(buyer);
        
        vm.prank(buyer);
        escrow.fundEscrow(escrowId);
        
        uint256 buyerBalanceAfter = usdc.balanceOf(buyer);
        uint256 escrowBalance = usdc.balanceOf(address(escrow));
        
        // Check balances
        assertEq(buyerBalanceBefore - buyerBalanceAfter, ESCROW_AMOUNT);
        assertEq(escrowBalance, ESCROW_AMOUNT);
        
        // Check status
        (,,,, LiskEscrow.EscrowStatus status,,,,) = escrow.getEscrowDetails(escrowId);
        assertEq(uint256(status), uint256(LiskEscrow.EscrowStatus.FUNDED));
    }
    
    function testCompleteFlow() public {
        // Create and fund escrow
        vm.prank(buyer);
        bytes32 escrowId = escrow.createEscrow(
            seller,
            ESCROW_AMOUNT,
            address(usdc),
            block.timestamp + DELIVERY_DEADLINE
        );
        
        vm.prank(buyer);
        escrow.fundEscrow(escrowId);
        
        // Seller uploads documents
        bytes32 docHash = keccak256("shipping_document.pdf");
        vm.prank(seller);
        escrow.storeDocumentHash(escrowId, docHash);
        
        // Check documents uploaded
        bytes32[] memory docs = escrow.getDocumentHashes(escrowId);
        assertEq(docs.length, 1);
        assertEq(docs[0], docHash);
        
        // Buyer confirms delivery
        uint256 sellerBalanceBefore = usdc.balanceOf(seller);
        
        vm.prank(buyer);
        escrow.confirmDelivery(escrowId);
        
        // Check final balances - seller gets full amount (no fees)
        uint256 sellerBalanceAfter = usdc.balanceOf(seller);
        
        assertEq(sellerBalanceAfter - sellerBalanceBefore, ESCROW_AMOUNT);
        
        // Check final status
        (,,,, LiskEscrow.EscrowStatus status,,,,) = escrow.getEscrowDetails(escrowId);
        assertEq(uint256(status), uint256(LiskEscrow.EscrowStatus.SETTLED));
    }
    
    function testDispute() public {
        // Create and fund escrow
        vm.prank(buyer);
        bytes32 escrowId = escrow.createEscrow(
            seller,
            ESCROW_AMOUNT,
            address(usdc),
            block.timestamp + DELIVERY_DEADLINE
        );
        
        vm.prank(buyer);
        escrow.fundEscrow(escrowId);
        
        // Seller uploads documents
        vm.prank(seller);
        escrow.storeDocumentHash(escrowId, keccak256("fake_document.pdf"));
        
        // Buyer initiates dispute
        vm.prank(buyer);
        escrow.initiateDispute(escrowId, "Documents are fraudulent");
        
        // Check status
        (,,,, LiskEscrow.EscrowStatus status,,,,) = escrow.getEscrowDetails(escrowId);
        assertEq(uint256(status), uint256(LiskEscrow.EscrowStatus.DISPUTED));
        
        // Owner resolves dispute (refund buyer)
        uint256 buyerBalanceBefore = usdc.balanceOf(buyer);
        
        escrow.resolveDispute(escrowId, true);
        
        uint256 buyerBalanceAfter = usdc.balanceOf(buyer);
        assertEq(buyerBalanceAfter - buyerBalanceBefore, ESCROW_AMOUNT);
    }
    
    function testCannotCreateEscrowWithSelf() public {
        vm.prank(buyer);
        vm.expectRevert("Cannot escrow with yourself");
        escrow.createEscrow(
            buyer, // Same as msg.sender
            ESCROW_AMOUNT,
            address(usdc),
            block.timestamp + DELIVERY_DEADLINE
        );
    }
    
    function testCannotFundTwice() public {
        vm.prank(buyer);
        bytes32 escrowId = escrow.createEscrow(
            seller,
            ESCROW_AMOUNT,
            address(usdc),
            block.timestamp + DELIVERY_DEADLINE
        );
        
        vm.prank(buyer);
        escrow.fundEscrow(escrowId);
        
        // Try to fund again
        vm.prank(buyer);
        vm.expectRevert("Invalid escrow status");
        escrow.fundEscrow(escrowId);
    }
    
    // Gasless transaction tests
    function testMetaTransactionOnlyTrustedForwarder() public {
        // Setup relayer
        address relayer = address(0x999);
        escrow.updateTrustedForwarder(relayer);
        
        // Get buyer's nonce
        uint256 nonce = escrow.nonces(buyer);
        assertEq(nonce, 0);
        
        // Create signature (simplified for testing)
        bytes memory signature = abi.encodePacked(bytes32(uint256(1)), bytes32(uint256(2)), uint8(27));
        
        // NOTE: Proper signature validation would require creating valid EIP-712 signatures
        // For testing purposes, we're focusing on the access control and flow
        // The signature validation will fail with "Invalid signature" which is expected
        
        // Test that only trusted forwarder can call meta functions
        vm.prank(address(0x123)); // Not the trusted forwarder
        vm.expectRevert("Only trusted forwarder");
        escrow.createEscrowMeta(
            seller,
            ESCROW_AMOUNT,
            address(usdc),
            block.timestamp + DELIVERY_DEADLINE,
            buyer,
            signature
        );
        
        // Verify relayer is set correctly
        assertEq(escrow.trustedForwarder(), relayer);
    }
    
    function testOnlyTrustedForwarderCanRelayMeta() public {
        address attacker = address(0x666);
        bytes memory signature = abi.encodePacked(bytes32(uint256(1)), bytes32(uint256(2)), uint8(27));
        
        vm.prank(attacker);
        vm.expectRevert("Only trusted forwarder");
        escrow.createEscrowMeta(
            seller,
            ESCROW_AMOUNT,
            address(usdc),
            block.timestamp + DELIVERY_DEADLINE,
            buyer,
            signature
        );
    }
    
    function testCanUpdateTrustedForwarder() public {
        address newForwarder = address(0x123);
        
        // Only owner can update
        vm.prank(address(0x456));
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(0x456)));
        escrow.updateTrustedForwarder(newForwarder);
        
        // Owner updates successfully
        escrow.updateTrustedForwarder(newForwarder);
        assertEq(escrow.trustedForwarder(), newForwarder);
    }
    
    // Comprehensive E2E Tests
    function testFullE2EFlowWithRelayer() public {
        // Deploy relayer contract
        EscrowRelayer relayer = new EscrowRelayer(address(escrow));
        escrow.updateTrustedForwarder(address(relayer));
        
        // 1. NEW USER SETUP - Buyer gets USDC from faucet
        address newBuyer = address(0x100);
        vm.warp(2 days); // Set time for faucet
        vm.prank(newBuyer);
        usdc.faucet();
        assertEq(usdc.balanceOf(newBuyer), 1000 * 10**6);
        
        // 2. APPROVE ESCROW CONTRACT
        vm.prank(newBuyer);
        usdc.approve(address(escrow), ESCROW_AMOUNT);
        
        // 3. CREATE ESCROW
        vm.prank(newBuyer);
        bytes32 escrowId = escrow.createEscrow(
            seller,
            ESCROW_AMOUNT,
            address(usdc),
            block.timestamp + DELIVERY_DEADLINE
        );
        
        // Verify creation
        (address _buyer,, uint256 _amount,, LiskEscrow.EscrowStatus _status,,,,) = escrow.getEscrowDetails(escrowId);
        assertEq(_buyer, newBuyer);
        assertEq(_amount, ESCROW_AMOUNT);
        assertEq(uint256(_status), uint256(LiskEscrow.EscrowStatus.CREATED));
        
        // 4. FUND ESCROW
        uint256 buyerBalanceBefore = usdc.balanceOf(newBuyer);
        vm.prank(newBuyer);
        escrow.fundEscrow(escrowId);
        
        // Verify funding
        assertEq(usdc.balanceOf(newBuyer), buyerBalanceBefore - ESCROW_AMOUNT);
        assertEq(usdc.balanceOf(address(escrow)), ESCROW_AMOUNT);
        (,,,, _status,,,,) = escrow.getEscrowDetails(escrowId);
        assertEq(uint256(_status), uint256(LiskEscrow.EscrowStatus.FUNDED));
        
        // 5. SELLER UPLOADS MULTIPLE DOCUMENTS
        bytes32 doc1 = keccak256("invoice.pdf");
        bytes32 doc2 = keccak256("shipping_label.pdf");
        bytes32 doc3 = keccak256("customs_form.pdf");
        
        vm.prank(seller);
        escrow.storeDocumentHash(escrowId, doc1);
        (,,,, _status,,,,) = escrow.getEscrowDetails(escrowId);
        assertEq(uint256(_status), uint256(LiskEscrow.EscrowStatus.DOCUMENTS_PENDING));
        
        vm.prank(seller);
        escrow.storeDocumentHash(escrowId, doc2);
        vm.prank(seller);
        escrow.storeDocumentHash(escrowId, doc3);
        
        // Verify all documents stored
        bytes32[] memory docs = escrow.getDocumentHashes(escrowId);
        assertEq(docs.length, 3);
        assertEq(docs[0], doc1);
        assertEq(docs[1], doc2);
        assertEq(docs[2], doc3);
        
        // 6. BUYER CONFIRMS DELIVERY
        uint256 sellerBalanceBefore = usdc.balanceOf(seller);
        vm.prank(newBuyer);
        escrow.confirmDelivery(escrowId);
        
        // Verify payment
        assertEq(usdc.balanceOf(seller), sellerBalanceBefore + ESCROW_AMOUNT);
        assertEq(usdc.balanceOf(address(escrow)), 0); // All funds released
        (,,,, _status,,,,) = escrow.getEscrowDetails(escrowId);
        assertEq(uint256(_status), uint256(LiskEscrow.EscrowStatus.SETTLED));
    }
    
    function testE2EWithDeadlineScenarios() public {
        // Test 1: Cannot fund after deadline
        vm.prank(buyer);
        bytes32 escrowId1 = escrow.createEscrow(
            seller,
            ESCROW_AMOUNT,
            address(usdc),
            block.timestamp + 1 hours // Short deadline
        );
        
        // Fast forward past deadline
        vm.warp(block.timestamp + 2 hours);
        
        vm.prank(buyer);
        vm.expectRevert("Deadline has passed");
        escrow.fundEscrow(escrowId1);
        
        // Test 2: Can complete flow before deadline
        vm.warp(1000); // Reset time
        vm.prank(buyer);
        bytes32 escrowId2 = escrow.createEscrow(
            seller,
            ESCROW_AMOUNT,
            address(usdc),
            block.timestamp + 1 days
        );
        
        // Complete flow within deadline
        vm.prank(buyer);
        escrow.fundEscrow(escrowId2);
        
        vm.prank(seller);
        escrow.storeDocumentHash(escrowId2, keccak256("doc.pdf"));
        
        vm.prank(buyer);
        escrow.confirmDelivery(escrowId2);
        
        (,,,, LiskEscrow.EscrowStatus status,,,,) = escrow.getEscrowDetails(escrowId2);
        assertEq(uint256(status), uint256(LiskEscrow.EscrowStatus.SETTLED));
    }
    
    function testE2EErrorHandling() public {
        // Test various error conditions in sequence
        
        // 1. Cannot create escrow with 0 amount
        vm.prank(buyer);
        vm.expectRevert("Amount must be greater than 0");
        escrow.createEscrow(seller, 0, address(usdc), block.timestamp + DELIVERY_DEADLINE);
        
        // 2. Create valid escrow
        vm.prank(buyer);
        bytes32 escrowId = escrow.createEscrow(
            seller,
            ESCROW_AMOUNT,
            address(usdc),
            block.timestamp + DELIVERY_DEADLINE
        );
        
        // 3. Only buyer can fund
        vm.prank(seller);
        vm.expectRevert("Only buyer can fund");
        escrow.fundEscrow(escrowId);
        
        // 4. Fund properly
        vm.prank(buyer);
        escrow.fundEscrow(escrowId);
        
        // 5. Only seller can upload documents
        vm.prank(buyer);
        vm.expectRevert("Only seller can upload documents");
        escrow.storeDocumentHash(escrowId, keccak256("doc.pdf"));
        
        // 6. Cannot confirm delivery before documents
        vm.prank(buyer);
        vm.expectRevert("Invalid status");
        escrow.confirmDelivery(escrowId);
        
        // 7. Upload documents properly
        vm.prank(seller);
        escrow.storeDocumentHash(escrowId, keccak256("doc.pdf"));
        
        // 8. Only buyer can confirm delivery
        vm.prank(seller);
        vm.expectRevert("Only buyer can confirm");
        escrow.confirmDelivery(escrowId);
        
        // 9. Confirm delivery properly
        vm.prank(buyer);
        escrow.confirmDelivery(escrowId);
        
        // 10. Cannot interact with settled escrow
        vm.prank(seller);
        vm.expectRevert("Invalid escrow status for document upload");
        escrow.storeDocumentHash(escrowId, keccak256("another_doc.pdf"));
    }
    
    function testE2EDisputeFlow() public {
        // Complete dispute flow from start to finish
        
        // Setup
        vm.prank(buyer);
        bytes32 escrowId = escrow.createEscrow(
            seller,
            ESCROW_AMOUNT,
            address(usdc),
            block.timestamp + DELIVERY_DEADLINE
        );
        
        vm.prank(buyer);
        escrow.fundEscrow(escrowId);
        
        // Seller can dispute after funding
        vm.prank(seller);
        escrow.initiateDispute(escrowId, "Buyer is unresponsive");
        
        (,,,, LiskEscrow.EscrowStatus status,,,,) = escrow.getEscrowDetails(escrowId);
        assertEq(uint256(status), uint256(LiskEscrow.EscrowStatus.DISPUTED));
        
        // Non-owner cannot resolve
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, buyer));
        escrow.resolveDispute(escrowId, false);
        
        // Owner resolves in favor of seller
        escrow.resolveDispute(escrowId, false);
        
        // Verify seller received funds
        assertEq(usdc.balanceOf(seller), ESCROW_AMOUNT);
        (,,,, status,,,,) = escrow.getEscrowDetails(escrowId);
        assertEq(uint256(status), uint256(LiskEscrow.EscrowStatus.SETTLED));
    }
    
    function testE2ECancelFlow() public {
        // Test cancellation scenarios
        
        // 1. Both parties can cancel before funding
        vm.prank(buyer);
        bytes32 escrowId1 = escrow.createEscrow(
            seller,
            ESCROW_AMOUNT,
            address(usdc),
            block.timestamp + DELIVERY_DEADLINE
        );
        
        vm.prank(seller);
        escrow.cancelEscrow(escrowId1);
        
        (,,,, LiskEscrow.EscrowStatus status,,,,) = escrow.getEscrowDetails(escrowId1);
        assertEq(uint256(status), uint256(LiskEscrow.EscrowStatus.CANCELLED));
        
        // 2. Cannot cancel after funding
        vm.warp(block.timestamp + 1); // Change timestamp to get different escrow ID
        vm.prank(buyer);
        bytes32 escrowId2 = escrow.createEscrow(
            seller,
            ESCROW_AMOUNT,
            address(usdc),
            block.timestamp + DELIVERY_DEADLINE
        );
        
        vm.prank(buyer);
        escrow.fundEscrow(escrowId2);
        
        vm.prank(buyer);
        vm.expectRevert("Can only cancel before funding");
        escrow.cancelEscrow(escrowId2);
    }
    
    // MockUSDC tests
    function testFaucet() public {
        address user = address(0x123);
        
        // Initial balance should be 0
        assertEq(usdc.balanceOf(user), 0);
        
        // Set initial timestamp to more than 1 day
        vm.warp(2 days);
        
        // Claim from faucet
        vm.prank(user);
        usdc.faucet();
        
        // Should receive 1000 USDC
        assertEq(usdc.balanceOf(user), 1000 * 10**6);
        
        // Try to claim again immediately
        vm.prank(user);
        vm.expectRevert("Faucet cooldown not met");
        usdc.faucet();
        
        // Fast forward 1 day
        vm.warp(block.timestamp + 1 days);
        
        // Should be able to claim again
        vm.prank(user);
        usdc.faucet();
        assertEq(usdc.balanceOf(user), 2000 * 10**6);
    }
}