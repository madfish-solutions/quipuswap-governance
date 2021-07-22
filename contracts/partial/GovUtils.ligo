(* Helper to get proposal *)
function get_proposal(
    const prop_id       : id_type;
    const s             : storage_type)
                        : proposal_type is
  case s.proposals[prop_id] of
    None -> failwith("Gov/not-prop-id")
  | Some(proposal) -> proposal
  end

function get_user_votes (
  const voter_key       : voter_key_type;
  const s               : storage_type)
                        : nat is
  case s.votes[voter_key] of

  | None -> 0n
  | Some (vote) ->
      case vote of
        For (v)-> v
      | Against (v) -> v
      end
  end

function check_votes(
    const votes           : vote_type)
                          : unit is
  block {
  const votes_count = case votes of
    For (v) -> v
  | Against (v) -> v
  end;

  if votes_count > 0n then skip
  else failwith("Gov/no-votes")

} with unit



function get_staker_proposals (
  const addr            : address;
  const s               : storage_type)
                        : set(nat) is
  case s.user_proposals[addr] of
    None -> (set[] : set(nat))
  | Some(v) -> v
  end

(* Create tranfer tx param *)
function get_tx_param(
    const from_         : address;
    const to_           : address;
    const token_id      : nat;
    const value         : nat)
                        : list(transfer_param_type) is
  block {
    const transfer_destination : transfer_destination_type = record [
      to_               = to_;
      token_id          = token_id;
      amount            = value;
    ];
    const transfer_param : transfer_param_type = record [
      from_             = from_;
      txs               = list[transfer_destination];
    ];
  } with list[transfer_param]


(* Remove staked user qnots *)
// function rem_balance (
//   const key             : staker_key_type;
//   var s                 : staker_map_type)
//                         : staker_map_type is
//   block {
//     remove key from map s
//   } with s


function get_tranfer_contract(
  const qnot_address    : address)
                        : contract(transfer_type) is
  case (Tezos.get_entrypoint_opt("%transfer", qnot_address) : option(contract(transfer_type))) of
    Some(contr) -> contr
    | None -> failwith("Gov/not-token")
  end;



(* Helper to get the entrypoint of current contract *)
function get_callback(
  const token_address   : address)
                        : contract(receive_supply_type) is
  case (Tezos.get_entrypoint_opt(
    "%receive_supply",
    token_address)      : option(contract(receive_supply_type))) of
    Some(contr) -> contr
  | None -> failwith("Gov/not-callback")
  end;

(* Helper to get the entrypoint of Qnot contract *)
function get_supply_entrypoint(
  const token_address   : address)
                        : contract(get_supply_type) is
  case (Tezos.get_entrypoint_opt(
    "%get_total_supply",
    token_address) : option(contract(get_supply_type))) of
    Some(contr) -> contr
    | None -> failwith("Gov/not-qnot")
  end;


(* Helper to get proposal cache *)
function get_prop_cache(
    const s             : storage_type)
                        : new_proposal_type is
  case s.temp_proposal_cache of
    None -> failwith("Gov/not-creator")
  | Some(v) -> v
  end


function is_owner (
  const s               : storage_type)
                        : unit is
block{
  if Tezos.sender = s.owner then skip
  else failwith("Gov/not-owner");
} with unit

function get_expected_sender(
  const s               : storage_type)
                        : address is
  case s.expected_sender of
    Some (v) -> v
  | None -> failwith("Gov/not-sender")
  end

function check_set_value (
  const value           : nat;
  const s               : storage_type)
                        : unit is
block {
  if value <= 100n * s.accuracy then skip
  else failwith("Gov/invalid-param-value")
} with unit

function check_config (
  const config          : proposal_config_type;
  const s               : storage_type)
                        : unit is
block {
  const max_value : nat = 100n * s.accuracy;
  if config.proposal_stake <= max_value
  and config.voting_quorum  <= max_value
  and config.support_quorum <= max_value
  then skip
  else failwith("Gov/invalid-param-value");
} with unit
