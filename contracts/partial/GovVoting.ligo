const min_proposal_period : seconds_type = 3n * 86_400n;
const max_proposal_period : seconds_type = 30n * 86_400n;
const max_deferral        : seconds_type = 30n * 86_400n;

function get_total_supply(
  const new_prop        : new_proposal_type;
  var s                 : storage_type)
                        : return is
  block {
    s.expected_sender := Some(Tezos.sender);
    s.temp_proposal_cache := Some(new_prop);
    const op : operation = Tezos.transaction(
      (s.token_id, get_callback(Tezos.self_address)),
      0mutez,
      get_supply_entrypoint(s.token_address)
    );
  } with (list[op], s)

(* Create new proposal *)
function receive_supply(
    const total_supply  : receive_supply_type;
    var s               : storage_type)
                        : return is
  block {
    // (* Validate response *)
    if total_supply > 0n then skip
    else failwith("Gov/bad-supply-response");

    (* Validate sender response*)
    if Tezos.sender = s.token_address then skip
    else failwith("Gov/unknown-sender");

    const expected_sender : address = get_expected_sender(s);
    s.expected_sender := (None: option(address));

    const new_prop: new_proposal_type = get_prop_cache(s);

    (* Clears temp cache *)
    s.temp_proposal_cache := (None: option(new_proposal_type));

    (* Validate proposal setup *)
    if new_prop.voting_period >= min_proposal_period
    then skip
    else failwith("Gov/small-voting-perod");
    if new_prop.voting_period <= max_proposal_period
    then skip
    else failwith("Gov/long-voting-perod");
    if new_prop.deferral > max_deferral
    then failwith("Gov/long-deferral")
    else skip;
    var start_date : timestamp := Tezos.now + int(new_prop.deferral);
    var end_date: timestamp := Tezos.now + int(new_prop.voting_period + new_prop.deferral);
    var default_status := if new_prop.deferral = 0n then Voting else Pending;

    (* Add proposal for future claim *)
    var staker_proposals : set(nat) := get_staker_proposals(expected_sender, s);
    s.user_proposals[expected_sender] := Set.add(s.id_count, staker_proposals);

    const collateral_amount : nat =
      total_supply * s.proposal_config.proposal_stake / s.accuracy;

    (* Create new proposal *)
    s.proposals[s.id_count] := record [
      creator                 = expected_sender;
      ipfs_link               = new_prop.ipfs_link;
      forum_link              = new_prop.forum_link;
      votes_for               = 0n;
      votes_against           = 0n;
      start_date              = start_date;
      end_date                = end_date;
      status                  = default_status;
      config                  = s.proposal_config;
      collateral              = collateral_amount;
    ];

    s.id_count := s.id_count + 1n;

    (* Stake qnots *)

    const op : operation = Tezos.transaction(
      get_tx_param(expected_sender, Tezos.self_address, s.token_id, collateral_amount),
      0mutez,
      get_tranfer_contract(s.token_address)
    );
  } with (list[op], s)

function add_vote(
  var vote              : new_vote_type;
  var s                 : storage_type)
                        : return is
  block {
    (* Validate requsted proposal *)
    var proposal : proposal_type := get_proposal(vote.proposal, s);

    if Tezos.now < proposal.end_date
    then skip
    else failwith("Gov/voting-over");

    if Tezos.now >= proposal.start_date
    then skip
    else failwith("Gov/voting-not-started");

    if proposal.status = Banned
    then failwith("Gov/proposal-banned")
    else skip;

    (* Update proposal votes *)
    const voter_key : voter_key_type = record [
      proposal          = vote.proposal;
      voter             = Tezos.sender;
    ];

    const old_votes : nat = get_user_votes(voter_key, s);

    (* remove old votes *)
    case s.votes[voter_key] of
      Some (vote) ->
        case vote of
          For (ov)-> {
            proposal.votes_for := abs(proposal.votes_for - ov);
          }
        | Against (ov) -> {
            proposal.votes_against := abs(proposal.votes_against - ov);
          }
        end
      | None -> skip
    end;

    (* add new votes *)
    var votes : nat := 0n;
    case vote.vote of
        For (nv) -> {
          votes := nv;
          proposal.votes_for := proposal.votes_for + old_votes + nv;
          s.votes[voter_key] := For(old_votes + nv);
        }
      | Against (nv) -> {
          votes := nv;
          proposal.votes_against := proposal.votes_against + old_votes + nv;
          s.votes[voter_key] := Against(old_votes + nv);
        }
    end;
    
    (* Сhanges the status of the proposal to
    "Voting" if the status was not updated earlier *)
    if proposal.status = Pending
    then proposal.status := Voting
    else skip;

    s.proposals[vote.proposal] := proposal;

    (* Add proposal for future claim *)
    var staker_proposals : set(nat) := get_staker_proposals(Tezos.sender, s);
    if Set.mem(vote.proposal, staker_proposals) then skip
    else {
      s.user_proposals[Tezos.sender] := Set.add(vote.proposal, staker_proposals);
    };

    const op : operation = Tezos.transaction(
      get_tx_param(Tezos.sender, Tezos.self_address, s.token_id, votes),
      0mutez,
      get_tranfer_contract(s.token_address)
    );

  } with (list[op], s)

