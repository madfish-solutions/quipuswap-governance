function transferOwnership (const new_owner: option(address); var s: storage) : storage is
  block {
    if Tezos.sender = s.owner then skip
    else failwith("This method is for the owner only");
    if s.pending_ownertranship_tranfer = (None: option (address)) then skip
    else failwith("You are already transferring ownership to someone");

    s.pending_ownertranship_tranfer := new_owner
  } with s

function takeOwnership (var s: storage) : storage is
  block {
     if Some(Tezos.sender) = s.pending_ownertranship_tranfer then skip
    else failwith("You are not claiming to be the owner of the contract");
    s.pending_ownertranship_tranfer := (None: option (address));
    s.owner := Tezos.sender
  } with s

function cancelTransferOwnership ( var s: storage ) : storage is
block {
  if Tezos.sender = s.owner then skip
  else failwith("This method is for the owner only");

  if s.pending_ownertranship_tranfer =/= (None: option (address)) then skip
  else failwith("You do not transfer ownership");

  s.pending_ownertranship_tranfer := (None: option (address));
} with s

function setProposalSetup (const param: proposal_setting; const value: nat; var s: storage) : storage is
block {
  if Tezos.sender = s.owner then skip
  else failwith("This method is for the owner only");

  case param of
      | RequiredProposalStake -> s := s with record[proposal_config.required_proposal_stake = value]
      | MinimalVotingQuorum -> s := s with record[proposal_config.minimal_voting_quorum = value]
      | MinimalApprovalQuorum -> s := s with record[proposal_config.minimal_approval_quorum = value]
  end;
} with s

type proposal is
record [
  ipfs_link: QIP;
  forum_link: QIP;
  votesFor: nat;
  votesAgainst: nat;
  start_date: timestamp;
  end_date: timestamp;
  status: status;
  config: proposal_config
]

const min_proposal_period: day = 3n;
const max_proposal_period: day = 30n;
function newProposal (const voting_period: day; var s : storage) : storage is
  block {
    if voting_period > min_proposal_period then skip
    else failwith("Minimum voting period 3 days");

    const end_date: timestamp = Tezos.now + days * 86_400;
    s.proposals[s.id_count] := record [
      votesFor =  0n;
      votesAgainst = 0n;
      end_date = end_date;
    ];

    s.id_count := s.id_count + 1n
  } with s