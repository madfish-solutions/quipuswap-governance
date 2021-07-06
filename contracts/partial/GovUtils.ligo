function get_proposal(
    const prop_id       : id_type;
    const s             : storage_type)
                        : proposal_type is
  case s.proposals[prop_id] of
    None -> record [
      creator           = zero_address;
      ipfs_link         = 0x7070;
      forum_link        = 0x7070;
      votes_for         = 0n;
      votes_against     = 0n;
      start_date        = ("2000-01-01T10:10:10Z" : timestamp);
      end_date          = ("2000-01-01T10:10:10Z" : timestamp);
      status            = Pending;
      config            = record[
          proposal_stake =10n;
          voting_quorum = 10n;
          support_quorum = 10n;
        ]
  ]
  | Some(proposal) -> proposal
  end


function get_locked_balance(
    const staker_key      : staker_key_type;
    const locked_balances : locked_balances_type)
                          : nat is
  case locked_balances.balances[staker_key] of
    None -> 0n
  | Some(v) -> v
  end

function get_staker_proposals (
  const addr            : address;
  const s               : storage_type)
                        : set(nat) is
  case s.locked_balances.proposals[addr] of
    None -> (set[] : set(nat))
  | Some(v) -> v
  end

function get_tx_param(
    const from_         : address;
    const to_           : address;
    const value         : nat)
                        : list(transfer_param_type) is
  block {
    const transfer_destination : transfer_destination_type = record [
      to_               = to_;
      token_id          = 0n;
      amount            = value;
    ];
    const transfer_param : transfer_param_type = record [
      from_             = from_;
      txs               = list[transfer_destination];
    ];
  } with list[transfer_param]



function rem_balance (
  const key             : staker_key_type;
  var s                 : staker_map_type)
                        : staker_map_type is
  block {
    remove key from map s
  } with s


function get_tranfer_contract(const _unit : unit) : contract(transfer_type) is
  case (Tezos.get_entrypoint_opt("%transfer", qnot_address) : option(contract(transfer_type))) of
    Some(contr) -> contr
    | None -> (failwith("Gov/not-token") : contract(transfer_type))
  end;


(* helper to get the entrypoint of current contract *)
function get_callback(
  const token_address   : address)
                        : contract (receive_reserves_type) is
  case (Tezos.get_entrypoint_opt(
    "%receiveReserves",
    token_address)      : option(contract(receive_reserves_type))) of
    Some(contr) -> contr
  | None -> (failwith("Gov/not-qnot") : contract(receive_reserves_type))
  end;


(* helper to get the entrypoint of Qnot contract *)
function get_supply_entrypoint(
  const qnot_address    : address)
                        : contract(get_supply_type) is
  case (Tezos.get_entrypoint_opt(
    "%total_supply",
    qnot_address) : option(contract(get_supply_type))) of
    Some(contr) -> contr
  | None -> (failwith("Gov/not-qnot") : contract(get_supply_type))
  end;

function get_prop_cache(
    const creator       : address;
    const s             : storage_type)
                        : new_proposal_type is
  case s.temp_proposal_cache[creator] of
    None -> failwith("Gov/not-creator")
  | Some(v) -> v
  end

function rem_prop_cache (
  const creator         : address;
  var prop_cache        : prop_cache_type)
                        : prop_cache_type is
  block {
    remove creator from map prop_cache
  } with prop_cache

