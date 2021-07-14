
from os import urandom
from pytezos import pytezos 
from pytezos.crypto.encoding import base58_encode

fee_rate = 333
voting_period = 2592000

alice = "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb"
bob = "tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6"

julian = "tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw" # :)

dummy_candidate = "tz1XXPVLyQqsMVaQKnPWvD4q6nVwgwXUG4Fp"

# the same as Pytezos' contract.context.get_self_address()
contract_self_address = 'KT1BEqzn5Wx8uJrZNvuS9DVHmLvG9td3fDLi'

token_address = "KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn"

# the same as Pytezos' `contract.context.get_sender()`. The default Tezos.sender
me = "tz1Ke2h7sDdakHJQh8WX4Z372du1KChsksyU"


def default_storage(contract):
    storage = contract.storage.dummy()
    storage["token_address"] = token_address
    storage["accuracy"] = 1_000_000
    storage["proposal_config"] = {
        "proposal_stake": 5000,
        "voting_quorum": 40_000,
        "support_quorum": 660_000,
    }
    return storage

def print_pool_stats(res):
    print("\n")
    print("token_pool:", res.storage["storage"]["token_pool"])
    print("tez_pool", res.storage["storage"]["tez_pool"])

def get_pool_stats(res):
    token_pool = res.storage["storage"]["token_pool"]
    tez_pool = res.storage["storage"]["tez_pool"]
    return (tez_pool, token_pool)


def calc_tokens_out(res, tez_amount):
    token_pool = res.storage["storage"]["token_pool"]
    tez_pool = res.storage["storage"]["tez_pool"]
    invariant = tez_pool * token_pool

    tez_pool = tez_pool + tez_amount

    new_token_pool = invariant / abs(tez_pool - tez_amount / fee_rate)
    tokens_out = abs(token_pool - new_token_pool)
    return tokens_out

def calc_tez_out(res, token_amount):
    token_pool = res.storage["storage"]["token_pool"]
    tez_pool = res.storage["storage"]["tez_pool"]
    invariant = tez_pool * token_pool
    
    token_pool = token_pool + token_amount
    new_tez_pool = invariant / abs(token_pool - token_amount / fee_rate)
    tez_out = abs(tez_pool - new_tez_pool)
    return tez_out

def calc_pool_rate(res, pair=-1):
    if pair != -1: #token to token case
        pair_storage = res.storage["storage"]["pairs"][pair]
        token_a_pool = pair_storage["token_a_pool"]
        token_b_pool = pair_storage["token_b_pool"]
        return token_a_pool / token_b_pool


    token_pool = res.storage["storage"]["token_pool"]
    tez_pool = res.storage["storage"]["tez_pool"]
    return tez_pool / token_pool
    

def parse_tez_transfer(op):
    dest = op["destination"]
    amount = int(op["amount"])
    source = op["source"]
    return {
        "type": "tez", 
        "destination": dest,
        "amount": amount,
        "source": source
    }

def parse_as_fa12(value):
    args = value["args"]

    return {
        "type": "token",
        "amount": int(args[2]["int"]),
        "destination": args[1]["string"]
    }

def parse_as_fa2(values):
    value = values[0]
    args = value["args"][1][0]["args"]

    amount = args[-1]["int"]
    amount = int(amount)

    dest = args[0]["string"]

    return {
        "type": "token",
        "destination": dest,
        "amount": amount,
        
    }

def parse_token_transfers(res):
    token_transfers = []
    for op in res.operations:
        if op["kind"] == "transaction":
            entrypoint = op["parameters"]["entrypoint"]
            if entrypoint == "transfer":
                tx = parse_token_transfer(op)
                token_transfers.append(tx)
    return token_transfers

def parse_token_transfer(op):
    transfer = None
    if not isinstance(op["parameters"]["value"], list):
        transfer = parse_as_fa12(op["parameters"]["value"])
    else:
        transfer = parse_as_fa2(op["parameters"]["value"])

    transfer["token_address"] = op["destination"]
    return transfer

def parse_delegations(res):
    delegates = []
    for op in res.operations:
        if op["kind"] == "delegation":
            delegates.append(op["delegate"])
    return delegates


