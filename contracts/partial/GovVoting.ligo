const min_proposal_period : day = 3n;
const max_proposal_period : day = 30n;
const max_deferral : day = 30n;

function newProposal (
    const ipfs_link : bytes;
    const forum_link: bytes;
    const voting_period: day;
    var s : storage) : storage is
  block {
    if voting_period >= min_proposal_period then skip
    else failwith("Minimum voting period 3 days");
    if voting_period <= max_proposal_period then skip
    else failwith("Maxium voting period 30 days");

    const end_date: timestamp = Tezos.now + voting_period * 86_400;
    s.proposals[s.id_count] := record [
      ipfs_link = ipfs_link;
      forum_link = forum_link;
      votes_for = 0n;
      votes_against = 0n;
      start_date = Tezos.now;
      end_date = end_date;
      status =  Voting;
      config = s.proposal_config;
    ];

    s.id_count := s.id_count + 1n
  } with s

function newDeferredProposal (
    const ipfs_link : bytes;
    const forum_link: bytes;
    const voting_period: day;
    const deferral: day;
    var s : storage) : storage is
  block {
    if voting_period >= min_proposal_period then skip
    else failwith("Minimum voting period 3 days");
    if voting_period <= max_proposal_period then skip
    else failwith("Maxium voting period 30 days");
    if deferral <= max_deferral then skip
    else failwith("Deferral can't be longer than 30 days");

    const start_date : timestamp = Tezos.now + deferral * 86_400;
    const end_date :  timestamp = (Tezos.now + deferral * 86_400) + voting_period * 86_400;
    s.proposals[s.id_count] := record [
      ipfs_link = ipfs_link;
      forum_link = forum_link;
      votes_for = 0n;
      votes_against = 0n;
      start_date = start_date;
      end_date = end_date;
      status =  Pending;
      config = s.proposal_config;
    ];

    s.id_count := s.id_count + 1n
} with s

function addVote (const prop_id: id; const new_vote: vote; var s: storage) : storage is
  block {
    if Big_map.mem(prop_id, s.proposals) then skip
    else failwith("Invalid proposal id");

    var proposal : proposal := getProposal(prop_id, s);

    if Tezos.now < proposal.end_date then skip
    else failwith("The voting period is over");

    if Tezos.now >= proposal.start_date then skip
    else failwith("Voting has not started yet");

    if proposal.status = Banned then failwith("This proposal has been blocked by the administrator")
    else skip;

    if not(Map.mem((prop_id, Tezos.sender), s.votes)) then skip
    else failwith("You have already voted for this proposal");

    // TODO: check stake

    s.votes := Map.add((prop_id, (Tezos.sender: address)), new_vote, s.votes);
    case new_vote of
        | For -> proposal.votes_for := proposal.votes_for + 1n
        | Against -> proposal.votes_against := proposal.votes_against + 1n
    end;

    if proposal.status = Pending then proposal.status := Voting
    else skip;

    s.proposals[prop_id] := proposal
    } with s
