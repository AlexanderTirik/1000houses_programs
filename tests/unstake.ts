import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import {
  TOKEN_PROGRAM_ID,
  mintTo,
  getOrCreateAssociatedTokenAccount,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { HousesStake } from '../target/types/houses_stake';
import { getKeypairFromFile } from '../utils/getKeypairFromFile';
import { assert } from 'chai';
import { requestAirdrop } from '../helpers/requestAirdrop';
import { getLocalMint } from '../helpers/getLocalMint';
import { getStakeAccounts } from '../helpers/getStakeAccounts';
import { getData } from '../helpers/getData';
import { getTokenAmount } from '../helpers/getTokenAmount';
import { callStake } from './stake';

export const callUnstake = async (seed, amount, userAccount) => {
  const {
    mint,
    program,
    stakePda,
    stakePdaTokenAccount,
    dataPda,
    userTokenAccount,
    adminAccount,
  } = await getStakeAccounts(seed, userAccount);

  await program.methods
    .unstake(seed, new BN(amount))
    .accounts({
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenMint: mint,
      stakePda,
      authority: adminAccount.publicKey,
      stakePdaTokenAccount: stakePdaTokenAccount.address,
      dataPda,
      userTokenAccount: userTokenAccount.address,
      user: userAccount.publicKey,
    })
    .signers([userAccount])
    .rpc();
};

describe('unstake', () => {
  const program = anchor.workspace.HousesStake as Program<HousesStake>;
  anchor.setProvider(anchor.AnchorProvider.env());
  let mint = getLocalMint();
  const mintAuthority = getKeypairFromFile(
    '/tests/testAccounts/mintAuthority.json'
  );
  const userAccount = anchor.web3.Keypair.generate();
  const connection = program.provider.connection;
  const seed = 'some.email@gmail.com';

  before(async () => {
    await requestAirdrop(connection, userAccount.publicKey, 10e6);
    // mint tokens
    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      userAccount,
      mint,
      userAccount.publicKey
    );
    await mintTo(
      connection,
      userAccount,
      mint,
      userTokenAccount.address,
      mintAuthority,
      1000
    );

    await callStake(seed, 300, userAccount);
  });

  it('Unstake', async () => {
    const { stakePdaTokenAccount, userTokenAccount } = await getStakeAccounts(
      seed,
      userAccount
    );
    let { stacked } = await getData();
    assert.equal(await getTokenAmount(userTokenAccount), BigInt(700));
    assert.equal(await getTokenAmount(stakePdaTokenAccount), BigInt(300));

    await callUnstake(seed, 100, userAccount);

    assert.equal(stacked - 100, (await getData()).stacked);
    assert.equal(await getTokenAmount(userTokenAccount), BigInt(800));
    assert.equal(await getTokenAmount(stakePdaTokenAccount), BigInt(200));

    await callUnstake(seed, 200, userAccount);

    assert.equal(stacked - 300, (await getData()).stacked);
    assert.equal(await getTokenAmount(userTokenAccount), BigInt(1000));
    assert.equal(await getTokenAmount(stakePdaTokenAccount), BigInt(0));
  });
});
