const { rejects, strictEqual, notStrictEqual } = require("assert");
const { Tezos, signerAlice, signerBob } = require("./utils/cli");
const { migrate } = require("../scripts/helpers");
const { bob } = require("../scripts/sandbox/accounts");

describe("Admin test", async function () {
  let contract;

  var s = [
    "withProposals",
    "withProposals",
    "defaultStorage",
    "defaultStorage",
    "defaultStorage",
    "defaultStorage",
    "defaultStorage",
    "defaultStorage",
    "withPendingOwnershipBob",
    "defaultStorage",
    "defaultStorage",
    "withPendingOwnershipBob",
    "defaultStorage",
    "defaultStorage",
    "withPendingOwnershipBob",
    "defaultStorage",
  ];

  beforeEach(async () => {
    let q = s.pop();
    try {
      const { storages } = require("./storage/storage");
      let deployedContract = await migrate(Tezos, "Governance", storages[q]);
      contract = await Tezos.contract.at(deployedContract);
    } catch (e) {
      console.log(e);
    }
  });

  describe("Testing entrypoint: Transfer_ownership", async function () {
    it("Only the owner can call this method", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(
        contract.methods.transfer_ownership(bob.pkh).send(),
        err => {
          strictEqual(err.message, "Gov/not-owner");
          return true;
        },
      );
    });
    it("Сannot transfer ownership if someone is already in the transfer pending", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(
        contract.methods.transfer_ownership(bob.pkh).send(),
        err => {
          strictEqual(err.message, "Gov/no-pending-admin");
          return true;
        },
      );
    });
    it("Successful transfer of ownership", async function () {
      Tezos.setSignerProvider(signerAlice);
      let op = await contract.methods.transfer_ownership(bob.pkh).send();
      await op.confirmation();
      let storage = await contract.storage();
      strictEqual(bob.pkh, storage.pending_owner);
    });
  });
  describe("Testing entrypoint: Take_ownership", async function () {
    it("Cannot take ownership, if does not in pending to transfer of ownership", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(contract.methods.take_ownership(["unit"]).send(), err => {
        strictEqual(err.message, "Gov/not-pending-owner");
        return true;
      });
    });
    it("Bob successfully became the new owner", async function () {
      Tezos.setSignerProvider(signerBob);
      let op = await contract.methods.take_ownership(["unit"]).send();
      await op.confirmation();
      let storage = await contract.storage();
      strictEqual(storage.owner, bob.pkh);
    });
  });
  describe("Testing entrypoint: СancelTransferOwnership", async function () {
    it("Only the owner can call this method", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(
        contract.methods.cancel_transfer_ownership(["unit"]).send(),
        err => {
          strictEqual(err.message, "Gov/not-owner");
          return true;
        },
      );
    });
    it('failwith("Gov/no-pending-admin")', async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(
        contract.methods.cancel_transfer_ownership(["unit"]).send(),
        err => {
          strictEqual(err.message, "Gov/no-pending-admin");
          return true;
        },
      );
    });
    it("Successfully cancel transfer ownership", async function () {
      Tezos.setSignerProvider(signerAlice);
      let op = await contract.methods
        .cancel_transfer_ownership(["unit"])
        .send();
      await op.confirmation();
      let storage = await contract.storage();
      strictEqual(storage.pending_owner, null);
    });
  });
  describe("Testing entrypoint: set_proposal_setup", async function () {
    it("Only the owner can call this method", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(
        contract.methods
          .set_proposal_setup("proposal_stake", 5, "null", "unit")
          .send(),
        err => {
          strictEqual(err.message, "Gov/not-owner");
          return true;
        },
      );
    });
    it("Successfully changed: Proposal_stake", async function () {
      Tezos.setSignerProvider(signerAlice);
      let op = await contract.methods
        .set_proposal_setup("proposal_stake", 5, "null", "unit")
        .send();
      await op.confirmation();
      let storage = await contract.storage();
      let proposal_config = await storage.proposal_config;
      strictEqual(proposal_config.proposal_stake.toNumber(), 5);
    });
    it("Successfully changed: Voting_quorum", async function () {
      Tezos.setSignerProvider(signerAlice);
      let op = await contract.methods
        .set_proposal_setup("voting_quorum", 5, "null", "unit")
        .send();
      await op.confirmation();
      let storage = await contract.storage();
      let proposal_config = await storage.proposal_config;
      strictEqual(proposal_config.voting_quorum.toNumber(), 5);
    });
    it("Successfully changed: Support_quorum", async function () {
      Tezos.setSignerProvider(signerAlice);
      let op = await contract.methods
        .set_proposal_setup("support_quorum", 5, "null", "unit")
        .send();
      await op.confirmation();
      let storage = await contract.storage();
      let proposal_config = await storage.proposal_config;
      strictEqual(proposal_config.support_quorum.toNumber(), 5);
    });
  });
  describe("Testing entrypoint: ban_proposal", async function () {
    it("Only the owner can call this method", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(contract.methods.ban_proposal(0).send(), err => {
        strictEqual(err.message, "Gov/not-owner");
        return true;
      });
    });
    it("Invalid proposal id", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(contract.methods.ban_proposal(1).send(), err => {
        strictEqual(err.message, "Gov/no-proposal-id");
        return true;
      });
    });
    it("Bad proposal status", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(contract.methods.ban_proposal(3).send(), err => {
        strictEqual(err.message, "Gov/bad-proposal-status");
        return true;
      });
    });
    it("Successfully ban proposal", async function () {
      Tezos.setSignerProvider(signerAlice);
      let op = await contract.methods.ban_proposal(0).send();
      await op.confirmation();
      let storage = await contract.storage();
      let proposal = await storage.proposals.get(0);
      notStrictEqual(undefined, proposal.status["banned"]);
    });
  });
});
