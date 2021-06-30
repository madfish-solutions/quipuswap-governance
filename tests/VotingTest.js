const { Tezos, signerAlice, signerBob } = require("./utils/cli");
const { migrate } = require("../scripts/helpers");

const { rejects, strictEqual} = require("assert")

const { confirmContract } = require('./utils/confirmation');

// async function awaitNewVote(contract, beforeCount) {
//     do {
//         var storage = await contract.storage();
//      } while ( storage.id_count.toNumber() === beforeCount)
// };


describe('Voting test', async function () {
    let contract;
    before(async () => {
        try {
            Tezos.setSignerProvider(signerAlice);
            const { storages } = require("./storage/storage");
            let deployedContract = await migrate(Tezos, "Governance", storages["withProposals"]);
            contract = await confirmContract(Tezos, deployedContract);
        } catch (e) { console.log(e) }
    });

    describe('Testing entrypoint: addVote', async function () {
        it('Invalid proposal id', async function () {
            await rejects(
                contract.methods.vote("10", "for", "unit").send(),
                (err) => {
                    strictEqual(err.message, "Invalid proposal id");
                    return true
                }
            );
        });
        it('The voting period is over', async function () {
            await rejects(
                contract.methods.vote("3", "for", "unit").send(),
                (err) => {
                    strictEqual(err.message, "The voting period is over");
                    return true
                }
            );
        });
        it('Voting has not started yet', async function () {
            await rejects(
                contract.methods.vote("0", "for", "unit").send(),
                (err) => {
                    strictEqual(err.message, "Voting has not started yet");
                    return true
                }
            );
        });
        it('This proposal has been blocked by the administrator', async function () {
            await rejects(
                contract.methods.vote("2", "for", "unit").send(),
                (err) => {
                    strictEqual(err.message, "This proposal has been blocked by the administrator");
                    return true
                }
            );
        });
        // it('You have already voted for this proposal', async function () {
        //     await rejects(
        //         contract.methods.vote("4", "for", "unit").send(),
        //         (err) => {
        //             strictEqual(err.message, "You have already voted for this proposal");
        //             return true
        //         }
        //     );
        // });

    });
});



