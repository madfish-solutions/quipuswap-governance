const { MichelsonMap } = require("@taquito/michelson-encoder");
const { alice, bob, eve } = require("../../scripts/sandbox/accounts");

const proposalConfig = {
    required_proposal_stake: "4",
    minimal_voting_quorum: "4",
    minimal_approval_quorum: "4",
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


let w = Buffer.from("dsadas", "ascii").toString('hex')

const proposals = MichelsonMap.fromLiteral({
    "0": {
        ipfs_link: w,
        forum_link: w,
        votes_for: "0",
        votes_against: "0",
        start_date: "9999999999",
        end_date: "99999999",
        status: {pending:null},
        config: proposalConfig
    }
});


const withPendingProposal = {
    owner: alice.pkh,
    id_count: "1",
    proposals: proposals,
    votes: MichelsonMap.fromLiteral({}),
    proposal_config: proposalConfig,
    pending_ownership_tranfer: null
};

const storages = {
    defaultStorage: defaultStorage,
    withPendingOwnershipBob: withPendingOwnershipBob,
    withPendingOwnershipEve: withPendingOwnershipEve,
    withPendingProposal: withPendingProposal
};


module.exports = { storages };
