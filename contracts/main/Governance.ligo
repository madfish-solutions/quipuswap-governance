#include "../partial/GovTypes.ligo"
#include "../partial/GovUtils.ligo"
#include "../partial/GovAdmin.ligo"
#include "../partial/GovVoting.ligo"

type parameter_type is
  | Transfer_ownership        of (option(address))
  | Take_ownership            of unit
  | Cancel_transfer_ownership of unit
  | Set_proposal_setup        of proposal_setup_type
  | Ban_proposal              of id_type
  | New_proposal              of new_proposal_type
  | Receive_supply            of receive_supply_type
  | Vote                      of new_vote_type
  | Claim                     of unit
  | Finalize_voting           of id_type
  | Activate_proposal         of id_type

function main(
  const action          : parameter_type;
  const s               : storage_type)
                        : return is
  case action of
      Transfer_ownership(params)       -> ((nil : list(operation)), transfer_ownership(params, s))
    | Take_ownership(_)                -> ((nil : list(operation)), take_ownership(s))
    | Cancel_transfer_ownership(_)     -> ((nil : list(operation)), cancel_transfer_ownership(s))
    | Set_proposal_setup(params)       -> ((nil : list(operation)), set_proposal_setup(params, s))
    | Ban_proposal(params)             -> ban_proposal(params, s)
    | New_proposal(params)             -> get_total_supply(params, s)
    | Receive_supply (params)          -> (receive_supply(params, s))
    | Vote(params)                     -> add_vote(params, s)
    | Claim(_)                         -> claim(s)
    | Finalize_voting(params)          -> ((nil : list(operation)), finalize_voting(params, s))
    | Activate_proposal(params)        -> ((nil : list(operation)), activate_proposal(params, s))
  end
