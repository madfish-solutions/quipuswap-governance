const { MichelsonMap } = require("@taquito/michelson-encoder");
const { alice, bob, eve } = require("../../scripts/sandbox/accounts");

const proposalConfig = {
  proposal_stake: "4",
  voting_quorum: "4",
  support_quorum: "4",
};

const defaultStorage = {
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

const withPendingOwnershipBob = {
  owner: alice.pkh,
  id_count: "0",
  proposals: MichelsonMap.fromLiteral({}),
  votes: MichelsonMap.fromLiteral({}),
  locked_balances: {
    balances: MichelsonMap.fromLiteral({}),
    proposals: MichelsonMap.fromLiteral({}),
  },
  proposal_config: proposalConfig,
  pending_owner: bob.pkh,
  temp_proposal_cache: MichelsonMap.fromLiteral({}),
};

const withPendingOwnershipEve = {
  owner: alice.pkh,
  id_count: "0",
  proposals: MichelsonMap.fromLiteral({}),
  votes: MichelsonMap.fromLiteral({}),
  locked_balances: {
    balances: MichelsonMap.fromLiteral({}),
    proposals: MichelsonMap.fromLiteral({}),
  },
  proposal_config: proposalConfig,
  pending_owner: eve.pkh,
  temp_proposal_cache: MichelsonMap.fromLiteral({}),
};

let w = Buffer.from("dsadas", "ascii").toString("hex");
const proposals = MichelsonMap.fromLiteral({
  0: {
    creator: alice.pkh,
    ipfs_link: w,
    forum_link: w,
    votes_for: "0",
    votes_against: "0",
    start_date: "2030-01-01T10:00:00Z",
    end_date: "2031-01-01T00:00:00Z",
    status: { pending: null },
    config: proposalConfig,
    fixed_supply: 1000,
  },
  1: {
    creator: alice.pkh,
    ipfs_link: w,
    forum_link: w,
    votes_for: "0",
    votes_against: "0",
    start_date: "2020-01-01T10:00:00Z",
    end_date: "2030-01-01T00:00:00Z",
    status: { voting: null },
    config: proposalConfig,
    fixed_supply: 1000,
  },
  2: {
    creator: alice.pkh,
    ipfs_link: w,
    forum_link: w,
    votes_for: "0",
    votes_against: "0",
    start_date: "2000-01-01T10:00:00Z",
    end_date: "2090-01-01T00:00:00Z",
    status: { banned: null },
    config: proposalConfig,
    fixed_supply: 1000,
  },
  3: {
    creator: alice.pkh,
    ipfs_link: w,
    forum_link: w,
    votes_for: "0",
    votes_against: "0",
    start_date: "2020-01-01T10:00:00Z",
    end_date: "2021-01-01T00:00:00Z",
    status: { approved: null },
    config: proposalConfig,
    fixed_supply: 1000,
  },
  4: {
    creator: alice.pkh,
    ipfs_link: w,
    forum_link: w,
    votes_for: "0",
    votes_against: "0",
    start_date: "2020-01-01T10:00:00Z",
    end_date: "2030-01-01T00:00:00Z",
    status: { voting: null },
    config: proposalConfig,
    fixed_supply: 1000,
  },
});

// votes = votes.set({
//     [4: alice.pk ]: { "for" : null }
// })

const withProposals = {
  owner: alice.pkh,
  id_count: "1",
  proposals: proposals,
  votes: MichelsonMap.fromLiteral({}),
  locked_balances: {
    balances: MichelsonMap.fromLiteral({}),
    proposals: MichelsonMap.fromLiteral({}),
  },
  proposal_config: proposalConfig,
  pending_owner: null,
  temp_proposal_cache: MichelsonMap.fromLiteral({}),
};

const storages = {
  defaultStorage: defaultStorage,
  withPendingOwnershipBob: withPendingOwnershipBob,
  withPendingOwnershipEve: withPendingOwnershipEve,
  withProposals: withProposals,
};

module.exports = { storages };
