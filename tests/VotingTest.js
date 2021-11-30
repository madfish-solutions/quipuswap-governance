const { Tezos, signerAlice, signerBob } = require("./utils/cli");
const { migrate } = require("../scripts/helpers");

const { rejects, strictEqual, notStrictEqual } = require("assert");

const { alice } = require("../scripts/sandbox/accounts");
const fa2Storage = require("../storage/FA2");

describe("Voting test", async function () {
  let contract;
  let fa2Contract;
  before(async () => {
    try {
      Tezos.setSignerProvider(signerAlice);
      const deployedFa2 = await migrate(Tezos, "FA2", fa2Storage);
      fa2Contract = await Tezos.contract.at(deployedFa2);
      const { storages } = require("./storage/storage");
      storages["withProposals"].token_address = deployedFa2;
      const deployedContract = await migrate(
        Tezos,
        "Governance",
        storages["withProposals"],
      );
      contract = await Tezos.contract.at(deployedContract);

      const update_op = await fa2Contract.methods
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
        strictEqual(err.message, "Gov/bad-proposal");
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
      const prevStorage = await contract.storage();
      const prevProposal = await prevStorage.proposals.get(4);
      const op = await contract.methods.vote("4", "for", 50).send();
      await op.confirmation();
      const storage = await contract.storage();
      const proposal = await storage.proposals.get(4);
      strictEqual(proposal.votes_for.toNumber(), 50);
      strictEqual(
        proposal.voters.toNumber(),
        prevProposal.voters.toNumber() + 1,
      );
    });
    it("Should allow voting twice for the same proposal", async function () {
      const prevStorage = await contract.storage();
      const prevProposal = await prevStorage.proposals.get(4);
      const op = await contract.methods.vote("4", "for", 1).send();
      await op.confirmation();
      const storage = await contract.storage();
      const proposal = await storage.proposals.get(4);
      strictEqual(proposal.votes_for.toNumber(), 51);
      strictEqual(proposal.voters.toNumber(), prevProposal.voters.toNumber());
    });
    it("Should allow changing the vote from for to against", async function () {
      const prevStorage = await contract.storage();
      const prevProposal = await prevStorage.proposals.get(4);
      const op = await contract.methods.vote("4", "against", 1).send();
      await op.confirmation();
      const storage = await contract.storage();
      const proposal = await storage.proposals.get(4);
      strictEqual(proposal.votes_for.toNumber(), 0);
      strictEqual(proposal.votes_against.toNumber(), 52);
      strictEqual(proposal.voters.toNumber(), prevProposal.voters.toNumber());
    });
  });
  describe("Testing entrypoint: Claim", async function () {
    it("Revert to claim collateral if collateral amount less 0", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(contract.methods.claim("unit").send(), err => {
        strictEqual(err.message, "Gov/no-claim");
        return true;
      });
    });
    it("Should allow to claim collateral after voting is finished from all available proposals", async function () {
      Tezos.setSignerProvider(signerAlice);
      let fa2 = await fa2Contract.storage();
      let acc = await fa2.account_info.get(alice.pkh);
      const old_balance = await acc.balances.get("0").toNumber();

      const op = await contract.methods.claim("unit").send();
      await op.confirmation();
      const storage = await contract.storage();
      const locked_balance = await storage.locked_balances.balances.get({
        proposal: 5,
        account: alice.pkh,
      });

      fa2 = await fa2Contract.storage();
      acc = await fa2.account_info.get(alice.pkh);
      const new_balance = await acc.balances.get("0").toNumber();

      strictEqual(new_balance, old_balance + 42);
      strictEqual(locked_balance, undefined);
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
