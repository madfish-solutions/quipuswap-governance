from os.path import dirname, join
from unittest import TestCase
from decimal import Decimal

from helpers import *

from pytezos import ContractInterface, pytezos, MichelsonRuntimeError
from pytezos.context.mixin import ExecutionContext

import time

class GovTokenTest(TestCase):

    @classmethod
    def setUpClass(cls):
        cls.maxDiff = None

        code = open("./contracts/compiled/Governance.tz", 'r').read()
        cls.ct = ContractInterface.from_michelson(code)

    def test_simple_claim(self):
        chain = LocalChain(default_storage(self.ct))

        res = chain.execute(self.ct.new_proposal({
            "ipfs_link": "DEDA",
            "forum_link": "B0BA",
            "voting_period": 5 * 86400,
            "deferral": 0
        }))
        res = chain.execute(self.ct.receive_supply(100_000), sender=token_address)

        chain.advance_blocks(5 * 1440 + 1)

        res = chain.execute(self.ct.claim(0))
        transfers = parse_token_transfers(res)
        
        # take my collateral
        self.assertEqual(transfers[0]["amount"], 500)
        self.assertEqual(transfers[0]["destination"], me)

    def test_simple_vote(self):
        chain = LocalChain(default_storage(self.ct))

        res = chain.execute(self.ct.new_proposal({
            "ipfs_link": "DEDA",
            "forum_link": "B0BA",
            "voting_period": 5 * 86400,
            "deferral": 0
        }))
        res = chain.execute(self.ct.receive_supply(100_000), sender=token_address)

        res = chain.execute(self.ct.vote({"proposal": 0, "vote": {"for": 400}}), sender=alice)

        chain.advance_blocks(5 * 1440 + 1)

        res = chain.execute(self.ct.claim(0))
        transfers = parse_token_transfers(res)
        self.assertEqual(transfers[0]["amount"], 500)
        self.assertEqual(transfers[0]["destination"], me)

        res = chain.execute(self.ct.claim(0), sender=alice)
        transfers = parse_token_transfers(res)
        
        # take my collateral
        self.assertEqual(transfers[0]["amount"], 400)
        self.assertEqual(transfers[0]["destination"], alice)

    def test_re_vote(self):
        chain = LocalChain(default_storage(self.ct))

        res = chain.execute(self.ct.new_proposal({
            "ipfs_link": "DEDA",
            "forum_link": "B0BA",
            "voting_period": 5 * 86400,
            "deferral": 0
        }))
        res = chain.execute(self.ct.receive_supply(100_000), sender=token_address)
        res = chain.execute(self.ct.vote({"proposal": 0, "vote": {"against": 400}}), sender=alice)

        res = chain.execute(self.ct.vote({"proposal": 0, "vote": {"for": 100}}), sender=alice)
        self.assertListEqual(res.storage["user_proposals"][alice], [0])

        chain.advance_blocks(5 * 1440 * 100)

        res = chain.execute(self.ct.claim(0), sender=alice)
        transfers = parse_token_transfers(res)

        self.assertEqual(transfers[0]["amount"], 500)
        self.assertEqual(transfers[0]["destination"], alice)


    def test_finalize_without_ever_voting(self):
        chain = LocalChain(default_storage(self.ct))

        res = chain.execute(self.ct.new_proposal({
            "ipfs_link": "DEDA",
            "forum_link": "B0BA",
            "voting_period": 5 * 86400,
            "deferral": 1
        }))
        res = chain.execute(self.ct.receive_supply(100_000), sender=token_address)

        chain.advance_blocks(5 * 1440 + 1)

        res = chain.execute(self.ct.finalize_voting(0))

    def test_vote_for_yourself_and_claim(self):
        chain = LocalChain(default_storage(self.ct))

        res = chain.execute(self.ct.new_proposal({
            "ipfs_link": "DEDA",
            "forum_link": "B0BA",
            "voting_period": 5 * 86400,
            "deferral": 0
        }))
        res = chain.execute(self.ct.receive_supply(100_000), sender=token_address)

        res = chain.execute(self.ct.vote({"proposal": 0, "vote": {"against": 450}}))
        
        chain.advance_blocks(5 * 1440 + 1)

        res = chain.execute(self.ct.claim(0))
            
        transfers = parse_token_transfers(res)
        self.assertEqual(transfers[0]["amount"], 950)
        self.assertEqual(transfers[0]["destination"], me)

        with self.assertRaises(MichelsonRuntimeError):
            res = chain.execute(self.ct.claim(0))
        

    def test_finalize_ok(self):
        chain = LocalChain(default_storage(self.ct))

        res = chain.execute(self.ct.new_proposal({
            "ipfs_link": "DEDA",
            "forum_link": "B0BA",
            "voting_period": 5 * 86400,
            "deferral": 0
        }))
        res = chain.execute(self.ct.receive_supply(100_000), sender=token_address)

        chain.advance_blocks(5 * 1440 + 1)

        res = chain.execute(self.ct.finalize_voting(0))

    def test_finalize_deffered(self):
        chain = LocalChain(default_storage(self.ct))

        res = chain.execute(self.ct.new_proposal({
            "ipfs_link": "DEDA",
            "forum_link": "B0BA",
            "voting_period": 5 * 86400,
            "deferral": 60
        }))
        res = chain.execute(self.ct.receive_supply(100_000), sender=token_address)

        chain.advance_blocks(5 * 1440 + 2)

        res = chain.execute(self.ct.finalize_voting(0))

    def test_finalize_early(self):
        chain = LocalChain(default_storage(self.ct))

        res = chain.execute(self.ct.new_proposal({
            "ipfs_link": "DEDA",
            "forum_link": "B0BA",
            "voting_period": 5 * 86400,
            "deferral": 0
        }))
        res = chain.execute(self.ct.receive_supply(100_000), sender=token_address)

        with self.assertRaises(MichelsonRuntimeError):
            res = chain.execute(self.ct.finalize_voting(0))

        res = chain.execute(self.ct.vote({"proposal": 0, "vote": {"for": 450}}))
    
        with self.assertRaises(MichelsonRuntimeError):
            res = chain.execute(self.ct.finalize_voting(0))
        

    def test_approve(self):
        chain = LocalChain(default_storage(self.ct))

        res = chain.execute(self.ct.new_proposal({
            "ipfs_link": "DEDA",
            "forum_link": "B0BA",
            "voting_period": 5 * 86400,
            "deferral": 0
        }))
        res = chain.execute(self.ct.receive_supply(1_000), sender=token_address)

        res = chain.execute(self.ct.vote({"proposal": 0, "vote": {"for": 400}}), sender=alice)

        chain.advance_blocks(5 * 1440 + 1)

        res = chain.execute(self.ct.finalize_voting(0))
        
        status = res.storage["proposals"][0]["status"]
        self.assertEqual(status, "approved")

    def test_underrate(self):
        chain = LocalChain(default_storage(self.ct))

        res = chain.execute(self.ct.new_proposal({
            "ipfs_link": "DEDA",
            "forum_link": "B0BA",
            "voting_period": 5 * 86400,
            "deferral": 0
        }))
        res = chain.execute(self.ct.receive_supply(1_000), sender=token_address)

        chain.advance_blocks(5 * 1440 + 1)

        res = chain.execute(self.ct.finalize_voting(0))
        
        status = res.storage["proposals"][0]["status"]
        self.assertEqual(status, "underrated")

    def test_reject(self):
        chain = LocalChain(default_storage(self.ct))

        res = chain.execute(self.ct.new_proposal({
            "ipfs_link": "DEDA",
            "forum_link": "B0BA",
            "voting_period": 5 * 86400,
            "deferral": 0
        }))
        res = chain.execute(self.ct.receive_supply(1_000), sender=token_address)
        res = chain.execute(self.ct.vote({"proposal": 0, "vote": {"against": 400}}), sender=alice)

        chain.advance_blocks(5 * 1440 + 1)

        res = chain.execute(self.ct.finalize_voting(0))
        
        status = res.storage["proposals"][0]["status"]
        self.assertEqual(status, "rejected")


    def test_zero_vote(self):
        chain = LocalChain(default_storage(self.ct))

        res = chain.execute(self.ct.new_proposal({
            "ipfs_link": "DEDA",
            "forum_link": "B0BA",
            "voting_period": 5 * 86400,
            "deferral": 0
        }))
        res = chain.execute(self.ct.receive_supply(1_000), sender=token_address)

        with self.assertRaises(MichelsonRuntimeError):
            res = chain.execute(self.ct.vote({"proposal": 0, "vote": {"against": 0}}), sender=alice)


    def test_multiple_proposals(self):
        chain = LocalChain(default_storage(self.ct))

        for i in range(5):
            res = chain.execute(self.ct.new_proposal({
                "ipfs_link": "DEDA",
                "forum_link": "B0BA",
                "voting_period": 5 * 86400,
                "deferral": 0
            }))
            res = chain.execute(self.ct.receive_supply(1_000), sender=token_address)

        for i in range(5):
            res = chain.execute(self.ct.vote({"proposal": i, "vote": {"for": 100}}), sender=alice)

        chain.advance_blocks(5 * 1440 + 1)

        for i in range(5):
            res = chain.execute(self.ct.claim(i), sender=alice)
            transfers = parse_token_transfers(res)
            
            self.assertEqual(transfers[0]["amount"], 100)
            self.assertEqual(transfers[0]["destination"], alice)

        for i in range(5):
            res = chain.execute(self.ct.claim(i), sender=me)
            transfers = parse_token_transfers(res)

            self.assertEqual(transfers[0]["amount"], 5)
            self.assertEqual(transfers[0]["destination"], me)
        

    def test_two_dont_interfere(self):
        chain = LocalChain(default_storage(self.ct))

        res = chain.execute(self.ct.new_proposal({
            "ipfs_link": "DEDA",
            "forum_link": "B0BA",
            "voting_period": 5 * 86400,
            "deferral": 0
        }))
        res = chain.execute(self.ct.receive_supply(1_000), sender=token_address)

        res = chain.execute(self.ct.new_proposal({
            "ipfs_link": "DEAD",
            "forum_link": "F00D",
            "voting_period": 5 * 86400,
            "deferral": 5 * 86400
        }))
        res = chain.execute(self.ct.receive_supply(1_000), sender=token_address)

        res = chain.execute(self.ct.vote({"proposal": 0, "vote": {"for": 100}}), sender=alice)

        chain.advance_blocks(5 * 1440 + 1)

        res = chain.execute(self.ct.claim(0), sender=alice)
        transfers = parse_token_transfers(res)
        
        self.assertEqual(transfers[0]["amount"], 100)
        self.assertEqual(transfers[0]["destination"], alice)

        # creator claims
        res = chain.execute(self.ct.claim(0), sender=me)
        transfers = parse_token_transfers(res)

        self.assertEqual(transfers[0]["amount"], 5)
        self.assertEqual(transfers[0]["destination"], me)

        res = chain.execute(self.ct.vote({"proposal": 1, "vote": {"for": 100}}), sender=alice)
        chain.advance_blocks(5 * 1440)

        res = chain.execute(self.ct.claim(1), sender=alice)
        transfers = parse_token_transfers(res)
        
        self.assertEqual(transfers[0]["amount"], 100)
        self.assertEqual(transfers[0]["destination"], alice)
        # creator claims
        res = chain.execute(self.ct.claim(1), sender=me)
        transfers = parse_token_transfers(res)

        self.assertEqual(transfers[0]["amount"], 5)
        self.assertEqual(transfers[0]["destination"], me)


    def test_cant_vote_banned(self):
        init_storage = default_storage(self.ct)
        init_storage["owner"] = julian
        chain = LocalChain(init_storage)

        res = chain.execute(self.ct.new_proposal({
            "ipfs_link": "DEDA",
            "forum_link": "B0BA",
            "voting_period": 5 * 86400,
            "deferral": 0
        }))
        res = chain.execute(self.ct.receive_supply(100_000), sender=token_address)

        # creator votes for its own proposal
        res = chain.execute(self.ct.vote({"proposal": 0, "vote": {"for": 1}}), sender=me)

        res = chain.execute(self.ct.vote({"proposal": 0, "vote": {"for": 333}}), sender=alice)

        # admin bans the proposal
        res = chain.execute(self.ct.ban_proposal(0), sender=julian)

        chain.advance_blocks(5 * 1440 + 1)

        # alice can claim her vote after proposal banned
        res = chain.execute(self.ct.claim(0), sender=alice)
        transfers = parse_token_transfers(res)
        self.assertEqual(transfers[0]["amount"], 333)
        self.assertEqual(transfers[0]["destination"], alice)
        
        # owner can only claim what he voted, but not the collateral
        res = chain.execute(self.ct.claim(0), sender=me)
        transfers = parse_token_transfers(res)
        self.assertEqual(transfers[0]["amount"], 1)
        self.assertEqual(transfers[0]["destination"], me)

        # can't finalize banned proposal
        with self.assertRaises(MichelsonRuntimeError):
            res = chain.execute(self.ct.finalize_voting(0))

    def test_cant_ban_finished(self):
        init_storage = default_storage(self.ct)
        init_storage["owner"] = julian
        chain = LocalChain(init_storage)

        res = chain.execute(self.ct.new_proposal({
            "ipfs_link": "DEDA",
            "forum_link": "B0BA",
            "voting_period": 5 * 86400,
            "deferral": 0
        }))
        res = chain.execute(self.ct.receive_supply(100_000), sender=token_address)

        res = chain.execute(self.ct.vote({"proposal": 0, "vote": {"for": 333}}), sender=alice)

        chain.advance_blocks(5 * 1440 + 1)
        res = chain.execute(self.ct.finalize_voting(0))

        # can't ban finalized proposal
        with self.assertRaises(MichelsonRuntimeError):
            # admin bans the proposal
            res = chain.execute(self.ct.ban_proposal(0), sender=julian)
