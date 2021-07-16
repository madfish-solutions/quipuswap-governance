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

        chain.advance_blocks(5 * 1440)

        res = chain.execute(self.ct.claim())
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

        chain.advance_blocks(5 * 1440)

        res = chain.execute(self.ct.claim())
        transfers = parse_token_transfers(res)
        self.assertEqual(transfers[0]["amount"], 500)
        self.assertEqual(transfers[0]["destination"], me)

        res = chain.execute(self.ct.claim(), sender=alice)
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
        chain.advance_blocks(5 * 1440 * 100)

        res = chain.execute(self.ct.claim(), sender=alice)
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

        res = chain.execute(self.ct.claim())
            
        transfers = parse_token_transfers(res)
        
        # take my collateral
        self.assertEqual(transfers[0]["amount"], 950)
        self.assertEqual(transfers[0]["destination"], me)

        with self.assertRaises(MichelsonRuntimeError):
            res = chain.execute(self.ct.claim())

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
            "deferral": 1
        }))
        res = chain.execute(self.ct.receive_supply(100_000), sender=token_address)

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