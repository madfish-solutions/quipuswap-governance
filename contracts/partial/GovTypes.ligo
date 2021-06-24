type id is nat;

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
  | RequiredProposalStake
  | MinimalVotingQuorum
  | MinimalApprovalQuorum

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
  ipfs_link: QIP;
  forum_link: QIP;
  votesFor: nat;
  votesAgainst: nat;
  start_date: timestamp;
  end_date: timestamp;
  status: status;
  config: proposal_config
]

type storage is
record [
  owner: address;
  id_count: nat;
  proposals: big_map(id, proposal);
  votes: big_map(voter, vote);
  proposal_config: proposal_config;
  pending_ownertranship_tranfer: option (address)

]

type return is list (operation) * storage

