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
            "voting_period": 5 * 84600,
            "deferral": 0
        }))
        res = chain.execute(self.ct.receive_supply(100_000), sender=token_address)

        chain.advance_blocks(5 * 1440 + 1)

        res = chain.execute(self.ct.claim())
        transfers = parse_token_transfers(res)
        
        # take my collateral
        self.assertEqual(transfers[0]["amount"], 500)
        self.assertEqual(transfers[0]["destination"], me)