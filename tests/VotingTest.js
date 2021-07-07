const { Tezos, signerAlice, signerBob } = require("./utils/cli");
const { migrate } = require("../scripts/helpers");

const { rejects, strictEqual, notStrictEqual } = require("assert");

const { address } = require("../scripts/sandbox/fa2_latest.json");
const { alice } = require("../scripts/sandbox/accounts");

describe("Voting test", async function () {
  let contract;
  before(async () => {
    try {
      Tezos.setSignerProvider(signerAlice);
      const { storages } = require("./storage/storage");

      let deployedContract = await migrate(
        Tezos,
        "Governance",
        storages["withProposals"],
      );
      contract = await Tezos.contract.at(deployedContract);

      fa2_contract = await Tezos.contract.at(address);

      const update_op = await fa2_contract.methods
        .update_operators([
          {
            add_operator: {
              owner: alice.pkh,
              operator: deployedContract,
              token_id: 0,
            },
          },
        ])
        .send();
      await update_op.confirmation();
    } catch (e) {
      console.log(e);
    }
  });

  describe("Testing entrypoint: add_vote", async function () {
    it("Invalid proposal id", async function () {
      await rejects(contract.methods.vote("10", "for", 1).send(), err => {
        strictEqual(err.message, "Gov/bad-proposal");
        return true;
      });
    });
    it("The voting period is over", async function () {
      await rejects(contract.methods.vote("3", "for", 1).send(), err => {
        strictEqual(err.message, "Gov/voting-over");
        return true;
      });
    });
    it("Voting has not started yet", async function () {
      await rejects(contract.methods.vote("0", "for", 1).send(), err => {
        strictEqual(err.message, "Gov/voting-not-started");
        return true;
      });
    });
    it("This proposal has been blocked by the administrator", async function () {
      await rejects(contract.methods.vote("2", "for", 1).send(), err => {
        strictEqual(err.message, "Gov/proposal-banned");
        return true;
      });
    });
    it("Successful new vote", async function () {
      let op = await contract.methods.vote("4", "for", 1).send();
      await op.confirmation();
      let storage = await contract.storage();
      let proposal = await storage.proposals.get(4);
      strictEqual(1, proposal.votes_for.toNumber());
    });
  });
  describe("Testing entrypoint: Claim", async function () {
    it("Fail if not claiming amount", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(contract.methods.claim("unit").send(), err => {
        strictEqual(err.message, "Gov/no-claim");
        return true;
      });
    });
    it("Successful Claim", async function () {
      Tezos.setSignerProvider(signerAlice);
      let op = await contract.methods.claim("unit").send();
      await op.confirmation();
      let storage = await contract.storage();

      const locked_balance = await storage.locked_balances.balances.get({
        proposal: 5,
        account: alice.pkh,
      });
      strictEqual(locked_balance, undefined);
    });
  });
  describe("Testing entrypoint: Finalize voting", async function () {
    it("Fail if proposal not started or finalized", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(contract.methods.finalize_voting(2).send(), err => {
        strictEqual(err.message, "Gov/not-voting-period");
        return true;
      });
    });
    it("Fail if voting period not over", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(contract.methods.finalize_voting(1).send(), err => {
        strictEqual(err.message, "Gov/voting-not-over");
        return true;
      });
    });
    it("Successful finalized: Underrated", async function () {
      Tezos.setSignerProvider(signerAlice);
      let op = await contract.methods.finalize_voting(5).send();
      await op.confirmation();
      let storage = await contract.storage();
      let proposal = await storage.proposals.get(5);
      notStrictEqual(proposal.status["underrated"], undefined);
    });
    it("Successful finalized: Rejected", async function () {
      Tezos.setSignerProvider(signerAlice);
      let op = await contract.methods.finalize_voting(6).send();
      await op.confirmation();
      let storage = await contract.storage();
      let proposal = await storage.proposals.get(6);
      notStrictEqual(proposal.status["rejected"], undefined);
    });
    it("Successful finalized: Approved", async function () {
      Tezos.setSignerProvider(signerAlice);
      let op = await contract.methods.finalize_voting(7).send();
      await op.confirmation();
      let storage = await contract.storage();
      let proposal = await storage.proposals.get(7);
      notStrictEqual(proposal.status["approved"], undefined);
    });
  });
  describe("Testing entrypoint: Activate_proposal", async function () {
    it("Fail if proposal status not approved", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(contract.methods.activate_proposal(1).send(), err => {
        strictEqual(err.message, "Gov/not-approved");
        return true;
      });
    });
    it("Successful activate proposal", async function () {
      Tezos.setSignerProvider(signerAlice);
      let op = await contract.methods.activate_proposal(7).send();
      await op.confirmation();
      let storage = await contract.storage();
      let proposal = await storage.proposals.get(7);
      notStrictEqual(proposal.status["activated"], undefined);
    });
  });
});
