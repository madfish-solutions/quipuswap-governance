const { migrate } = require("../scripts/helpers");
const governanceStorage = require("../storage/Governance");
const fa2Storage = require("../storage/FA2");
const env = require("../env");
const { dev } = require("../scripts/sandbox/accounts");

module.exports = async tezos => {
  const sender = await tezos.signer.publicKeyHash();
  governanceStorage.owner = sender;
  if (process.env.NETWORK === "mainnet") {
    governanceStorage.token_address = env.TOKEN_ADDRESS;
  } else {
    fa2Storage.admin = sender;
    fa2Storage.minters = [sender];
    fa2Storage.minters_info = [{ minter: dev.pkh, percent: 100 }];
    const deployedToken = await migrate(tezos, "FA2", fa2Storage);
    governanceStorage.token_address = deployedToken;
    console.log(`Token contract address: ${deployedToken}`);
  }
  const contractAddress = await migrate(tezos, "Governance", governanceStorage);
  console.log(`Governance contract address: ${contractAddress}`);
  console.log(`Contracts deployed to ${env.networks[process.env.NETWORK].rpc}`);
};
