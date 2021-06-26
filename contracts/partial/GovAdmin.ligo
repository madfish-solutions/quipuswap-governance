function transferOwnership (const new_owner: option(address); var s: storage) : storage is
  block {
    if Tezos.sender = s.owner then skip
    else failwith("This method is for the owner only");
    if s.pending_ownership_tranfer = (None: option (address)) then skip
    else block{
      if s.pending_ownership_tranfer = new_owner then
      failwith("You are already transferring ownership to this account")
      else failwith("You are already transferring ownership to someone");
    };

    s.pending_ownership_tranfer := new_owner
  } with s

function takeOwnership (var s: storage) : storage is
  block {
    if Some(Tezos.sender) = s.pending_ownership_tranfer then skip
    else failwith("You are not claiming to be the owner of the contract");
    s.pending_ownership_tranfer := (None: option (address));
    s.owner := Tezos.sender
  } with s

function cancelTransferOwnership ( var s: storage ) : storage is
block {
  if Tezos.sender = s.owner then skip
  else failwith("This method is for the owner only");

  if s.pending_ownership_tranfer =/= (None: option (address)) then skip
  else failwith("You do not transfer ownership");

  s.pending_ownership_tranfer := (None: option (address));
} with s

function setProposalSetup (const param: proposal_setting; const value: nat; var s: storage) : storage is
block {
  if Tezos.sender = s.owner then skip
  else failwith("This method is for the owner only");

  case param of
      | Required_proposal_stake -> s := s with record[proposal_config.required_proposal_stake = value]
      | Minimal_voting_quorum -> s := s with record[proposal_config.minimal_voting_quorum = value]
      | Minimal_approval_quorum -> s := s with record[proposal_config.minimal_approval_quorum = value]
  end;
} with s

function banProposal (const prop_id: id; var s: storage ) : storage is
block {
  if Tezos.sender = s.owner then skip
  else failwith("This method is for the owner only");

  var proposal : proposal := getProposal(prop_id, s);

  if Big_map.mem(prop_id, s.proposals) then skip
  else failwith("Invalid proposal id");

  if (proposal.status = Pending or proposal.status = Voting) then skip
  else failwith("Proposal is already completed or blocked");

  proposal.status := Banned;
  s.proposals[prop_id] := proposal;

  // TODO burn tokens

} with s