def parse_ops(res):
    result = []
    for op in res.operations:
        if op["kind"] == "transaction":
            entrypoint = op["parameters"]["entrypoint"]
            if entrypoint == "default":
                tx = parse_tez_transfer(op)
                result.append(tx)
            elif entrypoint == "transfer":
                tx = parse_token_transfer(op)
                result.append(tx)
            elif entrypoint == "close":
                result.append({"type" : "close"})
    return result

# calculates shares balance
def fetch_balance(res, address, token_id=0):
    ledger = res.storage["account_info"]
    return ledger[address]["balances"][token_id]

def parse_mint(op):
    value = op["parameters"]["value"]
    args = value["args"]
    dest = args[0]["string"]
    amount = int(args[1]["int"])
    return {
        "type": "mint",
        "amount": amount,
        "destination": dest,
        "token_address": "fa12_dummy",
    }

def parse_mints(res):
    mints = []
    for op in res.operations:
        if op["kind"] == "transaction":
            if op["parameters"]["entrypoint"] == "mint":
                mint = parse_mint(op)
                mints.append(mint)
    return mints

def generate_random_address() -> str:
    return base58_encode(urandom(20), b'tz1').decode()

def calc_out_per_hundred(chain, dex):
    res = chain.interpret(dex.tokenToTezPayment(amount=100, min_out=1, receiver=alice), amount=0)
    ops = parse_ops(res)
    tez_out = ops[0]["amount"]

    res = chain.interpret(dex.tezToTokenPayment(min_out=1, receiver=alice), amount=100)
    ops = parse_ops(res)
    token_out = ops[0]["amount"]

    return (tez_out, token_out)

def get_percentage_diff(previous, current):
    try:
        percentage = abs(previous - current)/max(previous, current) * 100
    except ZeroDivisionError:
        percentage = float('inf')
    return percentage

def operator_add(owner, operator, token_id=0):
    return {
        "add_operator": {
            "owner": owner,
            "operator": operator,
            "token_id": token_id
        }
    }

def operator_remove(owner, operator, token_id=0):
    return {
        "remove_operator": {
            "owner": owner,
            "operator": operator,
            "token_id": token_id
        }
    }


class LocalChain():
    def __init__(self, init_storage):
        self.storage = init_storage 

        self.balance = 0
        self.now = 0
        self.payouts = {}
        self.contract_balances = {}
        self.last_res = None

    def execute(self, call, amount=0, sender=None):
        new_balance = self.balance + amount
        res = call.interpret(amount=amount, \
            storage=self.storage, \
            balance=new_balance, \
            now=self.now, \
            sender=sender    
        )
        self.balance = new_balance
        self.storage = res.storage
        self.last_res = res

        # calculate total xtz payouts from contract
        ops = parse_ops(res)
        for op in ops:
            if op["type"] == "tez":
                dest = op["destination"]
                amount = op["amount"]
                self.payouts[dest] = self.payouts.get(dest, 0) + amount

                # reduce contract balance in case it has sent something
                if op["source"] == contract_self_address:
                    self.balance -= op["amount"]

            elif op["type"] == "token":
                dest = op["destination"]
                amount = op["amount"]
                address = op["token_address"]
                if address not in self.contract_balances:
                    self.contract_balances[address] = {}
                contract_balance = self.contract_balances[address] 
                if dest not in contract_balance:
                    contract_balance[dest] = 0
                contract_balance[dest] += amount 
            # imitate closing of the function for convenience
            elif op["type"] == "close":
                self.storage["storage"]["entered"] = False   

        return res

    # just interpret, don't store anything
    def interpret(self, call, amount=0, sender=None):
        res = call.interpret(amount=amount, \
            storage=self.storage, \
            balance=self.balance, \
            now=self.now, \
            sender=sender
        )
        return res

    def advance_period(self):
        self.now += voting_period

    def advance_blocks(self, count=1):
        self.now += count * 60

# def init_storage_from_factory():
#     factory_code = open("./FactoryFA2.tz", 'r').read()
#     factory = ContractInterface.from_michelson(factory_code)
#     res = factory.launchExchange(("KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton", 0), 100).interpret(amount=1, balance=1)

#     # TODO find how to parse micheline storage
#     storage_expression = res.operations[0]["script"]["storage"]
#     return storage_expression