function getProposal(const prop_id : id; const s : storage) : proposal is
case s.proposals[prop_id] of None -> record [
    votesFor =  0n;
    votesAgainst = 0n;
    end_date = ("2000-01-01T10:10:10Z" : timestamp)
]
| Some(proposal) -> proposal
end