#include "../partial/GovTypes.ligo"
#include "../partial/GovUtils.ligo"
#include "../partial/GovAdmin.ligo"
#inclide "../partial/GovVoting.ligo"

type parameter is
  | TransferOwnership of (option(address))
  | TakeOwnership of unit
  | CancelTransferOwnership of unit
  | SetProposalSetup of proposal_setup
  | NewProposal of new_proposal
  | NewDeferredProposal of new_deferred_proposal
  | Vote of new_vote

function main (const action : parameter; const s : storage) : return is
  case action of
    | TransferOwnership(params) -> ((nil : list(operation)), transferOwnership(params, s))
    | TakeOwnership(params) -> ((nil : list(operation)), takeOwnership(s))
    | CancelTransferOwnership(params) -> ((nil : list(operation)), cancelTransferOwnership(s))
    | SetProposalSetup(params) -> ((nil : list(operation)), setProposalSetup(params.0, params.1, s))
    | NewProposal(params) -> ((nil : list(operation)), newProposal(params.0, params.1, params.2, s))
    | NewDeferredProposal(params) -> ((nil : list(operation)), newDeferredProposal(params.0, params.1, params.2, params.3, s))
    | Vote(params) -> ((nil : list(operation)), addVote(params, s))

  end

