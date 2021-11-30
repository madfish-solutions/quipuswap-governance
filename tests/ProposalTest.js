const { rejects, strictEqual } = require("assert");
const { Tezos, signerAlice, alice } = require("./utils/cli");
const { migrate } = require("../scripts/helpers");
const fa2Storage = require("../storage/FA2");

function dayToSec(day) {
  return day * 86400;
}

describe("Proposal test", async function () {
  Tezos.setSignerProvider(signerAlice);
  let contract;
  let fa2Contract;
  const link = Buffer.from("ipfsLink", "ascii").toString("hex");

  before(async () => {
    try {
      const { storages } = require("./storage/storage");
      const deployedFa2 = await migrate(Tezos, "FA2", fa2Storage);
      fa2Contract = await Tezos.contract.at(deployedFa2);
      storages["defaultStorage"].token_address = deployedFa2;
      const deployedContract = await migrate(
        Tezos,
        "Governance",
        storages["defaultStorage"],
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

  describe("Testing entrypoint: new_proposal", async function () {
    it("Revert creating proposal with short voting period", async function () {
      await rejects(
        contract.methods.new_proposal(link, link, link, 1, 1).send(),
        err => {
          strictEqual(err.message, "Gov/small-voting-perod");
          return true;
        },
      );
    });
    it("Revert creating proposal with long voting period", async function () {
      await rejects(
        contract.methods.new_proposal(link, link, link, dayToSec(31), 0).send(),
        err => {
          strictEqual(err.message, "Gov/long-voting-perod");
          return true;
        },
      );
    });
    it("Revert creating proposal with long dererral period", async function () {
      await rejects(
        contract.methods
          .new_proposal(link, link, link, dayToSec(4), dayToSec(31))
          .send(),
        err => {
          strictEqual(err.message, "Gov/long-deferral");
          return true;
        },
      );
    });
    it("Should create proposal with enough stake", async function () {
      const op = await contract.methods
        .new_proposal(link, link, link, dayToSec(4), 0)
        .send();
      await op.confirmation();
      const storage = await contract.storage();
      strictEqual(1, storage.id_count.toNumber());
    });
    it("Should create deferral proposal with enough stake", async function () {
      const op = await contract.methods
        .new_proposal(link, link, link, dayToSec(4), dayToSec(15))
        .send();
      await op.confirmation();
      const storage = await contract.storage();
      strictEqual(2, storage.id_count.toNumber());
    });
  });
});
