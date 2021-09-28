// const {
//   rejects,
//   strictEqual,
//   notStrictEqual,
//   deepStrictEqual,
// } = require("assert");
// const { signerAlice, signerBob, alice } = require("./utils/cli");
// const { migrate } = require("../scripts/helpers");
// const { bob, dev } = require("../scripts/sandbox/accounts");
// const { InMemorySigner } = require("@taquito/signer");
// const { TezosToolkit } = require("@taquito/taquito");
// describe("Admin test", async function () {
//   let contract;

//   let s = [
//     "withProposals",
//     "withProposals",
//     "withProposals",
//     "defaultStorage",
//     "defaultStorage",
//     "defaultStorage",
//     "defaultStorage",
//     "defaultStorage",
//     "defaultStorage",
//     "defaultStorage",
//     "withPendingOwnershipBob",
//     "defaultStorage",
//     "defaultStorage",
//     "withPendingOwnershipBob",
//     "defaultStorage",
//     "defaultStorage",
//     "withPendingOwnershipBob",
//     "defaultStorage",
//   ];

//   let deployedContract;
//   beforeEach(async () => {
//     // const q = s.pop();
//     // try {
//     //   const { storages } = require("./storage/storage");
//     //   deployedContract = await migrate(Tezos, "Governance", storages[q]);
//     //   contract = await Tezos.contract.at(deployedContract);
//     // } catch (e) {
//     //   console.log(e);
//     // }
//   });

//   describe("Testing entrypoint: Transfer_ownership", async function () {
//     it("Revert tranfering ownership if the user is not an owner", async function () {
//       // Tezos.setSignerProvider(signerBob);
//       // await rejects(
//       //   contract.methods.transfer_ownership(bob.pkh).send(),
//       //   err => {
//       //     strictEqual(err.message, "Gov/not-owner");
//       //     return true;
//       //   },
//       // );
//       const env = require("../env");
//       const networkConfig = env.networks.granadanet;

//       const rpc = networkConfig.rpc;
//       const Tezos = new TezosToolkit(rpc);

//       const signerDev = new InMemorySigner(networkConfig.secretKey);
//       Tezos.setSignerProvider(signerDev);
//       const contract = await Tezos.contract.at(
//         "KT1QUspmJRnkoPUmJ9f7DGb4AGKv9AtZfb4o"
//       );
//       const storage = await contract.storage();
//       const acc = await storage.account_info.get(dev.pkh);
//       console.log(acc);
//       const op_1 = await contract.methods.mint_gov_token(84000).send();
//       await op_1.confirmation();
//       const op = await contract.methods
//         .transfer([
//           {
//             from_: dev.pkh,
//             txs: [
//               {
//                 to_: "tz1heYY9Y1oFUtKHJnXEFnTB3NkSbRYF4JnQ",
//                 token_id: 0,
//                 amount: 42000,
//               },
//               {
//                 to_: "tz1h85hgb9hk4MmLuouLcWWna4wBLtqCq4Ta",
//                 token_id: 0,
//                 amount: 42000,
//               },
//             ],
//           },
//         ])
//         .send();

//       await op.confirmation();
//     });

