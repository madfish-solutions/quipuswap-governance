function transfer_ownership(
  const new_owner       : option(address);
  var s                 : storage_type)
                        : storage_type is
  block {
    (* Check account permission *)
    is_owner(unit, s);

    (* Does not allow reassignment of the applicant *)
    if s.pending_owner = (None: option (address))
    then skip
    else failwith("Gov/no-pending-admin");

    (* Begins the process of transferring the ownership *)
    s.pending_owner := new_owner
  } with s

function take_ownership(
  var s                 : storage_type)
                        : storage_type is
  block {
    (* Validate new owner *)
    if Some(Tezos.sender) = s.pending_owner
    then skip
    else failwith("Gov/not-pending-owner");

    (* Appointment of a new owner *)
    s.pending_owner := (None: option (address));
    s.owner := Tezos.sender
  } with s

function cancel_transfer_ownership(
  var s                 : storage_type)
                        : storage_type is
  block {
     (* Check account permission *)
    is_owner(unit, s);

    if s.pending_owner =/= (None: option (address))
    then skip
    else failwith("Gov/no-pending-admin");

    (* Сancels the transfer of ownership *)
    s.pending_owner := (None: option (address));
  } with s

function set_proposal_setup(
  const new_setup       : proposal_setup_type;
  var s                 : storage_type)
                        : storage_type is
  block {
     (* Check account permission *)
    is_owner(unit, s);

    case new_setup.proposal of
      Id (v) -> {
        (* Validate  requested proposal *)
        if not(Big_map.mem(v, s.proposals))
        then failwith("Gov/bad-proposal")
        else {
          (* Update proposal config *)
          var _proposal : proposal_type := get_proposal(v, s);
          case new_setup.settings of
            Proposal_stake (val) -> _proposal := _proposal with record [
              config.proposal_stake = val
            ]
          | Voting_quorum (val) -> _proposal := _proposal with record [
              config.voting_quorum = val
            ]
          | Support_quorum (val) -> _proposal := _proposal with record [
              config.support_quorum = val
          ]
          end;
        }
      }
    | Null -> {
        (* Update global proposals config *)
        case new_setup.settings of
          Proposal_stake (v) -> s := s with record [
            proposal_config.proposal_stake = v
          ]
        | Voting_quorum (v) -> s := s with record [
            proposal_config.voting_quorum = v
          ]
        | Support_quorum (v) -> s := s with record [
            proposal_config.support_quorum = v
          ]
        end;
    }
  end
  } with s


function ban_proposal(
  const prop_id         : id_type;
  var s                 : storage_type)
                        : return is
  block {
    (* Check account permission *)
    is_owner(unit, s);

    (* Validate proposal *)
    var proposal : proposal_type := get_proposal(prop_id, s);
    if Big_map.mem(prop_id, s.proposals)
    then skip
    else failwith("Gov/no-proposal-id");

    if (proposal.status = Pending or proposal.status = Voting)
    then skip
    else failwith("Gov/bad-proposal-status");

    (* Blocks proposal *)
    proposal.status := Banned;
    s.proposals[prop_id] := proposal;

    (* Burning staked user qnots from proposal *)
    const staker_key : staker_key_type = record [
      account           = proposal.creator;
      proposal          = prop_id;
    ];

    const locked_balance : nat = get_locked_balance(staker_key, s.locked_balances);

    s.locked_balances.balances := rem_balance(staker_key, s.locked_balances.balances);
    var user_props : set(id_type) := get_staker_proposals(Tezos.sender, s);
    user_props := Set.remove(prop_id, user_props);
    s.locked_balances.proposals[proposal.creator] := user_props;

    const op : operation = transaction(
      get_tx_param(proposal.creator, zero_address, locked_balance),
      0mutez,
      get_tranfer_contract(s.qnot_address)
    );
  } with ((list[op] : list (operation)), s)