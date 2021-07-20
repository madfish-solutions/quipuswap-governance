const { Tezos, signerAlice, signerBob } = require("./utils/cli");
const { migrate } = require("../scripts/helpers");

const { rejects, strictEqual, notStrictEqual } = require("assert");

const { address } = require("../scripts/sandbox/fa2_latest.json");
const { alice } = require("../scripts/sandbox/accounts");

describe("Voting test", async function () {
  let contract;
  let fa2_contract;
  before(async () => {
    try {
      Tezos.setSignerProvider(signerAlice);
      const { storages } = require("./storage/storage");

      const deployedContract = await migrate(
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
    it("Revert vote for a non-existent proposal", async function () {
      await rejects(contract.methods.vote("10", "for", 1).send(), err => {
        strictEqual(err.message, "Gov/not-prop-id");
        return true;
      });
    });
    it("Revert vote for a ended proposal", async function () {
      await rejects(contract.methods.vote("3", "for", 1).send(), err => {
        strictEqual(err.message, "Gov/voting-over");
        return true;
      });
    });
    it("Revert vote for a not-started proposal", async function () {
      await rejects(contract.methods.vote("0", "for", 1).send(), err => {
        strictEqual(err.message, "Gov/voting-not-started");
        return true;
      });
    });
    it("Revert vote for a banned proposal", async function () {
      await rejects(contract.methods.vote("2", "for", 1).send(), err => {
        strictEqual(err.message, "Gov/proposal-banned");
        return true;
      });
    });
    it("Should allow voting for the same", async function () {
      const op = await contract.methods.vote("4", "for", 50).send();
      await op.confirmation();
      const storage = await contract.storage();
      const proposal = await storage.proposals.get(4);
      strictEqual(proposal.votes_for.toNumber(), 51);
    });
    it("Should allow voting twice for the same proposal", async function () {
      const op = await contract.methods.vote("4", "for", 1).send();
      await op.confirmation();
      const storage = await contract.storage();
      const proposal = await storage.proposals.get(4);
      strictEqual(proposal.votes_for.toNumber(), 52);
    });
    it("Should allow changing the vote from for to against", async function () {
      const op = await contract.methods.vote("4", "against", 1).send();
      await op.confirmation();
      const storage = await contract.storage();
      const proposal = await storage.proposals.get(4);
      strictEqual(proposal.votes_for.toNumber(), 0);
      strictEqual(proposal.votes_against.toNumber(), 53);
    });
  });
  describe("Testing entrypoint: Claim", async function () {
    it("Revert to claiming for non existent proposal", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(contract.methods.claim(99).send(), err => {
        strictEqual(err.message, "Gov/not-prop-id");
        return true;
      });
    });
    it("Revert to claim if alice does not have this proposal", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(contract.methods.claim(1).send(), err => {
        strictEqual(err.message, "Gov/not-proposal");
        return true;
      });
    });
    it("Revert to claim if voting period not over", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(contract.methods.claim(4).send(), err => {
        strictEqual(err.message, "Gov/no-ended-voting");
        return true;
      });
    });
    it("Should allow to claim collateral after voting is finished from available proposal", async function () {
      Tezos.setSignerProvider(signerAlice);
      let fa2 = await fa2_contract.storage();
      let acc = await fa2.account_info.get(alice.pkh);
      const old_balance = await acc.balances.get("0").toNumber();

      const op = await contract.methods.claim(5).send();
      await op.confirmation();
      const storage = await contract.storage();
      const user_proposals = await storage.user_proposals.get(alice.pkh);

      fa2 = await fa2_contract.storage();
      acc = await fa2.account_info.get(alice.pkh);
      const new_balance = await acc.balances.get("0").toNumber();

      strictEqual(new_balance, old_balance + 21);
      strictEqual(user_proposals.includes(5), false);
    });
  });
  describe("Testing entrypoint: Finalize voting", async function () {
    it("Revert to finalizing proposal if proposal is finalized", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(contract.methods.finalize_voting(2).send(), err => {
        strictEqual(err.message, "Gov/not-voting-period");
        return true;
      });
    });
    it("Revert to finalizing proposal if voting period not over", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(contract.methods.finalize_voting(1).send(), err => {
        strictEqual(err.message, "Gov/voting-not-over");
        return true;
      });
    });
    it("Should  allow counting the voting results for a proposal in Pending status and expired voting period", async function () {
      Tezos.setSignerProvider(signerAlice);
      const op = await contract.methods.finalize_voting(8).send();
      await op.confirmation();
      const storage = await contract.storage();
      const proposal = await storage.proposals.get(8);
      notStrictEqual(proposal.status["underrated"], undefined);
    });
    it("Should allow to count the voting results with the result: Underrated", async function () {
      Tezos.setSignerProvider(signerAlice);
      const op = await contract.methods.finalize_voting(5).send();
      await op.confirmation();
      const storage = await contract.storage();
      const proposal = await storage.proposals.get(5);
      notStrictEqual(proposal.status["underrated"], undefined);
    });
    it("Should allow to count the voting results with the result: Rejected", async function () {
      Tezos.setSignerProvider(signerAlice);
      const op = await contract.methods.finalize_voting(6).send();
      await op.confirmation();
      const storage = await contract.storage();
      const proposal = await storage.proposals.get(6);
      notStrictEqual(proposal.status["rejected"], undefined);
    });
    it("Should allow to count the voting results with the result: Approved", async function () {
      Tezos.setSignerProvider(signerAlice);
      const op = await contract.methods.finalize_voting(7).send();
      await op.confirmation();
      const storage = await contract.storage();
      const proposal = await storage.proposals.get(7);
      notStrictEqual(proposal.status["approved"], undefined);
    });
  });
  describe("Testing entrypoint: Activate_proposal", async function () {
    it("Revert activate proposal if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(contract.methods.activate_proposal(1).send(), err => {
        strictEqual(err.message, "Gov/not-owner");
        return true;
      });
    });
    it("Revert activate proposal if proposal status not Approved", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(contract.methods.activate_proposal(1).send(), err => {
        strictEqual(err.message, "Gov/not-approved");
        return true;
      });
    });
    it("Should allow to activate proposal", async function () {
      Tezos.setSignerProvider(signerAlice);
      const op = await contract.methods.activate_proposal(7).send();
      await op.confirmation();
      const storage = await contract.storage();
      const proposal = await storage.proposals.get(7);
      notStrictEqual(proposal.status["activated"], undefined);
    });
  });
});
