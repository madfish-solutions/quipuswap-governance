const { MichelsonMap } = require("@taquito/michelson-encoder");
const { alice } = require("../scripts/sandbox/accounts");

const proposalConfig = {
  required_proposal_stake: 4,
  minimal_voting_quorum: 4,
  minimal_approval_quorum:4,
}

module.exports = {
  owner: alice.pkh,
  id_count: "0",
  proposals: MichelsonMap.fromLiteral({}),
  votes: MichelsonMap.fromLiteral({}),
  proposal_config: proposalConfig,
  pending_ownertranship_tranfer: null
};

