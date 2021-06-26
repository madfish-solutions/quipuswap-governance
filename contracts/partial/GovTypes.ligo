type id is nat
type day is nat
type vote is
| For
| Against

type voter is (id * address)
type new_vote is (id * vote)

type proposal_config is
record [
  required_proposal_stake: nat;
  minimal_voting_quorum: nat;
  minimal_approval_quorum: nat
]

type proposal_setting is
  | Required_proposal_stake
  | Minimal_voting_quorum
  | Minimal_approval_quorum

type proposal_setup is (proposal_setting * nat)

type status is
  | Pending
  | Banned
  | Voting
  | Underrated
  | Approved
  | Rejected
  | Activated

type proposal is
record [
  ipfs_link: bytes;
  forum_link: bytes;
  votes_for: nat;
  votes_against: nat;
  start_date: timestamp;
  end_date: timestamp;
  status: status;
  config: proposal_config
]

type ipfs_link is bytes
type forum_link is bytes
type voting_period is day
type new_proposal is (ipfs_link * forum_link * voting_period)
type deferral is day

type new_deferred_proposal is (ipfs_link * forum_link * voting_period * deferral)
type storage is
record [
  owner: address;
  id_count: nat;
  proposals: big_map(id, proposal);
  votes: big_map(voter, vote);
  proposal_config: proposal_config;
  pending_ownership_tranfer: option (address)

]

type return is list (operation) * storage

