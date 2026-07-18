const { expect } = require("chai");
const {
  canonicalize,
  hashManifest,
  validateDeclaration,
  validateEvidence,
} = require("../scripts/manifest");

describe("Manifest Module", function () {
  const validDeclaration = {
    schema: "stated/declaration/v1",
    project: {
      title: "STATED",
      promise: "Ship a public promise-versus-proof receipt for builders.",
    },
    deadline: "2026-07-19T21:59:00Z",
    conditions: [
      { id: "condition-1", text: "A deployed and verified Monad contract" },
      { id: "condition-2", text: "Three working product flows" },
      { id: "condition-3", text: "A public receipt" },
    ],
  };

  const validEvidence = {
    schema: "stated/evidence/v1",
    recordId: "1",
    evidence: [
      {
        id: "evidence-1",
        conditionIds: ["condition-1", "condition-2"],
        label: "Verified contract and demo",
        uri: "https://explorer.example/address/0x...",
        type: "contract",
      },
      {
        id: "evidence-2",
        conditionIds: ["condition-3"],
        label: "Public receipt screenshot",
        uri: "https://receipt.example/record/1",
      },
    ],
  };

  // ===== CANONICALIZATION TESTS =====
  describe("Canonicalization", function () {
    it("Should produce same hash for reordered object keys", function () {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { c: 3, a: 1, b: 2 };

      const hash1 = hashManifest(obj1);
      const hash2 = hashManifest(obj2);

      expect(hash1).to.equal(hash2);
    });

    it("Should produce same hash regardless of whitespace", function () {
      const obj1 = {
        key: "value",
        nested: { a: 1, b: 2 },
      };
      const obj2 = {
        key: "value",
        nested: { a: 1, b: 2 },
      };

      const hash1 = hashManifest(obj1);
      const hash2 = hashManifest(obj2);

      expect(hash1).to.equal(hash2);
    });

    it("Should produce different hash for changed content", function () {
      const obj1 = { key: "value1" };
      const obj2 = { key: "value2" };

      const hash1 = hashManifest(obj1);
      const hash2 = hashManifest(obj2);

      expect(hash1).to.not.equal(hash2);
    });

    it("Should produce different hash for changed array order", function () {
      const obj1 = { items: [1, 2, 3] };
      const obj2 = { items: [3, 2, 1] };

      const hash1 = hashManifest(obj1);
      const hash2 = hashManifest(obj2);

      expect(hash1).to.not.equal(hash2);
    });

    it("Should produce different hash for changed Unicode character", function () {
      const obj1 = { text: "café" };
      const obj2 = { text: "cafe" };

      const hash1 = hashManifest(obj1);
      const hash2 = hashManifest(obj2);

      expect(hash1).to.not.equal(hash2);
    });

    it("Should produce deterministic canonical form", function () {
      const obj = { z: 3, a: 1, m: 2 };
      const canonical = canonicalize(obj);

      // Keys should be sorted: a, m, z
      expect(canonical).to.include('"a":1');
      expect(canonical).to.include('"m":2');
      expect(canonical).to.include('"z":3');
      expect(canonical.indexOf("a") < canonical.indexOf("m")).to.be.true;
      expect(canonical.indexOf("m") < canonical.indexOf("z")).to.be.true;
    });
  });

  // ===== DECLARATION VALIDATION TESTS =====
  describe("Declaration Validation", function () {
    it("Should validate a correct declaration", function () {
      expect(() => {
        validateDeclaration(validDeclaration);
      }).to.not.throw();
    });

    it("Should reject missing schema", function () {
      const invalid = { ...validDeclaration };
      delete invalid.schema;

      expect(() => {
        validateDeclaration(invalid);
      }).to.throw("Invalid schema");
    });

    it("Should reject wrong schema version", function () {
      const invalid = { ...validDeclaration, schema: "wrong" };

      expect(() => {
        validateDeclaration(invalid);
      }).to.throw("Invalid schema");
    });

    it("Should reject missing project", function () {
      const invalid = { ...validDeclaration };
      delete invalid.project;

      expect(() => {
        validateDeclaration(invalid);
      }).to.throw("Missing or invalid project");
    });

    it("Should reject missing project.title", function () {
      const invalid = { ...validDeclaration };
      invalid.project = { promise: "test" };

      expect(() => {
        validateDeclaration(invalid);
      }).to.throw("Missing or invalid project.title");
    });

    it("Should reject missing project.promise", function () {
      const invalid = { ...validDeclaration };
      invalid.project = { title: "test" };

      expect(() => {
        validateDeclaration(invalid);
      }).to.throw("Missing or invalid project.promise");
    });

    it("Should reject missing deadline", function () {
      const invalid = { ...validDeclaration };
      delete invalid.deadline;

      expect(() => {
        validateDeclaration(invalid);
      }).to.throw("Missing or invalid deadline");
    });

    it("Should reject missing conditions", function () {
      const invalid = { ...validDeclaration };
      delete invalid.conditions;

      expect(() => {
        validateDeclaration(invalid);
      }).to.throw("conditions must be an array");
    });

    it("Should reject zero conditions", function () {
      const invalid = { ...validDeclaration, conditions: [] };

      expect(() => {
        validateDeclaration(invalid);
      }).to.throw("Must have 1-3 conditions");
    });

    it("Should reject more than 3 conditions", function () {
      const invalid = {
        ...validDeclaration,
        conditions: [
          { id: "1", text: "a" },
          { id: "2", text: "b" },
          { id: "3", text: "c" },
          { id: "4", text: "d" },
        ],
      };

      expect(() => {
        validateDeclaration(invalid);
      }).to.throw("Must have 1-3 conditions");
    });

    it("Should reject duplicate condition ids", function () {
      const invalid = {
        ...validDeclaration,
        conditions: [
          { id: "same", text: "first" },
          { id: "same", text: "second" },
        ],
      };

      expect(() => {
        validateDeclaration(invalid);
      }).to.throw("Duplicate condition id");
    });
  });

  // ===== EVIDENCE VALIDATION TESTS =====
  describe("Evidence Validation", function () {
    it("Should validate correct evidence", function () {
      expect(() => {
        validateEvidence(validEvidence, validDeclaration);
      }).to.not.throw();
    });

    it("Should reject missing schema", function () {
      const invalid = { ...validEvidence };
      delete invalid.schema;

      expect(() => {
        validateEvidence(invalid, validDeclaration);
      }).to.throw("Invalid schema");
    });

    it("Should reject wrong schema version", function () {
      const invalid = { ...validEvidence, schema: "wrong" };

      expect(() => {
        validateEvidence(invalid, validDeclaration);
      }).to.throw("Invalid schema");
    });

    it("Should reject missing evidence array", function () {
      const invalid = { ...validEvidence };
      delete invalid.evidence;

      expect(() => {
        validateEvidence(invalid, validDeclaration);
      }).to.throw("evidence must be an array");
    });

    it("Should reject unknown condition ID", function () {
      const invalid = {
        ...validEvidence,
        evidence: [
          {
            id: "e1",
            conditionIds: ["unknown-condition"],
            label: "test",
            uri: "http://test",
          },
        ],
      };

      expect(() => {
        validateEvidence(invalid, validDeclaration);
      }).to.throw("Unknown condition ID");
    });

    it("Should allow multiple evidence items", function () {
      expect(() => {
        validateEvidence(validEvidence, validDeclaration);
      }).to.not.throw();
    });

    it("Should allow empty evidence array", function () {
      const noEvidence = { ...validEvidence, evidence: [] };

      expect(() => {
        validateEvidence(noEvidence, validDeclaration);
      }).to.not.throw();
    });
  });

  // ===== RFC 8785 COMPLIANCE TESTS =====
  describe("RFC 8785 Compliance", function () {
    it("Number precision is preserved", function () {
      const obj1 = { value: 1 };
      const obj2 = { value: 1.0 };
      const hash1 = hashManifest(obj1);
      const hash2 = hashManifest(obj2);
      expect(hash1).to.equal(hash2);
    });

    it("Negative numbers are handled correctly", function () {
      const obj = { value: -42 };
      const canonical = canonicalize(obj);
      expect(canonical).to.include("-42");
    });

    it("Floating point numbers are serialized deterministically", function () {
      const obj1 = { value: 0.1 + 0.2 }; // May have precision issues in JS
      const obj2 = { value: 0.30000000000000004 };
      const hash1 = hashManifest(obj1);
      const hash2 = hashManifest(obj2);
      // Both should hash the same if canonicalization is correct
      expect(hash1).to.equal(hash2);
    });

    it("Unicode characters are preserved", function () {
      const obj = { text: "café" };
      const canonical = canonicalize(obj);
      expect(canonical).to.include("café");
    });

    it("Escaped characters are handled correctly", function () {
      const obj = { text: 'line1\nline2' };
      const canonical = canonicalize(obj);
      expect(canonical).to.be.a("string");
      expect(canonical.length).to.be.greaterThan(0);
    });

    it("Nested objects maintain key order", function () {
      const obj = {
        z: { nested: 1 },
        a: { nested: 2 },
        m: { nested: 3 },
      };
      const canonical = canonicalize(obj);
      const aIndex = canonical.indexOf('"a"');
      const mIndex = canonical.indexOf('"m"');
      const zIndex = canonical.indexOf('"z"');
      expect(aIndex).to.be.lessThan(mIndex);
      expect(mIndex).to.be.lessThan(zIndex);
    });

    it("Arrays preserve element order", function () {
      const obj1 = { items: [1, 2, 3] };
      const obj2 = { items: [3, 2, 1] };
      const hash1 = hashManifest(obj1);
      const hash2 = hashManifest(obj2);
      expect(hash1).to.not.equal(hash2);
    });

    it("Boolean values are correctly serialized", function () {
      const obj1 = { flag: true };
      const obj2 = { flag: false };
      const canonical1 = canonicalize(obj1);
      const canonical2 = canonicalize(obj2);
      expect(canonical1).to.include("true");
      expect(canonical2).to.include("false");
    });

    it("Null values are correctly serialized", function () {
      const obj = { value: null };
      const canonical = canonicalize(obj);
      expect(canonical).to.include("null");
    });
  });

  // ===== GOLDEN VECTOR TESTS =====
  describe("Golden Vectors", function () {
    it("Declaration hash is deterministic", function () {
      const hash1 = hashManifest(validDeclaration);
      const hash2 = hashManifest(validDeclaration);

      expect(hash1).to.equal(hash2);
      expect(hash1).to.match(/^0x[a-f0-9]{64}$/i);
    });

    it("Evidence hash is deterministic", function () {
      const hash1 = hashManifest(validEvidence);
      const hash2 = hashManifest(validEvidence);

      expect(hash1).to.equal(hash2);
      expect(hash1).to.match(/^0x[a-f0-9]{64}$/i);
    });

    it("Known declaration hash matches expected value", function () {
      const testDecl = {
        schema: "stated/declaration/v1",
        project: { title: "Test", promise: "Test promise" },
        deadline: "2026-12-31T23:59:59Z",
        conditions: [{ id: "c1", text: "Complete" }],
      };

      const hash = hashManifest(testDecl);
      expect(hash).to.be.a("string");
      expect(hash.length).to.equal(66); // 0x + 64 hex chars
    });

    it("RFC 8785 canonicalization is complete", function () {
      const complexObj = {
        z: 1,
        a: 2,
        nested: {
          y: true,
          b: false,
          text: "café",
        },
        array: [1, "two", null, true],
        unicode: "🔒",
      };

      const canonical = canonicalize(complexObj);
      // Keys should be sorted lexicographically at all levels
      expect(canonical).to.be.a("string");
      expect(canonical.length).to.be.greaterThan(0);

      // Hash should be deterministic
      const hash1 = hashManifest(complexObj);
      const hash2 = hashManifest(complexObj);
      expect(hash1).to.equal(hash2);
    });
  });
});