function claim(
  const proposal_id     : id_type;
  var s                 : storage_type)
                        : return is
  block {
    var claim_amount : nat := 0n;
    const proposal : proposal_type = get_proposal(proposal_id, s);
    (* Validate proposal status *)
    if proposal.status = Pending
    then skip
    else {
      if Tezos.now > proposal.end_date or proposal.status = Banned
      then {
        (* Receiving blocked account QNOTs *)
        const voter_key : voter_key_type = record [
          voter            = Tezos.sender;
          proposal         = proposal_id;
        ];

        const locked_tokens : nat = get_user_votes(
          voter_key, s);

        (* Deletes records of blocked QNOTs*)
        var user_props : set(id_type) := get_staker_proposals(Tezos.sender, s);
        if locked_tokens = 0n then skip
        else {
          claim_amount := claim_amount + locked_tokens;
          user_props := Set.remove(proposal_id, user_props);
        };

        if Tezos.sender = proposal.creator and not(proposal.status = Banned)
        then {
          claim_amount := claim_amount + proposal.collateral;
          user_props := Set.remove(proposal_id, user_props);

        } else skip;

        s.user_proposals[Tezos.sender] := user_props;
      } else skip;
    };
    if claim_amount > 0n then skip
    else failwith("Gov/no-claim");
    const op : operation = Tezos.transaction(
      get_tx_param(Tezos.self_address, Tezos.sender,  s.token_id, claim_amount),
      0mutez,
      get_tranfer_contract(s.token_address)
    );

  } with (list[op], s)

// function claim(
//   var s                 : storage_type)
//                         : return is
//   block {
//     (* Iterates over set prop id and writes unlocked qnot amount for claim *)
//     var claim_amount : nat := 0n;
//     for i in set get_staker_proposals(Tezos.sender, s) block {
//       const proposal : proposal_type = get_proposal(i, s);

//       (* Validate proposal status *)
//       if proposal.status = Pending
//       then skip
//       else {
//         if Tezos.now > proposal.end_date or proposal.status = Banned
//         then {
//           (* Receiving blocked account QNOTs *)
//           const voter_key : voter_key_type = record [
//             voter            = Tezos.sender;
//             proposal         = i;
//           ];

//           const locked_tokens : nat = get_user_votes(
//             voter_key, s);

//           (* Deletes records of blocked QNOTs*)
//           var user_props : set(id_type) := get_staker_proposals(Tezos.sender, s);
//           if locked_tokens = 0n then skip
//           else {
//             claim_amount := claim_amount + locked_tokens;
//             user_props := Set.remove(i, user_props);
//           };

//           if Tezos.sender = proposal.creator and not(proposal.status = Banned)
//           then {
//             claim_amount := claim_amount + proposal.collateral;
//             user_props := Set.remove(i, user_props);

//           } else skip;

//           s.user_proposals[Tezos.sender] := user_props;
//         } else skip;
//       };
//     };
//     if claim_amount > 0n then skip
//     else failwith("Gov/no-claim");
//     const op : operation = Tezos.transaction(
//       get_tx_param(Tezos.self_address, Tezos.sender,  s.token_id, claim_amount),
//       0mutez,
//       get_tranfer_contract(s.token_address)
//     );

//   } with (list[op], s)
function finalize_voting(
  const prop_id         : id_type;
  var s                 : storage_type)
                        : storage_type is
  block {
    (* Validate proposal *)
    var proposal : proposal_type := get_proposal(prop_id, s);

    if proposal.status = Voting
      or proposal.status = Pending
    then skip
    else failwith("Gov/not-voting-period");

    if Tezos.now > proposal.end_date then skip
    else failwith("Gov/voting-not-over");
    const votes : nat = proposal.votes_for + proposal.votes_against;

    (* Сalculation of voting results *)
    const last_supply : nat = proposal.collateral * s.accuracy / proposal.config.proposal_stake;
    if votes >= proposal.config.voting_quorum * last_supply / s.accuracy
    then {
      if proposal.votes_for >= proposal.config.support_quorum * votes / s.accuracy
      then proposal.status := Approved;
      else proposal.status := Rejected;
    } else proposal.status := Underrated;

    s.proposals[prop_id] := proposal;
  } with s

 function activate_proposal(
  const prop_id         : id_type;
  var s                 : storage_type)
                        : storage_type is
  block {
     (* Check account permission *)
    is_owner(s);

    (* Validate proposal status *)
    var proposal : proposal_type := get_proposal(prop_id, s);
    if proposal.status = Approved then skip
    else failwith("Gov/not-approved");

    (* Activated proposal *)
    proposal.status := Activated;
    s.proposals[prop_id] := proposal;
  } with s
