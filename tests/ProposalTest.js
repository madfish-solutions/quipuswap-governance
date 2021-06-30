const { rejects, strictEqual } = require("assert");
const { Tezos, signerAlice } = require("./utils/cli");

const { confirmContract } = require('./utils/confirmation');

async function awaitNewProposal(contract, beforeCount) {
    do {
        var storage = await contract.storage();
     } while ( storage.id_count.toNumber() === beforeCount)
};

const { migrate } = require("../scripts/helpers");

describe('Proposal test', async function () {
    Tezos.setSignerProvider(signerAlice)
    let contract;

    before(async () => {
        try {
            const storage = require("../storage/Governance");
            let deployedContract = await migrate(Tezos, "Governance", storage);
            contract = await confirmContract(Tezos, deployedContract)
        } catch (e) { console.log(e) }
    });

    let ipfs_link = Buffer.from("ipfsLink", "ascii").toString('hex');
    let forum_link = Buffer.from("forumLink", "ascii").toString('hex');

    describe('Testing entrypoint: NewProposal', async function () {
        it('Minimum voting period 3 days', async function () {
            await rejects(
                contract.methods.newProposal(ipfs_link, forum_link, 2).send(),
                (err) => {
                    strictEqual(err.message, "Minimum voting period 3 days");
                    return true
                }
            );
        });
        it('Maxium voting period 30 days', async function () {
            await rejects(
                contract.methods.newProposal(ipfs_link, forum_link, 31).send(),
                (err) => {
                    strictEqual(err.message, "Maxium voting period 30 days");
                    return true
                }
            );
        });
        it('Successful new proposal', async function () {
            await contract.methods.newProposal(ipfs_link, forum_link, 3).send();
            await awaitNewProposal(contract, 0);

            let storage = await contract.storage();
            strictEqual(1, storage.id_count.toNumber())
        });
    });
    describe('Testing entrypoint: NewDeferredProposal', async function () {
        it('Minimum voting period 3 days', async function () {
            await rejects(
                contract.methods.newDeferredProposal(ipfs_link, forum_link, 2, 5).send(),
                (err) => {
                    strictEqual(err.message, "Minimum voting period 3 days");
                    return true
                }
            );
        });
        it('Maxium voting period 30 days', async function () {
            await rejects(
                contract.methods.newDeferredProposal(ipfs_link, forum_link, 31, 5).send(),
                (err) => {
                    strictEqual(err.message, "Maxium voting period 30 days");
                    return true
                }
            );
        });
        it("Deferral can't be longer than 30 days", async function () {
            await rejects(
                contract.methods.newDeferredProposal(ipfs_link, forum_link, 4, 31).send(),
                (err) => {
                    strictEqual(err.message, "Deferral can't be longer than 30 days");
                    return true
                }
            );
        });
        it('Successful new deferred proposal', async function () {
            await contract.methods.newDeferredProposal(ipfs_link, forum_link, 3, 3).send();
            await awaitNewProposal(contract, 1);

            let storage = await contract.storage();
            strictEqual(2, storage.id_count.toNumber())
        });
    });
});



