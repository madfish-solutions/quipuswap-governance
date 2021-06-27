const { MichelsonMap } = require("@taquito/michelson-encoder");
const { alice, bob, eve } = require("../../scripts/sandbox/accounts");

const proposalConfig = {
    required_proposal_stake: 4,
    minimal_voting_quorum: 4,
    minimal_approval_quorum: 4,
};

const defaultStorage = {
    owner: alice.pkh,
    id_count: "0",
    proposals: MichelsonMap.fromLiteral({}),
    votes: MichelsonMap.fromLiteral({}),
    proposal_config: proposalConfig,
    pending_ownership_tranfer: null
};

const withPendingOwnershipBob = {
    owner: alice.pkh,
    id_count: "0",
    proposals: MichelsonMap.fromLiteral({}),
    votes: MichelsonMap.fromLiteral({}),
    proposal_config: proposalConfig,
    pending_ownership_tranfer: bob.pkh
};

const withPendingOwnershipEve = {
    owner: alice.pkh,
    id_count: "0",
    proposals: MichelsonMap.fromLiteral({}),
    votes: MichelsonMap.fromLiteral({}),
    proposal_config: proposalConfig,
    pending_ownership_tranfer: eve.pkh
};
const storages = {
    defaultStorage: defaultStorage,
    withPendingOwnershipBob: withPendingOwnershipBob,
    withPendingOwnershipEve: withPendingOwnershipEve
};


module.exports = { storages };
