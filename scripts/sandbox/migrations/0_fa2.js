const { alice, bob } = require("../accounts");
const { migrate } = require("../../helpers");
const FA2Storage = require("../../../storage/FA2");
const fse = require("fs-extra");

const { Tezos } = require("../../../tests/utils/cli");

async function migr() {
  const contractAddress = await migrate(Tezos, "FA2", FA2Storage);
  let data = {
    address: contractAddress,
  };
  fse.outputFile(
    "./scripts/sandbox/fa2_latest.json",
    JSON.stringify(data),
    err => {
      if (err) {
        console.log(err);
      } else {
        console.log("The contract address was saved!");
      }
    },
  );
  console.log(`FA2 token: ${contractAddress}`);
}

migr();
