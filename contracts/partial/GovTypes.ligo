type id_type            is nat
type vote_type          is
| For
| Against

type voter_key_type     is [@layout:comb] record [
  proposal                : id_type;
  voter                   : address;
]
type new_vote_type      is [@layout:comb] record [
  proposal                : id_type;
  vote                    : vote_type;
]

type proposal_config_type is [@layout:comb] record [
  proposal_stake            : nat;
  voting_quorum             : nat;
  support_quorum            : nat
]

type settings_type      is
    Proposal_stake      of nat
  | Voting_quorum       of nat
  | Support_quorum      of nat

type proposal_setup_type is [@layout:comb] record [
  settings                 : settings_type;
  proposal                 : nat;
]

type status_type is
    Pending
  | Banned
  | Voting
  | Underrated
  | Approved
  | Rejected
  | Activated

type proposal_type      is [@layout:comb] record [
  ipfs_link               : bytes;
  forum_link              : bytes;
  votes_for               : nat;
  votes_against           : nat;
  start_date              : timestamp;
  end_date                : timestamp;
  status                  : status_type;
  config                  : proposal_config_type
]


type seconds_type       is nat

type new_proposal_type  is [@layout:comb] record [
  ipfs_link               : bytes;
  forum_link              : bytes;
  voting_period           : seconds_type;
  deferral_period         : seconds_type;
]


type storage_type       is [@layout:comb] record [
  owner                   : address;
  id_count                : nat;
  proposals               : big_map(id_type, proposal_type);
  votes                   : big_map(voter_key_type, vote_type);
  proposal_config         : proposal_config_type;
  pending_owner           : option (address)
]

type return is list (operation) * storage_type

