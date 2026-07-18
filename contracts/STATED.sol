// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title STATED
 * @dev A promise-versus-proof receipt for builders.
 * Records immutable declarations of project scope and allows owners to attach evidence exactly once.
 */
contract STATED {
    /// @dev Maximum length for URI strings (IPFS hash + metadata)
    uint256 public constant MAX_URI_LENGTH = 2048;

    /// @dev Build record struct
    struct BuildRecord {
        address owner;
        uint64 declaredAt;
        uint64 deadline;
        uint64 evidenceAttachedAt;
        bytes32 declarationHash;
        bytes32 evidenceHash;
        string declarationURI;
        string evidenceURI;
    }

    /// @dev Next record ID counter
    uint256 public nextRecordId;

    /// @dev Record storage
    mapping(uint256 => BuildRecord) private records;

    /// @dev Records by owner
    mapping(address => uint256[]) private recordsByOwner;

    // Custom errors
    error RecordNotFound();
    error InvalidDeadline();
    error ZeroHash();
    error NotRecordOwner();
    error EvidenceAlreadyAttached();
    error UriTooLong();

    // Events
    event BuildRecordCreated(
        uint256 indexed recordId,
        address indexed owner,
        uint64 declaredAt,
        uint64 deadline,
        bytes32 declarationHash,
        string declarationURI
    );

    event EvidenceAttached(
        uint256 indexed recordId,
        address indexed owner,
        uint64 attachedAt,
        bytes32 evidenceHash,
        string evidenceURI
    );

    /**
     * @dev Create a new build record
     * @param deadline Future timestamp when the build is due
     * @param declarationHash Keccak256 hash of the canonical declaration manifest
     * @param declarationURI Reference to the declaration manifest (IPFS, HTTP, etc.)
     * @return recordId The ID of the newly created record
     */
    function createBuildRecord(
        uint64 deadline,
        bytes32 declarationHash,
        string calldata declarationURI
    ) external returns (uint256 recordId) {
        // Validate deadline is in the future
        if (deadline <= uint64(block.timestamp)) {
            revert InvalidDeadline();
        }

        // Validate hash is nonzero
        if (declarationHash == bytes32(0)) {
            revert ZeroHash();
        }

        // Validate URI length
        if (bytes(declarationURI).length > MAX_URI_LENGTH) {
            revert UriTooLong();
        }

        // Get the record ID
        recordId = nextRecordId;
        nextRecordId++;

        // Create the record
        records[recordId] = BuildRecord({
            owner: msg.sender,
            declaredAt: uint64(block.timestamp),
            deadline: deadline,
            evidenceAttachedAt: 0,
            declarationHash: declarationHash,
            evidenceHash: bytes32(0),
            declarationURI: declarationURI,
            evidenceURI: ""
        });

        // Add to owner's records
        recordsByOwner[msg.sender].push(recordId);

        // Emit event
        emit BuildRecordCreated(
            recordId,
            msg.sender,
            uint64(block.timestamp),
            deadline,
            declarationHash,
            declarationURI
        );
    }

    /**
     * @dev Attach evidence to a record (exactly once)
     * @param recordId The record to attach evidence to
     * @param evidenceHash Keccak256 hash of the canonical evidence manifest
     * @param evidenceURI Reference to the evidence manifest (IPFS, HTTP, etc.)
     */
    function attachEvidence(
        uint256 recordId,
        bytes32 evidenceHash,
        string calldata evidenceURI
    ) external {
        // Validate record exists
        BuildRecord storage record = records[recordId];
        if (record.owner == address(0)) {
            revert RecordNotFound();
        }

        // Validate caller is owner
        if (record.owner != msg.sender) {
            revert NotRecordOwner();
        }

        // Validate evidence not already attached
        if (record.evidenceAttachedAt != 0) {
            revert EvidenceAlreadyAttached();
        }

        // Validate hash is nonzero
        if (evidenceHash == bytes32(0)) {
            revert ZeroHash();
        }

        // Validate URI length
        if (bytes(evidenceURI).length > MAX_URI_LENGTH) {
            revert UriTooLong();
        }

        // Attach evidence
        record.evidenceAttachedAt = uint64(block.timestamp);
        record.evidenceHash = evidenceHash;
        record.evidenceURI = evidenceURI;

        // Emit event
        emit EvidenceAttached(
            recordId,
            msg.sender,
            uint64(block.timestamp),
            evidenceHash,
            evidenceURI
        );
    }

    /**
     * @dev Get a build record by ID
     * @param recordId The record ID
     * @return The BuildRecord struct
     */
    function getBuildRecord(uint256 recordId)
        external
        view
        returns (BuildRecord memory)
    {
        if (records[recordId].owner == address(0)) {
            revert RecordNotFound();
        }
        return records[recordId];
    }

    /**
     * @dev Get all record IDs for an owner
     * @param owner The owner address
     * @return Array of record IDs owned by the address
     */
    function getRecordIdsByOwner(address owner)
        external
        view
        returns (uint256[] memory)
    {
        return recordsByOwner[owner];
    }
}
