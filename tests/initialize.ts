// import * as anchor from '@coral-xyz/anchor';
// import { Program, BN } from '@coral-xyz/anchor';
// import { PublicKey } from '@solana/web3.js';
// import { Houses } from '../target/types/houses';
// import { assert } from 'chai';
// import { requestAirdrop } from '../helpers/requestAirdrop';
// import { getKeypairFromFile } from '../utils/getKeypairFromFile';

// describe('initialize', () => {
//   const program = anchor.workspace.Houses as Program<Houses>;
//   anchor.setProvider(anchor.AnchorProvider.env());
//   const adminAccount = getKeypairFromFile('/tests/testAccounts/payer.json');
//   const connection = program.provider.connection;

//   before(async () => {
//     await requestAirdrop(connection, adminAccount.publicKey, 5 * 10e5);
//   });

//   it('Initialize', async () => {
//     const [dataPda] = PublicKey.findProgramAddressSync(
//       [
//         anchor.utils.bytes.utf8.encode('data'),
//         adminAccount.publicKey.toBuffer(),
//       ],
//       program.programId
//     );
//     await program.methods
//       .initialize()
//       .accounts({
//         systemProgram: anchor.web3.SystemProgram.programId,
//         dataPda,
//         user: adminAccount.publicKey,
//       })
//       .signers([adminAccount])
//       .rpc();
//     const dataAccount = await program.account.data.fetch(dataPda);
//     assert.exists(dataAccount.bump);
//     assert.equal(new BN(dataAccount.stacked).toNumber(), 0);
//   });

//   it('Second Initialize', async () => {
//     const [dataPda] = PublicKey.findProgramAddressSync(
//       [
//         anchor.utils.bytes.utf8.encode('data'),
//         adminAccount.publicKey.toBuffer(),
//       ],
//       program.programId
//     );
//     let error;
//     try {
//       await program.methods
//         .initialize()
//         .accounts({
//           systemProgram: anchor.web3.SystemProgram.programId,
//           dataPda,
//           user: adminAccount.publicKey,
//         })
//         .signers([adminAccount])
//         .rpc();
//     } catch (err) {
//       error = err;
//     }
//     assert.equal(
//       error.message,
//       'failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x0'
//     );
//   });
// });
