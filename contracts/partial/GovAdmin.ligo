function transfer_ownership(
  const new_owner       : option(address);
  var s                 : storage_type)
                        : storage_type is
  block {
    (* Check account permission *)
    is_owner(s);

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
    is_owner(s);

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
    is_owner(s);

    case new_setup of
    (* Update a specific parameter *)
      Setting (param) -> {
        case param of
          Proposal_stake (v) -> {
            check_set_value(v, s);
            s := s with record [
              proposal_config.proposal_stake = v
            ]
          }
        | Voting_quorum (v) -> {
            check_set_value(v, s);
            s := s with record [
              proposal_config.voting_quorum = v
            ]
          }
        | Support_quorum (v) -> {
          check_set_value(v, s);
          s := s with record [
            proposal_config.support_quorum = v
          ]
        }
        end;
      }
    (* Update full config *)
    | Config (new_config) -> {
      check_config(new_config, s);
      s.proposal_config := new_config
    }
  end
  } with s


function ban_proposal(
  const prop_id         : id_type;
  var s                 : storage_type)
                        : return is
  block {
    (* Check account permission *)
    is_owner(s);

    (* Validate proposal *)
    var proposal : proposal_type := get_proposal(prop_id, s);

    if proposal.status = Pending or proposal.status = Voting
    then skip
    else failwith("Gov/bad-proposal-status");

    (* Blocks proposal *)
    proposal.status := Banned;
    s.proposals[prop_id] := proposal;

    (* Burning staked user qnots from proposal *)
    const op : operation = Tezos.transaction(
      get_tx_param(proposal.creator, zero_address, s.token_id, proposal.collateral),
      0mutez,
      get_tranfer_contract(s.token_address)
    );
  } with (list[op], s)