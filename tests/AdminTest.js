const { rejects, strictEqual, notStrictEqual } = require("assert")
const { Tezos, signerAlice, signerBob } = require("./utils/cli");
const { alice } = require("../scripts/sandbox/accounts");
const { bob } = require("../scripts/sandbox/accounts");

const { confirmContract } = require('./utils/confirmation');


async function awaitOwnershipContender(contract, addr) {
    do {
        var storage = await contract.storage();
     } while ( storage.pending_ownership_tranfer != addr)
};

async function awaitNewOwner (contract, addr) {
    do {
        var storage = await contract.storage();
     } while ( storage.owner != addr)
};

async function awaitChangeProposalSetup(contract, param) {

    do {
        var storage = await contract.storage();
        var proposal_config = await storage.proposal_config

        if (param === "Required_proposal_stake") {
            var prop_param = proposal_config.required_proposal_stake;
        } else if (param === "Minimal_voting_quorum") {
            var prop_param = proposal_config.minimal_voting_quorum;
        } else {
            var prop_param = proposal_config.minimal_approval_quorum;
        };
     } while ( prop_param.toNumber() === 4)
};

async function awaitBanProposal(contract) {
    do {
        var storage = await contract.storage();
        var proposal = await storage.proposals.get(0);
     } while ( proposal.status["banned"] === undefined )
};

const { migrate } = require("../scripts/helpers");



