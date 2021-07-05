function getProposal(
    const prop_id       : id_type;
    const s             : storage_type)
                        : proposal_type is
  case s.proposals[prop_id] of
    None -> record [
      creator           = zero_address;
      ipfs_link         = 0x7070;
      forum_link        = 0x7070;
      votes_for         = 0n;
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


function get_locked_balance(
    const staker_key    : staker_key_type;
    const s             : storage_type)
                        : nat is
  case s.locked_balances[staker_key] of
    None -> 0n
  | Some(v) -> v
  end


function get_tx_param(
    const to_            : address;
    const value          : nat)
                        : transfer_param_type is
  block {
    const transfer_destination : transfer_destination_type = record [
      to_               = to_;
      token_id          = 0n;
      amount            = value;
    ];
    const transfer_param : transfer_param_type = record [
      from_             = Tezos.sender;
      txs               = list[transfer_destination];
    ];
  } with transfer_param


// function get_supply(const token_address : address) : contract() is
//   case (Tezos.get_entrypoint_opt("%getTotalSupply", token_address) : option(contract(transfer_type))) of
//     Some(contr) -> contr
//     | None -> (failwith("GOV/not-supply") : contract())
//   end;

function rem (var m : register) : register is
  block {
    remove ("tz1gjaF81ZRRvdzjobyfVNsAeSC6PScjfQwN": address) from map moves
  } with m

