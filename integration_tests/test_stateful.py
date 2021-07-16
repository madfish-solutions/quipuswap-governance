from pytezos import ContractInterface, pytezos, MichelsonRuntimeError
from hypothesis.stateful import Bundle, RuleBasedStateMachine, rule, invariant, precondition, initialize
from hypothesis import Verbosity, given, settings, event, strategies as st

from helpers import *

max_deferral = 30 * 86_400


@settings(
    verbosity=Verbosity.verbose,
    deadline=10_000,
    stateful_step_count=100,
    max_examples=10
)
class StatusIsCorrect(RuleBasedStateMachine):
    def __init__(self):
        super().__init__()
        code = open("./contracts/compiled/Governance.tz", 'r').read()
        self.ct = ContractInterface.from_michelson(code)
        self.chain = LocalChain(default_storage(self.ct))
        self.init = False

    @initialize(defferal=st.integers(0, max_deferral))
    def new_proposal(self, defferal):
        res = self.chain.execute(self.ct.new_proposal({
            "ipfs_link": "DEDA",
            "forum_link": "B0BA",
            "voting_period": 5 * 86400,
            "deferral": defferal
        }))
        res = self.chain.execute(self.ct.receive_supply(1_000), sender=token_address)

    @rule(amount=st.integers(0), sender=st.sampled_from([alice, bob, me]))
    def vote(self, amount, sender):
        try:
            res = self.chain.execute(self.ct.vote({"proposal": 0, "vote": {"for": amount}}), sender=sender)
        except MichelsonRuntimeError:
            event("cant vote")

    @rule(sender=st.sampled_from([alice, bob, me]))
    def claim(self, sender):
        try:
            res = self.chain.execute(self.ct.claim(), sender=sender)
        except MichelsonRuntimeError:
            event("cant claim")

    @rule(dummy=st.none())
    def finalize(self, dummy):
        try:
            res = self.chain.execute(self.ct.finalize_voting(0))
        except MichelsonRuntimeError:
            event("cant finalize")

    @rule(blocks=st.integers(0))
    def advance(self, blocks):
        self.chain.advance_blocks(blocks)

    # @precondition(lambda self: self.chain.storage["finishTime"] != 0)
    @invariant()
    def not_ended_before_time(self):
        storage = self.chain.storage
        proposal = storage["proposals"][0]
        is_voting = proposal["status"] == "voting"
        is_pending = proposal["status"] == "pending"
        has_ended = self.chain.now <= proposal["end_date"]

        if not has_ended:
            if not (is_pending or is_voting):
                print("now:", self.chain.now)
                print("end:", proposal["end_date"])

            assert (is_pending or is_voting)

VotingStatusIsCorrect = StatusIsCorrect.TestCase