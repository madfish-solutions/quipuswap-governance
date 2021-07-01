#include "../partial/GovTypes.ligo"
#include "../partial/GovUtils.ligo"
#include "../partial/GovAdmin.ligo"
#include "../partial/GovVoting.ligo"

type parameter is
  | Transfer_ownership        of (option(address))
  | Take_ownership            of unit
  | Cancel_transfer_ownership of unit
  | Set_proposal_setup        of proposal_setup_type
  | Ban_proposal              of id_type
  | New_proposal              of new_proposal_type
  | Vote                      of new_vote_type
// | New_deferred_proposal     of new_deferred_proposal
function main(
  const action          : parameter;
  const s               : storage_type)
                        : return is
  case action of
    | Transfer_ownership(params) -> ((nil : list(operation)), transfer_ownership(params, s))
    | Take_ownership(_) -> ((nil : list(operation)), take_ownership(s))
    | Cancel_transfer_ownership(_) -> ((nil : list(operation)), cancel_transfer_ownership(s))
    | Set_proposal_setup(params) -> ((nil : list(operation)), set_proposal_setup(params, s))
    | Ban_proposal(params) -> ((nil : list(operation)), ban_proposal(params, s))
    | New_proposal(params) -> ((nil : list(operation)), new_proposal(params, s))
    | Vote(params) -> ((nil : list(operation)), add_vote(params, s))
  end
