import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import {
  TOKEN_PROGRAM_ID,
  mintTo,
  getOrCreateAssociatedTokenAccount,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Houses } from '../target/types/houses';
import { getKeypairFromFile } from '../utils/getKeypairFromFile';
import { assert } from 'chai';
import { requestAirdrop } from '../helpers/requestAirdrop';
import { getLocalMint } from '../helpers/getLocalMint';
import { getStakeAccounts } from '../helpers/getStakeAccounts';
import { getData } from '../helpers/getData';
import { getTokenAmount } from '../helpers/getTokenAmount';

export const callStake = async (seed, amount, userAccount) => {
  const {
    mint,
    adminAccount,
    program,
    stakePda,
    stakePdaTokenAccount,
    dataPda,
    userTokenAccount,
  } = await getStakeAccounts(seed, userAccount);

  await program.methods
    .stake(seed, new BN(amount))
    .accounts({
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenMint: mint,
      authority: adminAccount.publicKey,
      stakePda,
      stakePdaTokenAccount: stakePdaTokenAccount.address,
      dataPda,
      userTokenAccount: userTokenAccount.address,
      user: userAccount.publicKey,
    })
    .signers([userAccount])
    .rpc();
};

// describe('stake', () => {
//   const program = anchor.workspace.Houses as Program<Houses>;
//   anchor.setProvider(anchor.AnchorProvider.env());
//   let mint = getLocalMint();
//   const mintAuthority = getKeypairFromFile(
//     '/tests/testAccounts/mintAuthority.json'
//   );
//   const userAccount = anchor.web3.Keypair.generate();
//   const connection = program.provider.connection;

//   before(async () => {
//     await requestAirdrop(connection, userAccount.publicKey, 10e6);
//     // mint tokens
//     const userTokenAccount = await getOrCreateAssociatedTokenAccount(
//       connection,
//       userAccount,
//       mint,
//       userAccount.publicKey
//     );
//     await mintTo(
//       connection,
//       userAccount,
//       mint,
//       userTokenAccount.address,
//       mintAuthority,
//       1000
//     );
//   });

//   it('Stake', async () => {
//     const seed = 'some.email@gmail.com';

//     const { stakePdaTokenAccount, userTokenAccount } = await getStakeAccounts(
//       seed,
//       userAccount
//     );

//     assert.equal((await getData()).stacked, 0);
//     assert.equal(await getTokenAmount(userTokenAccount), BigInt(1000));
//     assert.equal(await getTokenAmount(stakePdaTokenAccount), BigInt(0));

//     await callStake(seed, 100, userAccount);

//     assert.equal((await getData()).stacked, 100);
//     assert.equal(await getTokenAmount(userTokenAccount), BigInt(900));
//     assert.equal(await getTokenAmount(stakePdaTokenAccount), BigInt(100));

//     await callStake(seed, 200, userAccount);

//     assert.equal((await getData()).stacked, 300);
//     assert.equal(await getTokenAmount(userTokenAccount), BigInt(700));
//     assert.equal(await getTokenAmount(stakePdaTokenAccount), BigInt(300));
//   });
// });
// // TODO: add failed stake test
// // TODO: think new tests
