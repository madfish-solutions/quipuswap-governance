type id_type            is nat
type vote_type          is
| For                   of nat
| Against               of nat

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
  support_quorum            : nat;
]

type settings_type      is
    Proposal_stake      of nat
  | Voting_quorum       of nat
  | Support_quorum      of nat

type proposal_config_type is [@layout:comb] record [
  proposal_stake            : nat;
  voting_quorum             : nat;
  support_quorum            : nat;
]

type proposal_setup_type is
    Setting                of settings_type
  | Config                 of proposal_config_type

type status_type is
    Pending
  | Banned
  | Voting
  | Underrated
  | Approved
  | Rejected
  | Activated

type proposal_type      is [@layout:comb] record [
  creator                 : address;
  ipfs_link               : bytes;
  forum_link              : bytes;
  votes_for               : nat;
  votes_against           : nat;
  start_date              : timestamp;
  end_date                : timestamp;
  status                  : status_type;
  config                  : proposal_config_type;
  fixed_supply            : nat;
]


type seconds_type       is int

type new_proposal_type  is [@layout:comb] record [
  ipfs_link               : bytes;
  forum_link              : bytes;
  voting_period           : seconds_type;
  deferral                : seconds_type;
]


type staker_key_type    is [@layout:comb] record [
  account                 : address;
  proposal                : id_type;
]

type staker_map_type is big_map(staker_key_type, nat)

type staker_proposals_type is big_map(address, set(nat))

type locked_balances_type is [@layout:comb] record [
  balances                : staker_map_type;
  proposals               : staker_proposals_type ;
]
type prop_cache_type is big_map(address, new_proposal_type)

type storage_type       is [@layout:comb] record [
  owner                   : address;
  id_count                : nat;
  proposals               : big_map(id_type, proposal_type);
  votes                   : big_map(voter_key_type, vote_type);
  locked_balances         : locked_balances_type;
  proposal_config         : proposal_config_type;
  pending_owner           : option (address);
  temp_proposal_cache     : prop_cache_type;
  qnot_address            : address;
]

type return is list (operation) * storage_type

type transfer_destination_type is [@layout:comb] record [
    to_                   : address;
    token_id              : nat;
    amount                : nat;
  ]
type transfer_param_type is [@layout:comb] record [
    from_                 : address;
    txs                   : list(transfer_destination_type);
  ]

type transfer_type      is list(transfer_param_type)

type receive_supply_type is record[
  total_supply          :nat
  ]

type get_supply_type    is contract(list(receive_supply_type))

const zero_address : address =
  ("tz1ZZZZZZZZZZZZZZZZZZZZZZZZZZZZNkiRg" : address);
