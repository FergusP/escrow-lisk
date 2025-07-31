// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title LiskEscrow
 * @dev Escrow contract for secure international trade transactions
 */
contract LiskEscrow is ReentrancyGuard, Ownable, EIP712 {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // Escrow status enum
    enum EscrowStatus {
        CREATED,
        FUNDED,
        DOCUMENTS_PENDING,
        SETTLED,
        CANCELLED,
        DISPUTED
    }

    // Escrow struct
    struct Escrow {
        address buyer;
        address seller;
        uint256 amount;
        uint256 deliveryDeadline;
        EscrowStatus status;
        IERC20 token;
        uint256 createdAt;
        uint256 fundedAt;
        bool documentsUploaded;
    }

    // State variables
    mapping(bytes32 => Escrow) public escrows;
    mapping(bytes32 => bytes32[]) public escrowDocuments;
    mapping(bytes32 => string) public disputeReasons;
    
    // No platform fees in this implementation
    
    // Meta-transaction support
    mapping(address => uint256) public nonces;
    address public trustedForwarder;
    
    // EIP-712 type hashes
    bytes32 public constant CREATE_ESCROW_TYPEHASH = keccak256(
        "CreateEscrow(address seller,uint256 amount,address token,uint256 deliveryDeadline,uint256 nonce)"
    );
    bytes32 public constant FUND_ESCROW_TYPEHASH = keccak256(
        "FundEscrow(bytes32 escrowId,uint256 nonce)"
    );
    bytes32 public constant CONFIRM_DELIVERY_TYPEHASH = keccak256(
        "ConfirmDelivery(bytes32 escrowId,uint256 nonce)"
    );
    bytes32 public constant STORE_DOCUMENT_TYPEHASH = keccak256(
        "StoreDocument(bytes32 escrowId,bytes32 documentHash,uint256 nonce)"
    );
    
    // Events
    event EscrowCreated(
        bytes32 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 deliveryDeadline
    );
    
    event EscrowFunded(
        bytes32 indexed escrowId,
        uint256 timestamp
    );
    
    event DocumentsUploaded(
        bytes32 indexed escrowId,
        bytes32 documentHash,
        uint256 timestamp
    );
    
    event DeliveryConfirmed(
        bytes32 indexed escrowId,
        uint256 timestamp
    );
    
    event PaymentReleased(
        bytes32 indexed escrowId,
        address recipient,
        uint256 amount
    );
    
    event EscrowCancelled(
        bytes32 indexed escrowId
    );
    
    event DisputeInitiated(
        bytes32 indexed escrowId,
        address initiator,
        string reason
    );

    constructor(address _trustedForwarder) EIP712("LiskEscrow", "1") Ownable(msg.sender) {
        trustedForwarder = _trustedForwarder;
    }

    /**
     * @dev Creates a new escrow contract
     * @param _seller Address of the seller
     * @param _amount Amount to be held in escrow
     * @param _token Token address (USDC)
     * @param _deliveryDeadline Unix timestamp for delivery deadline
     * @return escrowId Unique identifier for the escrow
     */
    function createEscrow(
        address _seller,
        uint256 _amount,
        address _token,
        uint256 _deliveryDeadline
    ) external returns (bytes32 escrowId) {
        require(_seller != address(0), "Invalid seller address");
        require(_seller != msg.sender, "Cannot escrow with yourself");
        require(_amount > 0, "Amount must be greater than 0");
        require(_deliveryDeadline > block.timestamp, "Deadline must be in future");
        
        // Generate unique escrow ID
        escrowId = keccak256(
            abi.encodePacked(msg.sender, _seller, _amount, block.timestamp)
        );
        
        require(escrows[escrowId].buyer == address(0), "Escrow already exists");
        
        escrows[escrowId] = Escrow({
            buyer: msg.sender,
            seller: _seller,
            amount: _amount,
            deliveryDeadline: _deliveryDeadline,
            status: EscrowStatus.CREATED,
            token: IERC20(_token),
            createdAt: block.timestamp,
            fundedAt: 0,
            documentsUploaded: false
        });
        
        emit EscrowCreated(escrowId, msg.sender, _seller, _amount, _deliveryDeadline);
    }

    /**
     * @dev Funds an escrow (called by buyer)
     * @param _escrowId ID of the escrow to fund
     */
    function fundEscrow(bytes32 _escrowId) external nonReentrant {
        Escrow storage escrow = escrows[_escrowId];
        
        require(escrow.buyer == msg.sender, "Only buyer can fund");
        require(escrow.status == EscrowStatus.CREATED, "Invalid escrow status");
        require(block.timestamp <= escrow.deliveryDeadline, "Deadline has passed");
        
        // Transfer tokens from buyer to contract
        escrow.token.safeTransferFrom(msg.sender, address(this), escrow.amount);
        
        escrow.status = EscrowStatus.FUNDED;
        escrow.fundedAt = block.timestamp;
        
        emit EscrowFunded(_escrowId, block.timestamp);
    }

    /**
     * @dev Stores document hash on-chain (called by seller)
     * @param _escrowId ID of the escrow
     * @param _documentHash Hash of the document
     */
    function storeDocumentHash(bytes32 _escrowId, bytes32 _documentHash) external {
        Escrow storage escrow = escrows[_escrowId];
        
        require(escrow.seller == msg.sender, "Only seller can upload documents");
        require(
            escrow.status == EscrowStatus.FUNDED || escrow.status == EscrowStatus.DOCUMENTS_PENDING,
            "Invalid escrow status for document upload"
        );
        require(_documentHash != bytes32(0), "Invalid document hash");
        
        escrowDocuments[_escrowId].push(_documentHash);
        
        // Update status on first document upload
        if (!escrow.documentsUploaded) {
            escrow.documentsUploaded = true;
            escrow.status = EscrowStatus.DOCUMENTS_PENDING;
        }
        
        emit DocumentsUploaded(_escrowId, _documentHash, block.timestamp);
    }

    /**
     * @dev Confirms delivery and releases payment (called by buyer)
     * @param _escrowId ID of the escrow
     */
    function confirmDelivery(bytes32 _escrowId) external nonReentrant {
        Escrow storage escrow = escrows[_escrowId];
        
        require(escrow.buyer == msg.sender, "Only buyer can confirm");
        require(escrow.status == EscrowStatus.DOCUMENTS_PENDING, "Invalid status");
        
        escrow.status = EscrowStatus.SETTLED;
        
        // No platform fee - transfer full amount
        
        // Transfer full amount to seller
        escrow.token.safeTransfer(escrow.seller, escrow.amount);
        
        emit DeliveryConfirmed(_escrowId, block.timestamp);
        emit PaymentReleased(_escrowId, escrow.seller, escrow.amount);
    }

    /**
     * @dev Initiates a dispute (called by buyer or seller)
     * @param _escrowId ID of the escrow
     * @param _reason Reason for the dispute
     */
    function initiateDispute(bytes32 _escrowId, string memory _reason) external {
        Escrow storage escrow = escrows[_escrowId];
        
        require(
            escrow.buyer == msg.sender || escrow.seller == msg.sender,
            "Only buyer or seller can dispute"
        );
        require(
            escrow.status == EscrowStatus.FUNDED || 
            escrow.status == EscrowStatus.DOCUMENTS_PENDING,
            "Cannot dispute in current status"
        );
        
        escrow.status = EscrowStatus.DISPUTED;
        disputeReasons[_escrowId] = _reason;
        
        emit DisputeInitiated(_escrowId, msg.sender, _reason);
    }

    /**
     * @dev Cancels an escrow (only before funding)
     * @param _escrowId ID of the escrow
     */
    function cancelEscrow(bytes32 _escrowId) external {
        Escrow storage escrow = escrows[_escrowId];
        
        require(
            escrow.buyer == msg.sender || escrow.seller == msg.sender,
            "Only buyer or seller can cancel"
        );
        require(escrow.status == EscrowStatus.CREATED, "Can only cancel before funding");
        
        escrow.status = EscrowStatus.CANCELLED;
        
        emit EscrowCancelled(_escrowId);
    }

    /**
     * @dev Resolves a dispute (only owner)
     * @param _escrowId ID of the escrow
     * @param _refundBuyer Whether to refund the buyer
     */
    function resolveDispute(bytes32 _escrowId, bool _refundBuyer) external onlyOwner nonReentrant {
        Escrow storage escrow = escrows[_escrowId];
        
        require(escrow.status == EscrowStatus.DISPUTED, "Not in dispute");
        
        escrow.status = EscrowStatus.SETTLED;
        
        if (_refundBuyer) {
            // Refund to buyer
            escrow.token.safeTransfer(escrow.buyer, escrow.amount);
            emit PaymentReleased(_escrowId, escrow.buyer, escrow.amount);
        } else {
            // Release to seller (no fees)
            escrow.token.safeTransfer(escrow.seller, escrow.amount);
            emit PaymentReleased(_escrowId, escrow.seller, escrow.amount);
        }
    }

    /**
     * @dev Gets escrow details
     * @param _escrowId ID of the escrow
     */
    function getEscrowDetails(bytes32 _escrowId) external view returns (
        address buyer,
        address seller,
        uint256 amount,
        uint256 deliveryDeadline,
        EscrowStatus status,
        address token,
        uint256 createdAt,
        uint256 fundedAt,
        bool documentsUploaded
    ) {
        Escrow memory escrow = escrows[_escrowId];
        return (
            escrow.buyer,
            escrow.seller,
            escrow.amount,
            escrow.deliveryDeadline,
            escrow.status,
            address(escrow.token),
            escrow.createdAt,
            escrow.fundedAt,
            escrow.documentsUploaded
        );
    }

    /**
     * @dev Gets document hashes for an escrow
     * @param _escrowId ID of the escrow
     */
    function getDocumentHashes(bytes32 _escrowId) external view returns (bytes32[] memory) {
        return escrowDocuments[_escrowId];
    }


    // Meta-transaction functions

    /**
     * @dev Creates escrow via meta-transaction
     */
    function createEscrowMeta(
        address _seller,
        uint256 _amount,
        address _token,
        uint256 _deliveryDeadline,
        address _buyer,
        bytes memory _signature
    ) external returns (bytes32 escrowId) {
        require(msg.sender == trustedForwarder, "Only trusted forwarder");
        
        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            CREATE_ESCROW_TYPEHASH,
            _seller,
            _amount,
            _token,
            _deliveryDeadline,
            nonces[_buyer]
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(_signature);
        require(signer == _buyer, "Invalid signature");
        
        // Increment nonce
        nonces[_buyer]++;
        
        // Create escrow on behalf of buyer
        escrowId = keccak256(
            abi.encodePacked(_buyer, _seller, _amount, block.timestamp)
        );
        
        require(escrows[escrowId].buyer == address(0), "Escrow already exists");
        
        escrows[escrowId] = Escrow({
            buyer: _buyer,
            seller: _seller,
            amount: _amount,
            deliveryDeadline: _deliveryDeadline,
            status: EscrowStatus.CREATED,
            token: IERC20(_token),
            createdAt: block.timestamp,
            fundedAt: 0,
            documentsUploaded: false
        });
        
        emit EscrowCreated(escrowId, _buyer, _seller, _amount, _deliveryDeadline);
    }

    /**
     * @dev Funds escrow via meta-transaction
     */
    function fundEscrowMeta(
        bytes32 _escrowId,
        address _buyer,
        bytes memory _signature
    ) external nonReentrant {
        require(msg.sender == trustedForwarder, "Only trusted forwarder");
        
        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            FUND_ESCROW_TYPEHASH,
            _escrowId,
            nonces[_buyer]
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(_signature);
        require(signer == _buyer, "Invalid signature");
        
        // Increment nonce
        nonces[_buyer]++;
        
        Escrow storage escrow = escrows[_escrowId];
        
        require(escrow.buyer == _buyer, "Only buyer can fund");
        require(escrow.status == EscrowStatus.CREATED, "Invalid escrow status");
        require(block.timestamp <= escrow.deliveryDeadline, "Deadline has passed");
        
        // Transfer tokens from buyer to contract
        escrow.token.safeTransferFrom(_buyer, address(this), escrow.amount);
        
        escrow.status = EscrowStatus.FUNDED;
        escrow.fundedAt = block.timestamp;
        
        emit EscrowFunded(_escrowId, block.timestamp);
    }

    /**
     * @dev Confirms delivery via meta-transaction
     */
    function confirmDeliveryMeta(
        bytes32 _escrowId,
        address _buyer,
        bytes memory _signature
    ) external nonReentrant {
        require(msg.sender == trustedForwarder, "Only trusted forwarder");
        
        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            CONFIRM_DELIVERY_TYPEHASH,
            _escrowId,
            nonces[_buyer]
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(_signature);
        require(signer == _buyer, "Invalid signature");
        
        // Increment nonce
        nonces[_buyer]++;
        
        Escrow storage escrow = escrows[_escrowId];
        
        require(escrow.buyer == _buyer, "Only buyer can confirm");
        require(escrow.status == EscrowStatus.DOCUMENTS_PENDING, "Invalid status");
        
        escrow.status = EscrowStatus.SETTLED;
        
        // No platform fee - transfer full amount
        
        // Transfer full amount to seller
        escrow.token.safeTransfer(escrow.seller, escrow.amount);
        
        emit DeliveryConfirmed(_escrowId, block.timestamp);
        emit PaymentReleased(_escrowId, escrow.seller, escrow.amount);
    }

    /**
     * @dev Stores document hash via meta-transaction
     */
    function storeDocumentHashMeta(
        bytes32 _escrowId,
        bytes32 _documentHash,
        address _seller,
        bytes memory _signature
    ) external {
        require(msg.sender == trustedForwarder, "Only trusted forwarder");
        
        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            STORE_DOCUMENT_TYPEHASH,
            _escrowId,
            _documentHash,
            nonces[_seller]
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(_signature);
        require(signer == _seller, "Invalid signature");
        
        // Increment nonce
        nonces[_seller]++;
        
        Escrow storage escrow = escrows[_escrowId];
        
        require(escrow.seller == _seller, "Only seller can upload documents");
        require(
            escrow.status == EscrowStatus.FUNDED || escrow.status == EscrowStatus.DOCUMENTS_PENDING,
            "Invalid escrow status for document upload"
        );
        require(_documentHash != bytes32(0), "Invalid document hash");
        
        escrowDocuments[_escrowId].push(_documentHash);
        
        // Update status on first document upload
        if (!escrow.documentsUploaded) {
            escrow.documentsUploaded = true;
            escrow.status = EscrowStatus.DOCUMENTS_PENDING;
        }
        
        emit DocumentsUploaded(_escrowId, _documentHash, block.timestamp);
    }

    /**
     * @dev Updates trusted forwarder
     */
    function updateTrustedForwarder(address _newForwarder) external onlyOwner {
        require(_newForwarder != address(0), "Invalid address");
        trustedForwarder = _newForwarder;
    }
}