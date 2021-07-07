const { Tezos, signerAlice, signerBob } = require("./utils/cli");
const { migrate } = require("../scripts/helpers");

const { rejects, strictEqual } = require("assert");

const { confirmContract } = require("./utils/confirmation");

const { address } = require("../scripts/sandbox/fa2_latest.json");
const { alice } = require("../scripts/sandbox/accounts");

// async function awaitNewVote(contract, beforeCount) {
//     do {
//         var storage = await contract.storage();
//      } while ( storage.id_count.toNumber() === beforeCount)
// };

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
      console.log(e, 111111);
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
});
