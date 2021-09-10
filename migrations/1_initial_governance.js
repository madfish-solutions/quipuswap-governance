const { migrate } = require("../scripts/helpers");
const governanceStorage = require("../storage/Governance");
const fa2Storage = require("../storage/FA2");
const env = process.env;

module.exports = async tezos => {
  const sender = await tezos.signer.publicKeyHash();
  governanceStorage.owner = sender;
  if (env.NETWORK === "mainnet") {
    governanceStorage.token_address = env.TOKEN_ADDRESS;
  } else {
    const deployedToken = await migrate(tezos, "FA2", fa2Storage);
    governanceStorage.token_address = deployedToken;
    console.log(`Token contract address: ${deployedToken}`);
  }
  const contractAddress = await migrate(tezos, "Governance", governanceStorage);
  console.log(`Governance contract address: ${contractAddress}`);
};
