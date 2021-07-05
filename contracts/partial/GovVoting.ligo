const min_proposal_period : seconds_type = 3 * 86_400;
const max_proposal_period : seconds_type = 30 * 86_400;
const max_deferral        : seconds_type = 30 * 86_400;

function new_proposal(
    const new_prop      : new_proposal_type;
    var s               : storage_type)
                        : storage_type is
  block {
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
      creator                 = Tezos.sender;
      ipfs_link               = new_prop.ipfs_link;
      forum_link              = new_prop.forum_link;
      votes_for               = 0n;
      votes_against           = 0n;
      start_date              = start_date;
      end_date                = end_date;
      status                  = default_status;
      config                  = s.proposal_config;
    ];

    s.id_count := s.id_count + 1n;

    (* Stake part *)
    // TODO
    const total_supply : nat = 10n;
    const stake_amount : nat =
      total_supply * s.proposal_config.proposal_stake / 100n;

    const staker_key : staker_key_type = record [
      account           = Tezos.sender;
      proposal          = abs(s.id_count - 1n);
    ];

    s.locked_balances[staker_key] := stake_amount;

    Tezos.transaction(
      get_tx_param(Tezos.self_address, stake_amount),
      0mutez,
      get_tranfer_contract(unit)
    );
  } with s


function add_vote(
  var vote              : new_vote_type;
  var s                 : storage_type)
                        : storage_type is
  block {
    if Big_map.mem(vote.proposal, s.proposals)
    then skip
    else failwith("Gov/bad-proposal");

    var proposal : proposal_type := getProposal(vote.proposal, s);

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
    s.proposals[vote.proposal] := proposal;

    if proposal.status = Pending
    then proposal.status := Voting
    else skip;

    (* Stake part *)
    const staker_key : staker_key_type = record [
      account           = Tezos.sender;
      proposal          = vote.proposal;
    ];

    const locked_balance : nat = get_locked_balance(staker_key, s);

    s.locked_balances[staker_key] := locked_balance + votes;

    Tezos.transaction(
      get_tx_param(Tezos.self_address, votes),
      0mutez,
      get_tranfer_contract(unit)
    );

  } with s ;