describe('Admin test', async function () {
    let contract;

    var s = [
        "withPendingProposal", "defaultStorage", "defaultStorage",
        "defaultStorage", "defaultStorage", "defaultStorage",
        "defaultStorage", "defaultStorage", "defaultStorage",
        "withPendingOwnershipBob", "defaultStorage", "defaultStorage",
        "withPendingOwnershipEve", "withPendingOwnershipBob", "defaultStorage"];

    beforeEach(async () => {
        let q = s.pop();
        try {
            const { storages } = require("./storage/adminStorage");
            let deployedContract = await migrate(Tezos, "Governance", storages[q]);
            contract = await confirmContract(Tezos, deployedContract);

        } catch (e) { console.log(e) }
    });

    describe('Testing entrypoint: TransferOwnership', async function () {
        it('Only the owner can call this method', async function () {
            Tezos.setSignerProvider(signerBob);
            await rejects(
                contract.methods.transferOwnership(bob.pkh).send(),
                (err) => {
                    strictEqual(err.message, "This method is for the owner only");
                    return true
                }
            );
        });
        it('Сannot transfer ownership to someone who is already awaiting the transfer', async function () {
                Tezos.setSignerProvider(signerAlice)
                await rejects(
                    contract.methods.transferOwnership(bob.pkh).send(),
                    (err) => {
                        strictEqual(err.message, "You are already transferring ownership to this account");
                        return true
                    }
                );
            });
        it('Сannot transfer ownership to someone else if someone is already in the transfer pending', async function () {
                Tezos.setSignerProvider(signerAlice)
                await rejects(
                    contract.methods.transferOwnership(bob.pkh).send(),
                    (err) => {
                        strictEqual(err.message, "You are already transferring ownership to someone");
                        return true
                    }
                );
            });
        it('Successful transfer of ownership', async function () {
                Tezos.setSignerProvider(signerAlice)
                await contract.methods.transferOwnership(bob.pkh).send();
                await awaitOwnershipContender(contract, bob.pkh).catch((err)=>{console.log(err)});
                let storage = await contract.storage();
                strictEqual(bob.pkh, storage.pending_ownership_tranfer)
            });
        });
    describe('Testing entrypoint: TakeOwnership', async function () {
            it('Cannot take ownership, if does not in pending to transfer of ownership', async function () {
                Tezos.setSignerProvider(signerBob)
                await rejects(
                    contract.methods.takeOwnership(["unit"]).send(),
                    (err) => {
                        strictEqual(err.message, "You are not claiming to be the owner of the contract");
                        return true
                    }
                );
            });
            it('Bob successfully became the new owner', async function () {
                Tezos.setSignerProvider(signerBob)
                await contract.methods.takeOwnership(["unit"]).send();
                await awaitNewOwner(contract, bob.pkh).catch((err)=>{console.log(err)});
                let storage = await contract.storage();
                strictEqual(storage.owner, bob.pkh)
            });
        });
    describe("Testing entrypoint: СancelTransferOwnership", async function () {
            it('Only the owner can call this method', async function () {
                Tezos.setSignerProvider(signerBob)
                await rejects(
                    contract.methods.cancelTransferOwnership(["unit"]).send(),
                    (err) => {
                        strictEqual(err.message, "This method is for the owner only");
                        return true
                    }
                );
            });
            it('failwith("You do not transfer ownership")', async function () {
                Tezos.setSignerProvider(signerAlice)
                await rejects(
                    contract.methods.cancelTransferOwnership(["unit"]).send(),
                    (err) => {
                        strictEqual(err.message, "You do not transfer ownership");
                        return true
                    }
                );
            });
        });
    describe("Testing entrypoint: setProposalSetup", async function () {
            it('Only the owner can call this method', async function () {
                Tezos.setSignerProvider(signerBob)
                await rejects(
                    contract.methods.setProposalSetup("required_proposal_stake", "unit", 5).send(),
                    (err) => {
                        strictEqual(err.message, "This method is for the owner only");
                        return true
                    }
                );
            });
            it('Successfully changed: Required_proposal_stake', async function () {
                Tezos.setSignerProvider(signerAlice)
                await contract.methods.setProposalSetup("required_proposal_stake", "unit", 5).send();
                await awaitChangeProposalSetup(contract, "Required_proposal_stake").catch((err)=>{console.log(err)});
                let storage = await contract.storage();
                let proposal_config = await storage.proposal_config;
                strictEqual(proposal_config.required_proposal_stake.toNumber(), 5)
            });
            it('Successfully changed: Minimal_voting_quorum', async function () {
                Tezos.setSignerProvider(signerAlice)
                await contract.methods.setProposalSetup("minimal_voting_quorum", "unit", 5).send();
                await awaitChangeProposalSetup(contract, "Minimal_voting_quorum").catch((err)=>{console.log(err)});
                let storage = await contract.storage();
                let proposal_config = await storage.proposal_config;
                strictEqual(proposal_config.minimal_voting_quorum.toNumber(), 5)
            });
            it('Successfully changed: Minimal_approval_quorum', async function () {
                Tezos.setSignerProvider(signerAlice)
                await contract.methods.setProposalSetup("minimal_approval_quorum", "unit", 5).send();
                await awaitChangeProposalSetup(contract, "Minimal_approval_quorum").catch((err)=>{console.log(err)});
                let storage = await contract.storage();
                let proposal_config = await storage.proposal_config;
                strictEqual(proposal_config.minimal_approval_quorum.toNumber(), 5)
            });
        });
    describe("Testing entrypoint: banProposal", async function () {
            it('Only the owner can call this method', async function () {
                Tezos.setSignerProvider(signerBob)
                await rejects(
                    contract.methods.banProposal(0).send(),
                    (err) => {
                        strictEqual(err.message, "This method is for the owner only");
                        return true
                    }
                );
            });
            it('Invalid proposal id', async function () {
                Tezos.setSignerProvider(signerAlice)
                await rejects(
                    contract.methods.banProposal(1).send(),
                    (err) => {
                        strictEqual(err.message, "Invalid proposal id");
                        return true
                    }
                );
            });
            it('Successfully ban proposal', async function () {
                Tezos.setSignerProvider(signerAlice)
                await contract.methods.banProposal(0).send();
                await awaitBanProposal(contract).catch((err)=>{console.log(err)});
                let storage = await contract.storage();
                let proposal = await storage.proposals.get(0)
                notStrictEqual(undefined, proposal.status["banned"])
            });
        });
});

