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
  support_quorum            : nat
]

type settings_type      is
    Proposal_stake      of nat
  | Voting_quorum       of nat
  | Support_quorum      of nat

type some_proposal_type is
    Id                  of nat
  | Null                of unit

type proposal_setup_type is [@layout:comb] record [
  settings                 : settings_type;
  proposal                 : some_proposal_type;
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
  creator                 : address;
  ipfs_link               : bytes;
  forum_link              : bytes;
  votes_for               : nat;
  votes_against           : nat;
  start_date              : timestamp;
  end_date                : timestamp;
  status                  : status_type;
  config                  : proposal_config_type
]


type seconds_type       is int

type new_proposal_type  is [@layout:comb] record [
  ipfs_link               : bytes;
  forum_link              : bytes;
  voting_period           : seconds_type;
  deferral                : seconds_type;
]

// type proposal_stake_type is [@layout:comb] record [
//   proposal                : id_type;
//   amount                  : nat;
// ]


// type locked_balance_type is [@layout:comb] record [
//   proposals               : set(proposal_stake_type);
//   tvl                     : nat;
//   claim                   : nat;
// ]

type staker_key_type    is [@layout:comb] record [
  account                 : address;
  proposal                : id_type;
]

type locked_balances_type is big_map(staker_key_type, nat)

type storage_type       is [@layout:comb] record [
  owner                   : address;
  id_count                : nat;
  proposals               : big_map(id_type, proposal_type);
  votes                   : big_map(voter_key_type, vote_type);
  locked_balances         : locked_balances_type;
  proposal_config         : proposal_config_type;
  pending_owner           : option (address)
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


type transfer_type is list(transfer_param_type)

[@inline] const zero_address : address =
  ("tz1ZZZZZZZZZZZZZZZZZZZZZZZZZZZZNkiRg" : address);
[@inlune] const qnot_address : address =
("tz1ZZZZZZZZZZZZZZZZZZZZZZZZZZZZNkiRg" : address);