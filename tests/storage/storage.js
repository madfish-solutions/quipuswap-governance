const { MichelsonMap } = require("@taquito/michelson-encoder/");
// const { attachKind } = require("@taquito/taquito/dist/types/operations/types");
const { alice, bob, eve } = require("../../scripts/sandbox/accounts");

const { address } = require("../../scripts/sandbox/fa2_latest.json");

const proposalConfig = {
  proposal_stake: "4",
  voting_quorum: "4",
  support_quorum: "66",
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
  token_address: address,
  token_id: 0,
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
  token_address: address,
  token_id: 0,
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
  token_address: address,
  token_id: 0,
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
    collateral: 10,
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
    collateral: 10,
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
    collateral: 10,
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
    collateral: 10,
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
    collateral: 10,
  },
  5: {
    creator: alice.pkh,
    ipfs_link: w,
    forum_link: w,
    votes_for: "1",
    votes_against: "0",
    start_date: "2021-05-01T10:00:00Z",
    end_date: "2021-06-01T00:00:00Z",
    status: { voting: null },
    config: proposalConfig,
    collateral: 10,
  },
  6: {
    creator: alice.pkh,
    ipfs_link: w,
    forum_link: w,
    votes_for: "200",
    votes_against: "300",
    start_date: "2021-05-01T10:00:00Z",
    end_date: "2021-06-01T00:00:00Z",
    status: { voting: null },
    config: proposalConfig,
    collateral: 10,
  },
  7: {
    creator: alice.pkh,
    ipfs_link: w,
    forum_link: w,
    votes_for: "660",
    votes_against: "0",
    start_date: "2021-05-01T10:00:00Z",
    end_date: "2021-06-01T00:00:00Z",
    status: { voting: null },
    config: proposalConfig,
    collateral: 10,
  },
});

let votes = new MichelsonMap();
votes.set({ proposal: 5, voter: alice.pkh }, { for: 1 });

let balances = new MichelsonMap();
balances.set({ account: alice.pkh, proposal: 5 }, 1);
balances.set({ account: alice.pkh, proposal: 4 }, 11);

let locked_balances = {
  balances: balances,
  proposals: MichelsonMap.fromLiteral({
    tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb: [5, 4],
  }),
};

const withProposals = {
  owner: alice.pkh,
  id_count: "1",
  proposals: proposals,
  votes: votes,
  locked_balances: locked_balances,
  proposal_config: proposalConfig,
  pending_owner: null,
  temp_proposal_cache: MichelsonMap.fromLiteral({}),
  token_address: address,
  token_id: 0,
};

const storages = {
  defaultStorage: defaultStorage,
  withPendingOwnershipBob: withPendingOwnershipBob,
  withPendingOwnershipEve: withPendingOwnershipEve,
  withProposals: withProposals,
};

module.exports = { storages };
