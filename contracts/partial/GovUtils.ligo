function getProposal(
    const prop_id       : id;
    const s             : storage)
                        : proposal is
  case s.proposals[prop_id] of
    None -> record [
      ipfs_link         = 0x7070;
      forum_link        = 0x7070;
      votes_for         =  0n;
      votes_against     = 0n;
      start_date        = ("2000-01-01T10:10:10Z" : timestamp);
      end_date          = ("2000-01-01T10:10:10Z" : timestamp);
      status            = Banned;
      config            = record[
          proposal_stake =10n;
          voting_quorum = 10n;
          support_quorum = 10n;
        ]
  ]
  | Some(proposal) -> proposal
  end
