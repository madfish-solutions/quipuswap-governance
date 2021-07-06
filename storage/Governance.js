const { MichelsonMap } = require("@taquito/michelson-encoder");
const { alice } = require("../scripts/sandbox/accounts");

const proposalConfig = {
  proposal_stake: 4,
  voting_quorum: 4,
  support_quorum: 4,
};

module.exports = {
  owner: alice.pkh,
  id_count: "0",
  proposals: MichelsonMap.fromLiteral({}),
  votes: MichelsonMap.fromLiteral({}),
  locked_balances: {
    balances: MichelsonMap.fromLiteral({}),
    proposals: MichelsonMap.fromLiteral({}),
  },
  proposal_config: proposalConfig,
  pending_owner: null,
  temp_proposal_cache: MichelsonMap.fromLiteral({}),
};
