const { expect } = require("chai");
const { ethers } = require("hardhat");
const { id, toUtf8Bytes, keccak256, ZeroHash } = ethers;

describe("STATED Contract", function () {
  let stated;
  let owner, addr1, addr2;
  let deployerAddress;

  const futureDeadline = Math.floor(Date.now() / 1000) + 86400 * 7;
  const declarationHash = keccak256(toUtf8Bytes("test declaration"));
  const evidenceHash = keccak256(toUtf8Bytes("test evidence"));
  const declarationURI = "ipfs://QmExample1";
  const evidenceURI = "ipfs://QmExample2";

  beforeEach(async function () {
    const STATED = await ethers.getContractFactory("STATED");
    stated = await STATED.deploy();

    [owner, addr1, addr2] = await ethers.getSigners();
    deployerAddress = owner.address;
  });

  // ===== CREATION TESTS =====
  describe("createBuildRecord", function () {
    it("Should create a valid record", async function () {
      const tx = await stated.createBuildRecord(
        futureDeadline,
        declarationHash,
        declarationURI
      );

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
    });

    it("Should emit correct BuildRecordCreated event", async function () {
      const tx = await stated.createBuildRecord(
        futureDeadline,
        declarationHash,
        declarationURI
      );

      const receipt = await tx.wait();
      expect(receipt.logs.length).to.equal(1);
    });

    it("Should store correct owner and timestamps", async function () {
      await stated.createBuildRecord(
        futureDeadline,
        declarationHash,
        declarationURI
      );

      const record = await stated.getBuildRecord(0);

      expect(record.owner).to.equal(deployerAddress);
      expect(record.deadline).to.equal(futureDeadline);
      expect(record.declarationHash).to.equal(declarationHash);
      expect(record.declarationURI).to.equal(declarationURI);
      expect(record.evidenceAttachedAt).to.equal(0);
      expect(record.evidenceHash).to.equal(ZeroHash);
    });

    it("Should reject past deadline", async function () {
      const pastDeadline = Math.floor(Date.now() / 1000) - 1;

      await expect(
        stated.createBuildRecord(pastDeadline, declarationHash, declarationURI)
      ).to.be.revertedWithCustomError(stated, "InvalidDeadline");
    });

    it("Should reject zero hash", async function () {
      await expect(
        stated.createBuildRecord(futureDeadline, ZeroHash, declarationURI)
      ).to.be.revertedWithCustomError(stated, "ZeroHash");
    });

    it("Should allow multiple records per wallet", async function () {
      const tx1 = await stated.createBuildRecord(
        futureDeadline,
        declarationHash,
        declarationURI
      );
      await tx1.wait();

      const hash2 = keccak256(toUtf8Bytes("second"));
      const tx2 = await stated.createBuildRecord(
        futureDeadline + 1,
        hash2,
        declarationURI
      );
      await tx2.wait();

      const records = await stated.getRecordIdsByOwner(deployerAddress);
      expect(records.length).to.equal(2);
      expect(records[0]).to.equal(0);
      expect(records[1]).to.equal(1);
    });

    it("Should reject URI that is too long", async function () {
      const longURI = "x".repeat(2049);

      await expect(
        stated.createBuildRecord(futureDeadline, declarationHash, longURI)
      ).to.be.revertedWithCustomError(stated, "UriTooLong");
    });
  });

  // ===== EVIDENCE TESTS =====
  describe("attachEvidence", function () {
    beforeEach(async function () {
      await stated.createBuildRecord(
        futureDeadline,
        declarationHash,
        declarationURI
      );
    });

    it("Should allow owner to attach evidence", async function () {
      const tx = await stated.attachEvidence(0, evidenceHash, evidenceURI);
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
    });

    it("Should emit correct EvidenceAttached event", async function () {
      const tx = await stated.attachEvidence(0, evidenceHash, evidenceURI);

      const receipt = await tx.wait();
      expect(receipt.logs.length).to.equal(1);
    });

    it("Should reject non-owner attachment", async function () {
      await expect(
        stated.connect(addr1).attachEvidence(0, evidenceHash, evidenceURI)
      ).to.be.revertedWithCustomError(stated, "NotRecordOwner");
    });

    it("Should reject zero hash", async function () {
      await expect(
        stated.attachEvidence(0, ZeroHash, evidenceURI)
      ).to.be.revertedWithCustomError(stated, "ZeroHash");
    });

    it("Should reject nonexistent record", async function () {
      await expect(
        stated.attachEvidence(999, evidenceHash, evidenceURI)
      ).to.be.revertedWithCustomError(stated, "RecordNotFound");
    });

    it("Should reject second attachment", async function () {
      await stated.attachEvidence(0, evidenceHash, evidenceURI);

      const newHash = keccak256(toUtf8Bytes("new evidence"));
      await expect(
        stated.attachEvidence(0, newHash, evidenceURI)
      ).to.be.revertedWithCustomError(stated, "EvidenceAlreadyAttached");
    });

    it("Should allow attachment before deadline", async function () {
      const tx = await stated.attachEvidence(0, evidenceHash, evidenceURI);
      await tx.wait();

      const record = await stated.getBuildRecord(0);
      expect(record.evidenceAttachedAt).to.be.greaterThan(0);
      expect(record.evidenceAttachedAt).to.be.lessThanOrEqual(record.deadline);
    });

    it("Should allow late attachment", async function () {
      // Use a far future deadline initially
      const farFuture = Math.floor(Date.now() / 1000) + 100;
      const tx1 = await stated.createBuildRecord(
        farFuture,
        declarationHash,
        declarationURI
      );
      await tx1.wait();

      // Move time forward past the deadline using hardhat_mine
      const record1 = await stated.getBuildRecord(1);
      const deadline = Number(record1.deadline);
      const now = Math.floor(Date.now() / 1000);
      const blocksToMine = deadline - now + 10; // Mine enough blocks to pass deadline

      if (blocksToMine > 0) {
        await ethers.provider.send("hardhat_mine", [
          "0x" + blocksToMine.toString(16),
        ]);
      }

      const tx2 = await stated.attachEvidence(1, evidenceHash, evidenceURI);
      await tx2.wait();

      const record2 = await stated.getBuildRecord(1);
      expect(record2.evidenceAttachedAt).to.be.greaterThan(record2.deadline);
    });

    it("Should reject URI that is too long", async function () {
      const longURI = "x".repeat(2049);

      await expect(
        stated.attachEvidence(0, evidenceHash, longURI)
      ).to.be.revertedWithCustomError(stated, "UriTooLong");
    });
  });

  // ===== INVARIANT TESTS =====
  describe("Invariants", function () {
    it("Declaration should never change after creation", async function () {
      await stated.createBuildRecord(
        futureDeadline,
        declarationHash,
        declarationURI
      );

      const recordBefore = await stated.getBuildRecord(0);
      await stated.attachEvidence(0, evidenceHash, evidenceURI);
      const recordAfter = await stated.getBuildRecord(0);

      expect(recordBefore.declarationHash).to.equal(recordAfter.declarationHash);
      expect(recordBefore.declarationURI).to.equal(recordAfter.declarationURI);
      expect(recordBefore.deadline).to.equal(recordAfter.deadline);
    });

    it("Owner should never change", async function () {
      await stated.createBuildRecord(
        futureDeadline,
        declarationHash,
        declarationURI
      );

      const recordBefore = await stated.getBuildRecord(0);
      await stated.attachEvidence(0, evidenceHash, evidenceURI);
      const recordAfter = await stated.getBuildRecord(0);

      expect(recordBefore.owner).to.equal(recordAfter.owner);
      expect(recordAfter.owner).to.equal(deployerAddress);
    });

    it("Evidence hash should change only once", async function () {
      await stated.createBuildRecord(
        futureDeadline,
        declarationHash,
        declarationURI
      );

      const recordInitial = await stated.getBuildRecord(0);
      expect(recordInitial.evidenceHash).to.equal(ZeroHash);

      await stated.attachEvidence(0, evidenceHash, evidenceURI);
      const recordAfterAttach = await stated.getBuildRecord(0);
      expect(recordAfterAttach.evidenceHash).to.equal(evidenceHash);

      const newHash = keccak256(toUtf8Bytes("new"));
      await expect(
        stated.attachEvidence(0, newHash, evidenceURI)
      ).to.be.revertedWithCustomError(stated, "EvidenceAlreadyAttached");
    });

    it("Attachment timestamp should change only once", async function () {
      await stated.createBuildRecord(
        futureDeadline,
        declarationHash,
        declarationURI
      );

      const recordInitial = await stated.getBuildRecord(0);
      expect(recordInitial.evidenceAttachedAt).to.equal(0);

      await stated.attachEvidence(0, evidenceHash, evidenceURI);
      const recordAfterAttach = await stated.getBuildRecord(0);
      const firstAttachTime = recordAfterAttach.evidenceAttachedAt;
      expect(firstAttachTime).to.be.greaterThan(0);

      const newHash = keccak256(toUtf8Bytes("new"));
      await expect(
        stated.attachEvidence(0, newHash, evidenceURI)
      ).to.be.revertedWithCustomError(stated, "EvidenceAlreadyAttached");
    });
  });

  // ===== READ FUNCTION TESTS =====
  describe("Read Functions", function () {
    it("Should return correct records by owner", async function () {
      await stated.createBuildRecord(
        futureDeadline,
        declarationHash,
        declarationURI
      );

      const hash2 = keccak256(toUtf8Bytes("hash2"));
      await stated.createBuildRecord(futureDeadline + 1, hash2, declarationURI);

      const hash3 = keccak256(toUtf8Bytes("hash3"));
      await stated
        .connect(addr1)
        .createBuildRecord(futureDeadline + 2, hash3, declarationURI);

      const ownerRecords = await stated.getRecordIdsByOwner(deployerAddress);
      const addr1Records = await stated.getRecordIdsByOwner(addr1.address);

      expect(ownerRecords.length).to.equal(2);
      expect(addr1Records.length).to.equal(1);
      expect(addr1Records[0]).to.equal(2);
    });

    it("Should revert on getBuildRecord for nonexistent record", async function () {
      await expect(
        stated.getBuildRecord(999)
      ).to.be.revertedWithCustomError(stated, "RecordNotFound");
    });
  });
});
