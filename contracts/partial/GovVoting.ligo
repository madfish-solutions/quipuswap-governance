const min_proposal_period : seconds_type = 3n;
const max_proposal_period : seconds_type = 30n;
const max_deferral        : seconds_type = 30n;

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

    const end_date: timestamp = Tezos.now + new_prop.voting_period * 86_400;
    s.proposals[s.id_count] := record [
      ipfs_link = new_prop.ipfs_link;
      forum_link = new_prop.forum_link;
      votes_for = 0n;
      votes_against = 0n;
      start_date = Tezos.now;
      end_date = end_date;
      status =  Voting;
      config = s.proposal_config;
    ];

    s.id_count := s.id_count + 1n
  } with s

// function new_deferred_proposal(
//     const ipfs_link     : bytes;
//     const forum_link    : bytes;
//     const voting_period : day;
//     const deferral      : day;
//     var s               : storage)
//                         : storage is
//   block {
//     if voting_period >= min_proposal_period
//     then skip
//     else failwith("Gov/small-voting-perod");
//     if voting_period <= max_proposal_period
//     then skip
//     else failwith("Gov/long-voting-perod");
//     if deferral <= max_deferral
//     then skip
//     else failwith("Gov/long-voting-perod");

//     const start_date : timestamp = Tezos.now + deferral * 86_400;
//     const end_date :  timestamp = (Tezos.now + deferral * 86_400) +
//       voting_period * 86_400;
//     s.proposals[s.id_count] := record [
//       ipfs_link         = ipfs_link;
//       forum_link        = forum_link;
//       votes_for         = 0n;
//       votes_against     = 0n;
//       start_date        = start_date;
//       end_date          = end_date;
//       status            = Pending;
//       config            = s.proposal_config;
//     ];

//     s.id_count := s.id_count + 1n
// } with s

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