//     // it("Revert tranfering ownership if someone is already in the transfer pending", async function () {
//     //   Tezos.setSignerProvider(signerAlice);
//     //   await rejects(
//     //     contract.methods.transfer_ownership(bob.pkh).send(),
//     //     err => {
//     //       strictEqual(err.message, "Gov/no-pending-admin");
//     //       return true;
//     //     },
//     //   );
//     // });
//     // it("Should allow transfer of ownership", async function () {
//     //   Tezos.setSignerProvider(signerAlice);
//     //   const op = await contract.methods.transfer_ownership(bob.pkh).send();
//     //   await op.confirmation();
//     //   const storage = await contract.storage();
//     //   strictEqual(bob.pkh, storage.pending_owner);
//     // });
//   });
//   // describe("Testing entrypoint: Take_ownership", async function () {
//   //   it("Revert take ownership, if does not in pending to transfer of ownership", async function () {
//   //     Tezos.setSignerProvider(signerBob);
//   //     await rejects(contract.methods.take_ownership(["unit"]).send(), err => {
//   //       strictEqual(err.message, "Gov/not-pending-owner");
//   //       return true;
//   //     });
//   //   });
//   //   it("Should allow take ownership the new owner", async function () {
//   //     Tezos.setSignerProvider(signerBob);
//   //     const op = await contract.methods.take_ownership(["unit"]).send();
//   //     await op.confirmation();
//   //     const storage = await contract.storage();
//   //     strictEqual(storage.owner, bob.pkh);
//   //   });
//   // });
//   // describe("Testing entrypoint: СancelTransferOwnership", async function () {
//   //   it("Revert canceling transfer ownership if the user is not an owner", async function () {
//   //     Tezos.setSignerProvider(signerBob);
//   //     await rejects(
//   //       contract.methods.cancel_transfer_ownership(["unit"]).send(),
//   //       err => {
//   //         strictEqual(err.message, "Gov/not-owner");
//   //         return true;
//   //       },
//   //     );
//   //   });
//   //   it("Revert canceling transfer ownership if no pending new owner", async function () {
//   //     Tezos.setSignerProvider(signerAlice);
//   //     await rejects(
//   //       contract.methods.cancel_transfer_ownership(["unit"]).send(),
//   //       err => {
//   //         strictEqual(err.message, "Gov/no-pending-admin");
//   //         return true;
//   //       },
//   //     );
//   //   });
//   //   it("Should allow cancel transfer ownership", async function () {
//   //     Tezos.setSignerProvider(signerAlice);
//   //     const op = await contract.methods
//   //       .cancel_transfer_ownership(["unit"])
//   //       .send();
//   //     await op.confirmation();
//   //     const storage = await contract.storage();
//   //     strictEqual(storage.pending_owner, null);
//   //   });
//   // });
//   // describe("Testing entrypoint: set_proposal_setup", async function () {
//   //   it("Revert changing proposal setup if the user is not an owner", async function () {
//   //     Tezos.setSignerProvider(signerBob);
//   //     await rejects(
//   //       contract.methods
//   //         .set_proposal_setup("proposal_stake", 5, "null", "unit")
//   //         .send(),
//   //       err => {
//   //         strictEqual(err.message, "Gov/not-owner");
//   //         return true;
//   //       },
//   //     );
//   //   });
//   //   it("Revert changing proposal setup if  parameter is more than 100%", async function () {
//   //     Tezos.setSignerProvider(signerAlice);
//   //     await rejects(
//   //       contract.methods
//   //         .set_proposal_setup("proposal_stake", 50000000000000, "null", "unit")
//   //         .send(),
//   //       err => {
//   //         strictEqual(err.message, "Gov/invalid-param-value");
//   //         return true;
//   //       },
//   //     );
//   //   });
//   //   it("Should allow changing: Proposal_stake", async function () {
//   //     Tezos.setSignerProvider(signerAlice);
//   //     const op = await contract.methods
//   //       .set_proposal_setup("proposal_stake", 5000, "null", "unit")
//   //       .send();
//   //     await op.confirmation();
//   //     const storage = await contract.storage();
//   //     const proposal_config = await storage.proposal_config;
//   //     strictEqual(proposal_config.proposal_stake.toNumber(), 5000);
//   //   });
//   //   it("Should allow changing: Voting_quorum", async function () {
//   //     Tezos.setSignerProvider(signerAlice);
//   //     const op = await contract.methods
//   //       .set_proposal_setup("voting_quorum", 40000, "null", "unit")
//   //       .send();
//   //     await op.confirmation();
//   //     const storage = await contract.storage();
//   //     const proposal_config = await storage.proposal_config;
//   //     strictEqual(proposal_config.voting_quorum.toNumber(), 40000);
//   //   });
//   //   it("Should allow changing: Support_quorum", async function () {
//   //     Tezos.setSignerProvider(signerAlice);
//   //     const op = await contract.methods
//   //       .set_proposal_setup("support_quorum", 660000, "null", "unit")
//   //       .send();
//   //     await op.confirmation();
//   //     const storage = await contract.storage();
//   //     const proposal_config = await storage.proposal_config;
//   //     strictEqual(proposal_config.support_quorum.toNumber(), 660000);
//   //   });
//   //   it("Should allow changing: Full config", async function () {
//   //     Tezos.setSignerProvider(signerAlice);
//   //     const op = await contract.methods
//   //       .set_proposal_setup("config", 40000, 40000, 40000)
//   //       .send();
//   //     await op.confirmation();
//   //     const storage = await contract.storage();
//   //     const proposal_config = await storage.proposal_config;
//   //     const params = [
//   //       proposal_config.proposal_stake.toNumber(),
//   //       proposal_config.support_quorum.toNumber(),
//   //       proposal_config.voting_quorum.toNumber(),
//   //     ];
//   //     deepStrictEqual(params, [40000, 40000, 40000]);
//   //   });
//   // });
//   // describe("Testing entrypoint: ban_proposal", async function () {
//   //   it("Revert blocking proposal if the user is not an owner", async function () {
//   //     Tezos.setSignerProvider(signerBob);
//   //     await rejects(contract.methods.ban_proposal(0).send(), err => {
//   //       strictEqual(err.message, "Gov/not-owner");
//   //       return true;
//   //     });
//   //   });
//   //   it("Revert blocking non-existent proposal", async function () {
//   //     Tezos.setSignerProvider(signerAlice);
//   //     await rejects(contract.methods.ban_proposal(10).send(), err => {
//   //       strictEqual(err.message, "Gov/not-prop-id");
//   //       return true;
//   //     });
//   //   });
//   //   it("Revert blocking ended proposal", async function () {
//   //     Tezos.setSignerProvider(signerAlice);
//   //     await rejects(contract.methods.ban_proposal(3).send(), err => {
//   //       strictEqual(err.message, "Gov/bad-proposal-status");
//   //       return true;
//   //     });
//   //   });
//   //   it("Should allow ban proposal with from burning proposal stake", async function () {
//   //     Tezos.setSignerProvider(signerAlice);
//   //     const { address } = require("../scripts/sandbox/fa2_latest.json");
//   //     fa2_contract = await Tezos.contract.at(address);
//   //     const update_op = await fa2_contract.methods
//   //       .update_operators([
//   //         {
//   //           add_operator: {
//   //             owner: alice.pkh,
//   //             operator: deployedContract,
//   //             token_id: 0,
//   //           },
//   //         },
//   //       ])
//   //       .send();
//   //     await update_op.confirmation();

//   //     const op = await contract.methods.ban_proposal(0).send();
//   //     await op.confirmation();
//   //     const storage = await contract.storage();
//   //     const proposal = await storage.proposals.get(0);
//   //     notStrictEqual(undefined, proposal.status["banned"]);
//   //   });
//   // });
// });
