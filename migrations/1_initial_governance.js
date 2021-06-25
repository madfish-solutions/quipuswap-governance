const { migrate } = require("../scripts/helpers");
const governanceStorage = require("../storage/Governance");

module.exports = async (tezos) => {
  const contractAddress = await migrate(tezos, "Governance", governanceStorage);
  console.log(`Governance contract address: ${contractAddress}`);
};