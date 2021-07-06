const min_proposal_period : seconds_type = 3 * 86_400;
const max_proposal_period : seconds_type = 30 * 86_400;
const max_deferral        : seconds_type = 30 * 86_400;

function get_total_supply(
  const new_prop        : new_proposal_type;
  var s                     : storage_type)
                        : return is
  block {
    s.temp_proposal_cache[Tezos.sender] := new_prop;
  } with (list[
    Tezos.transaction(
      get_callback(Tezos.self_address),
      0mutez,
      get_supply_entrypoint(qnot_address))
  ], s)

(* Create new proposal *)
function receive_reserves(
    const total_supply  : nat;
    var s               : storage_type)
                        : return is
  block {
    if Tezos.sender = qnot_address then skip
    else failwith("GOV/unknown-sender");
    const new_prop: new_proposal_type = get_prop_cache(Tezos.source, s);
    const updated_prop_cache : prop_cache_type =
      rem_prop_cache(Tezos.source, s.temp_proposal_cache);
    s.temp_proposal_cache := updated_prop_cache;

    if new_prop.voting_period >= min_proposal_period
    then skip
    else failwith("Gov/small-voting-perod");
    if new_prop.voting_period <= max_proposal_period
    then skip
    else failwith("Gov/long-voting-perod");
    var start_date : timestamp := Tezos.now;
    var end_date: timestamp := Tezos.now + new_prop.voting_period;
    var default_status := Voting;

    if new_prop.deferral = 0 then skip
    else {
      if new_prop.deferral > max_deferral then failwith("Gov/long-deferral")
      else {
        start_date := Tezos.now + new_prop.deferral;
        end_date := end_date + new_prop.deferral;
        default_status := Pending;
      };
    };

    s.proposals[s.id_count] := record [
      creator                 = Tezos.source;
      ipfs_link               = new_prop.ipfs_link;
      forum_link              = new_prop.forum_link;
      votes_for               = 0n;
      votes_against           = 0n;
      start_date              = start_date;
      end_date                = end_date;
      status                  = default_status;
      config                  = s.proposal_config;
      fixed_supply            = total_supply;
    ];

    s.id_count := s.id_count + 1n;

    (* Stake part *)
    const stake_amount : nat =
      total_supply * s.proposal_config.proposal_stake / 100n;

    const staker_key : staker_key_type = record [
      account           = Tezos.source;
      proposal          = abs(s.id_count - 1n);
    ];

    var balances : staker_map_type := s.locked_balances.balances;
    balances[staker_key] := stake_amount;
    s.locked_balances := s.locked_balances with record[
      balances = balances;
    ];

    const op : operation = Tezos.transaction(
      get_tx_param(Tezos.source, Tezos.self_address, stake_amount),
      0mutez,
      get_tranfer_contract(unit)
    );
  } with ((list[op] : list (operation)), s)


function add_vote(
  var vote              : new_vote_type;
  var s                 : storage_type)
                        : return is
  block {
    if Big_map.mem(vote.proposal, s.proposals)
    then skip
    else failwith("Gov/bad-proposal");

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

    var voters : voter_key_type := record [
      proposal          = vote.proposal;
      voter             = Tezos.sender;
    ];

    s.votes := Map.add(voters, vote.vote, s.votes);

    var votes : nat := 0n;
    case vote.vote of
      For (v) -> {
        proposal.votes_for := proposal.votes_for + v;
        votes := v;
      }
    | Against (v) -> {
        proposal.votes_against := proposal.votes_against + v;
        votes := v;
      }
    end;

    if proposal.status = Pending
    then proposal.status := Voting
    else skip;

    s.proposals[vote.proposal] := proposal;

    (* Stake part *)
    const staker_key : staker_key_type = record [
      account           = Tezos.sender;
      proposal          = vote.proposal;
    ];

    const locked_balance : nat = get_locked_balance(staker_key, s.locked_balances);
    var balances : staker_map_type := s.locked_balances.balances;

    balances[staker_key] := locked_balance + votes;
    s.locked_balances := s.locked_balances with record [
      balances = balances;
    ];

    const op : operation = Tezos.transaction(
      get_tx_param(Tezos.sender, Tezos.self_address, votes),
      0mutez,
      get_tranfer_contract(unit)
    );

  } with ((list[op] : list (operation)), s)


function claim(
  var s                 : storage_type)
                        : return is
  block {
    var user_props : set(id_type) := get_staker_proposals(Tezos.sender, s);
    var claim_amount : nat := 0n;
    for i in set user_props block {
      const proposal : proposal_type = get_proposal(i, s);
      const invalid_status = set[Pending; Voting];

      if Set.mem(proposal.status, invalid_status)
      then skip
      else {
        const staker_key : staker_key_type = record [
          account           = Tezos.sender;
          proposal          = i;
        ];

        const locked_balance : nat = get_locked_balance(staker_key, s.locked_balances);
        var balances : staker_map_type := s.locked_balances.balances;

        claim_amount := claim_amount + locked_balance;
        s.locked_balances.balances := rem_balance(staker_key, s.locked_balances.balances);
        user_props := Set.remove(i, user_props);
        s.locked_balances.proposals[Tezos.sender] := user_props;
      };
    };
    const op : operation = Tezos.transaction(
      get_tx_param(Tezos.self_address, Tezos.sender, claim_amount),
      0mutez,
      get_tranfer_contract(unit)
    );

  } with ((list[op] : list (operation)), s)


function finalize_voting(
  const prop_id         : id_type;
  var s                 : storage_type)
                        : storage_type is
  block {
    var proposal : proposal_type := get_proposal(prop_id, s);

    if proposal.status = Voting then skip
    else failwith("Gov/proposal-ended");

    if Tezos.now > proposal.end_date then skip
    else failwith("Gov/voting-period");
    const votes : nat = proposal.votes_for + proposal.votes_against;
    if ( votes >= proposal.config.voting_quorum * proposal.fixed_supply / 100n)
    then {
      if (votes >= proposal.config.support_quorum * votes / 100n)
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
    var proposal : proposal_type := get_proposal(prop_id, s);

    if proposal.status = Approved then skip
    else failwith("Gov/not-approved");

    proposal.status := Activated;
    s.proposals[prop_id] := proposal;
  } with s