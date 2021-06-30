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
        start_date: "2030-01-01T10:00:00Z",
        end_date: "2031-01-01T00:00:00Z",
        status: { pending : null },
        config: proposalConfig
    },
    "1": {
        ipfs_link: w,
        forum_link: w,
        votes_for: "0",
        votes_against: "0",
        start_date: "2020-01-01T10:00:00Z",
        end_date: "2030-01-01T00:00:00Z",
        status: { voting : null },
        config: proposalConfig
    },
    "2": {
        ipfs_link: w,
        forum_link: w,
        votes_for: "0",
        votes_against: "0",
        start_date: "2000-01-01T10:00:00Z",
        end_date: "2090-01-01T00:00:00Z",
        status: { banned : null },
        config: proposalConfig
    },
    "3": {
        ipfs_link: w,
        forum_link: w,
        votes_for: "0",
        votes_against: "0",
        start_date: "2020-01-01T10:00:00Z",
        end_date: "2021-01-01T00:00:00Z",
        status: { approved : null },
        config: proposalConfig
    },
     "4": {
        ipfs_link: w,
        forum_link: w,
        votes_for: "0",
        votes_against: "0",
        start_date: "2020-01-01T10:00:00Z",
        end_date: "2030-01-01T00:00:00Z",
        status: { voting : null },
        config: proposalConfig
    }
});

// votes = votes.set({
//     [4: alice.pk ]: { "for" : null }
// })

const withProposals = {
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
    withProposals: withProposals
};


module.exports = { storages };