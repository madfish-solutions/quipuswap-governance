const { rejects, strictEqual } = require("assert");
const { Tezos, signerAlice, alice } = require("./utils/cli");
const { migrate } = require("../scripts/helpers");

function dayToSec(day) {
  return day * 86400;
}

describe("Proposal test", async function () {
  Tezos.setSignerProvider(signerAlice);
  let contract;
  const link = Buffer.from("ipfsLink", "ascii").toString("hex");

  before(async () => {
    try {
      const { storages } = require("./storage/storage");
      const deployedContract = await migrate(
        Tezos,
        "Governance",
        storages["defaultStorage"],
      );
      contract = await Tezos.contract.at(deployedContract);
      const { address } = require("../scripts/sandbox/fa2_latest.json");
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
