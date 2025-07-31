// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./LiskEscrow.sol";
import "./MockUSDC.sol";

/**
 * @title EscrowRelayer
 * @dev Relayer contract for gasless transactions
 */
contract EscrowRelayer {
    LiskEscrow public immutable escrowContract;
    address public owner;
    
    mapping(address => bool) public authorizedRelayers;
    
    event RelayerAuthorized(address relayer);
    event RelayerRevoked(address relayer);
    event TransactionRelayed(address indexed user, string action);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyRelayer() {
        require(authorizedRelayers[msg.sender], "Not authorized relayer");
        _;
    }
    
    constructor(address _escrowContract) {
        escrowContract = LiskEscrow(_escrowContract);
        owner = msg.sender;
        authorizedRelayers[msg.sender] = true;
    }
    
    /**
     * @dev Authorize a new relayer
     */
    function authorizeRelayer(address relayer) external onlyOwner {
        authorizedRelayers[relayer] = true;
        emit RelayerAuthorized(relayer);
    }
    
    /**
     * @dev Revoke relayer authorization
     */
    function revokeRelayer(address relayer) external onlyOwner {
        authorizedRelayers[relayer] = false;
        emit RelayerRevoked(relayer);
    }
    
    /**
     * @dev Relay create escrow transaction
     */
    function relayCreateEscrow(
        address seller,
        uint256 amount,
        address token,
        uint256 deliveryDeadline,
        address buyer,
        bytes memory signature
    ) external onlyRelayer returns (bytes32) {
        bytes32 escrowId = escrowContract.createEscrowMeta(
            seller,
            amount,
            token,
            deliveryDeadline,
            buyer,
            signature
        );
        
        emit TransactionRelayed(buyer, "createEscrow");
        return escrowId;
    }
    
    /**
     * @dev Relay fund escrow transaction
     */
    function relayFundEscrow(
        bytes32 escrowId,
        address buyer,
        bytes memory signature
    ) external onlyRelayer {
        escrowContract.fundEscrowMeta(escrowId, buyer, signature);
        emit TransactionRelayed(buyer, "fundEscrow");
    }
    
    /**
     * @dev Relay confirm delivery transaction
     */
    function relayConfirmDelivery(
        bytes32 escrowId,
        address buyer,
        bytes memory signature
    ) external onlyRelayer {
        escrowContract.confirmDeliveryMeta(escrowId, buyer, signature);
        emit TransactionRelayed(buyer, "confirmDelivery");
    }
    
    /**
     * @dev Relay store document transaction
     */
    function relayStoreDocument(
        bytes32 escrowId,
        bytes32 documentHash,
        address seller,
        bytes memory signature
    ) external onlyRelayer {
        escrowContract.storeDocumentHashMeta(escrowId, documentHash, seller, signature);
        emit TransactionRelayed(seller, "storeDocument");
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}