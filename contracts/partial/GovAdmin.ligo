function transfer_ownership(
  const new_owner       : option(address);
  var s                 : storage)
                        : storage is
  block {
    if Tezos.sender = s.owner
    then skip
    else failwith("Gov/not-owner");

    if s.pending_owner = (None: option (address))
    then skip
    else failwith("Gov/no-pending-admin");

    s.pending_owner := new_owner
  } with s

function take_ownership(
  var s                 : storage)
                        : storage is
  block {
    if Some(Tezos.sender) = s.pending_owner
    then skip
    else failwith("Gov/not-pending-owner");
    s.pending_owner := (None: option (address));
    s.owner := Tezos.sender
  } with s

function cancel_transfer_ownership(
  var s                 : storage)
                        : storage is
  block {
    if Tezos.sender = s.owner
    then skip
    else failwith("Gov/not-owner");

    if s.pending_owner =/= (None: option (address))
    then skip
    else failwith("Gov/no-pending-admin");

    s.pending_owner := (None: option (address));
  } with s

function set_proposal_setup(
  const param           : settings;
  const value           : nat;
  var s                 : storage)
                        : storage is
  block {
    if Tezos.sender = s.owner
    then skip
    else failwith("Gov/not-owner");

    case param of
      Proposal_stake -> s := s with record [
          proposal_config.proposal_stake = value
        ]
    | Voting_quorum -> s := s with record [
          proposal_config.voting_quorum = value
        ]
    | Support_quorum -> s := s with record [
          proposal_config.support_quorum = value
        ]
    end;
  } with s

function ban_proposal(
  const prop_id         : id;
  var s                 : storage)
                        : storage is
  block {
    if Tezos.sender = s.owner
    then skip
    else failwith("Gov/not-owner");

    var proposal : proposal := getProposal(prop_id, s);

    if Big_map.mem(prop_id, s.proposals)
    then skip
    else failwith("Gov/no-proposal-id");

    if (proposal.status = Pending or proposal.status = Voting)
    then skip
    else failwith("Gov/bad-proposal-status");

    proposal.status := Banned;
    s.proposals[prop_id] := proposal;

    // TODO burn tokens

  } with s