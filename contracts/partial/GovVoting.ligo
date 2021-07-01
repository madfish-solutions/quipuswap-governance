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
    else failwith("The voting period is over");

    if Tezos.now >= proposal.start_date
    then skip
    else failwith("Voting has not started yet");

    if proposal.status = Banned
    then failwith("This proposal has been blocked by the administrator")
    else skip;

    // TODO: check stake
    var voters : voter_key_type := record [
      proposal          = vote.proposal;
      voter             = Tezos.sender;
    ];

    s.votes := Map.add(voters, vote.vote, s.votes);
    case vote.vote of
      For -> proposal.votes_for := proposal.votes_for + 1n
    | Against -> proposal.votes_against := proposal.votes_against + 1n
    end;

    if proposal.status = Pending
    then proposal.status := Voting
    else skip;

    s.proposals[vote.proposal] := proposal
  } with s
