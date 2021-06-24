#include "../partial/GovTypes.ligo"
#include "../partial/GovAdmin.ligo"

// type parameter is
//   | NewProposal of (proposal_period)
//   | BlockProposal of (id)
//   | TransferOwnership of (option(address))
//   | Vote of (new_vote)
//   | SetProposalSetup of (param_setup, nat)
//   | TakeOwnership of (unit)

type parameter is
  | TransferOwnership of (option(address))
  | TakeOwnership of (unit)
  | CancelTransferOwnership of (unit)
  | SetProposalSetup of (proposal_setup)


function main (const action : parameter; const s : storage) : return is
  case action of
    | TransferOwnership(params) -> ((nil : list(operation)), transferOwnership(params, s))
    | TakeOwnership(params) -> ((nil : list(operation)), takeOwnership(s))
    | CancelTransferOwnership(params) -> ((nil : list(operation)), cancelTransferOwnership(s))
    | SetProposalSetup(params) -> ((nil : list(operation)), setProposalSetup(params.0, params.1, s))

  end