const { rejects, strictEqual, notStrictEqual } = require("assert");
const { Tezos, signerAlice, signerBob } = require("./utils/cli");
const { migrate } = require("../scripts/helpers");
const { alice } = require("../scripts/sandbox/accounts");
const { bob } = require("../scripts/sandbox/accounts");

const { confirmContract } = require("./utils/confirmation");

async function awaitOwnershipContender(contract, addr) {
  do {
    var storage = await contract.storage();
  } while (storage.pending_owner != addr);
}

async function awaitNewOwner(contract, addr) {
  do {
    var storage = await contract.storage();
  } while (storage.owner != addr);
}

async function awaitChangeProposalSetup(contract, param) {
  do {
    var storage = await contract.storage();
    var proposal_config = await storage.proposal_config;

    if (param === "Proposal_stake") {
      var prop_param = proposal_config.proposal_stake;
    } else if (param === "Voting_quorum") {
      var prop_param = proposal_config.voting_quorum;
    } else {
      var prop_param = proposal_config.support_quorum;
    }
  } while (prop_param.toNumber() === 4);
}

async function awaitBanProposal(contract) {
  do {
    var storage = await contract.storage();
    var proposal = await storage.proposals.get(0);
  } while (proposal.status["banned"] === undefined);
}

describe("Admin test", async function () {
  let contract;

  var s = [
    "withProposals",
    "defaultStorage",
    "defaultStorage",
    "defaultStorage",
    "defaultStorage",
    "defaultStorage",
    "defaultStorage",
    "defaultStorage",
    "defaultStorage",
    "withPendingOwnershipBob",
    "defaultStorage",
    "defaultStorage",
    "withPendingOwnershipEve",
    "withPendingOwnershipBob",
    "defaultStorage",
  ];

  beforeEach(async () => {
    let q = s.pop();
    try {
      const { storages } = require("./storage/storage");
      let deployedContract = await migrate(Tezos, "Governance", storages[q]);
      contract = await confirmContract(Tezos, deployedContract);
    } catch (e) {
      console.log(e);
    }
  });

  describe("Testing entrypoint: Transfer_ownership", async function () {
    it("Only the owner can call this method", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(
        contract.methods.transfer_ownership(bob.pkh).send(),
        (err) => {
          strictEqual(err.message, "This method is for the owner only");
          return true;
        }
      );
    });
    it("Сannot transfer ownership to someone who is already awaiting the transfer", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(
        contract.methods.transfer_ownership(bob.pkh).send(),
        (err) => {
          strictEqual(
            err.message,
            "You are already transferring ownership to this account"
          );
          return true;
        }
      );
    });
    it("Сannot transfer ownership to someone else if someone is already in the transfer pending", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(
        contract.methods.transfer_ownership(bob.pkh).send(),
        (err) => {
          strictEqual(
            err.message,
            "You are already transferring ownership to someone"
          );
          return true;
        }
      );
    });
    it("Successful transfer of ownership", async function () {
      Tezos.setSignerProvider(signerAlice);
      await contract.methods.transfer_ownership(bob.pkh).send();
      await awaitOwnershipContender(contract, bob.pkh).catch((err) => {
        console.log(err);
      });
      let storage = await contract.storage();
      strictEqual(bob.pkh, storage.pending_owner);
    });
  });
  describe("Testing entrypoint: Take_ownership", async function () {
    it("Cannot take ownership, if does not in pending to transfer of ownership", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(contract.methods.take_ownership(["unit"]).send(), (err) => {
        strictEqual(
          err.message,
          "You are not claiming to be the owner of the contract"
        );
        return true;
      });
    });
    it("Bob successfully became the new owner", async function () {
      Tezos.setSignerProvider(signerBob);
      await contract.methods.take_ownership(["unit"]).send();
      await awaitNewOwner(contract, bob.pkh).catch((err) => {
        console.log(err);
      });
      let storage = await contract.storage();
      strictEqual(storage.owner, bob.pkh);
    });
  });
  describe("Testing entrypoint: СancelTransferOwnership", async function () {
    it("Only the owner can call this method", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(
        contract.methods.cancel_transfer_ownership(["unit"]).send(),
        (err) => {
          strictEqual(err.message, "This method is for the owner only");
          return true;
        }
      );
    });
    it('failwith("You do not transfer ownership")', async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(
        contract.methods.cancel_transfer_ownership(["unit"]).send(),
        (err) => {
          strictEqual(err.message, "You do not transfer ownership");
          return true;
        }
      );
    });
  });
  describe("Testing entrypoint: set_proposal_setup", async function () {
    it("Only the owner can call this method", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(
        contract.methods.set_proposal_setup("proposal_stake", "unit", 5).send(),
        (err) => {
          strictEqual(err.message, "This method is for the owner only");
          return true;
        }
      );
    });
    it("Successfully changed: Proposal_stake", async function () {
      Tezos.setSignerProvider(signerAlice);
      await contract.methods
        .set_proposal_setup("proposal_stake", "unit", 5)
        .send();
      await awaitChangeProposalSetup(contract, "Proposal_stake").catch(
        (err) => {
          console.log(err);
        }
      );
      let storage = await contract.storage();
      let proposal_config = await storage.proposal_config;
      strictEqual(proposal_config.proposal_stake.toNumber(), 5);
    });
    it("Successfully changed: Voting_quorum", async function () {
      Tezos.setSignerProvider(signerAlice);
      await contract.methods
        .set_proposal_setup("voting_quorum", "unit", 5)
        .send();
      await awaitChangeProposalSetup(contract, "Voting_quorum").catch((err) => {
        console.log(err);
      });
      let storage = await contract.storage();
      let proposal_config = await storage.proposal_config;
      strictEqual(proposal_config.voting_quorum.toNumber(), 5);
    });
    it("Successfully changed: Support_quorum", async function () {
      Tezos.setSignerProvider(signerAlice);
      await contract.methods
        .set_proposal_setup("support_quorum", "unit", 5)
        .send();
      await awaitChangeProposalSetup(contract, "Support_quorum").catch(
        (err) => {
          console.log(err);
        }
      );
      let storage = await contract.storage();
      let proposal_config = await storage.proposal_config;
      strictEqual(proposal_config.support_quorum.toNumber(), 5);
    });
  });
  describe("Testing entrypoint: ban_proposal", async function () {
    it("Only the owner can call this method", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(contract.methods.ban_proposal(0).send(), (err) => {
        strictEqual(err.message, "This method is for the owner only");
        return true;
      });
    });
    it("Invalid proposal id", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(contract.methods.ban_proposal(1).send(), (err) => {
        strictEqual(err.message, "Invalid proposal id");
        return true;
      });
    });
    it("Successfully ban proposal", async function () {
      Tezos.setSignerProvider(signerAlice);
      await contract.methods.ban_proposal(0).send();
      await awaitBanProposal(contract).catch((err) => {
        console.log(err);
      });
      let storage = await contract.storage();
      let proposal = await storage.proposals.get(0);
      notStrictEqual(undefined, proposal.status["banned"]);
    });
  });
});
