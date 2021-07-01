type id                 is nat
type day                is nat
type vote               is
| For
| Against

type voter_key          is [@layout:comb] record [
  proposal                : id;
  voter                   : address;
]
type new_vote           is [@layout:comb] record [
  proposal                : id;
  vote                    : vote;
]

type proposal_config    is [@layout:comb] record [
  proposal_stake          : nat;
  voting_quorum           : nat;
  support_quorum          : nat
]

type settings           is
    Proposal_stake      of nat
  | Voting_quorum       of nat
  | Support_quorum      of nat

type proposal_setup     is [@layout:comb] record [
  settings                : settings;
  proposal                : nat;
]

type status is
    Pending
  | Banned
  | Voting
  | Underrated
  | Approved
  | Rejected
  | Activated

type proposal           is [@layout:comb] record [
  ipfs_link               : bytes;
  forum_link              : bytes;
  votes_for               : nat;
  votes_against           : nat;
  start_date              : timestamp;
  end_date                : timestamp;
  status                  : status;
  config                  : proposal_config
]

type ipfs_link          is bytes
type forum_link         is bytes
type seconds            is nat
type new_proposal       is [@layout:comb] record [
  ipfs_link               : bytes;
  forum_link              : bytes;
  voting_period           : seconds;
  deferral_period         : seconds;
]
type deferral           is day

type storage            is [@layout:comb] record [
  owner                   : address;
  id_count                : nat;
  proposals               : big_map(id, proposal);
  votes                   : big_map(voter_key, vote);
  proposal_config         : proposal_config;
  pending_owner           : option (address)
]

type return is list (operation) * storage

