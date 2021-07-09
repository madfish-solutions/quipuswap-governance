const { MichelsonMap } = require("@taquito/michelson-encoder");
const { alice } = require("../scripts/sandbox/accounts");

const proposalConfig = {
  proposal_stake: "5000",
  voting_quorum: "40000",
  support_quorum: "660000",
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
  token_address: "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
  token_id: 0,
};
