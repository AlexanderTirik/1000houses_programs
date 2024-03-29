import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import {
  TOKEN_PROGRAM_ID,
  mintTo,
  getOrCreateAssociatedTokenAccount,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { HousesStake } from '../../target/types/houses_stake';
import { getKeypairFromFile } from '../../utils/getKeypairFromFile';
import { assert } from 'chai';
import { requestAirdrop } from '../../helpers/requestAirdrop';
import { getLocalMint } from '../../helpers/getLocalMint';
import { getStakeAccounts } from '../../helpers/houses_stake/getStakeAccounts';
import { getData } from '../../helpers/houses_stake/getData';
import { getTokenAmount } from '../../helpers/getTokenAmount';
import { callStake } from './stake';

export const callUnstake = async (amount, userAccount) => {
  const {
    mint,
    program,
    stakePda,
    stakeTokenAccount,
    dataPda,
    userTokenAccount,
  } = await getStakeAccounts(userAccount);

  await program.methods
    .unstake(new BN(amount))
    .accounts({
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenMint: mint,
      stakePda,
      stakeTokenAccount,
      dataPda,
      ownerTokenAccount: userTokenAccount.address,
      owner: userAccount.publicKey,
    })
    .signers([userAccount])
    .rpc();
};

describe('unstake', () => {
  const program = anchor.workspace.HousesStake as Program<HousesStake>;
  anchor.setProvider(anchor.AnchorProvider.env());
  let mint = getLocalMint();
  const mintAuthority = getKeypairFromFile(
    '/tests/testAccountsLocal/mintAuthority.json'
  );
  const userAccount = anchor.web3.Keypair.generate();
  const connection = program.provider.connection;

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

    await callStake(300, userAccount);
  });

  it('Unstake', async () => {
    const { stakeTokenAccount, userTokenAccount, stakePda } =
      await getStakeAccounts(userAccount);
    let { stacked } = await getData();
    let { stacked: stakePdaStacked } = await program.account.stakePda.fetch(
      stakePda
    );
    let stakeTokenAccountBalanceBefore = await getTokenAmount(
      stakeTokenAccount
    );
    assert.equal(await getTokenAmount(userTokenAccount), BigInt(700));
    assert.equal(stakePdaStacked.toNumber(), 300);
    await callUnstake(100, userAccount);
    ({ stacked: stakePdaStacked } = await program.account.stakePda.fetch(
      stakePda
    ));
    let stakeTokenAccountBalance = await getTokenAmount(stakeTokenAccount);

    assert.equal(stacked - 100, (await getData()).stacked);
    assert.equal(
      stakeTokenAccountBalance,
      stakeTokenAccountBalanceBefore - BigInt(100)
    );
    assert.equal(await getTokenAmount(userTokenAccount), BigInt(800));
    assert.equal(stakePdaStacked.toNumber(), 200);

    await callUnstake(200, userAccount);
    ({ stacked: stakePdaStacked } = await program.account.stakePda.fetch(
      stakePda
    ));
    stakeTokenAccountBalance = await getTokenAmount(stakeTokenAccount);
    assert.equal(stacked - 300, (await getData()).stacked);
    assert.equal(
      stakeTokenAccountBalance,
      stakeTokenAccountBalanceBefore - BigInt(300)
    );
    assert.equal(await getTokenAmount(userTokenAccount), BigInt(1000));
    assert.equal(stakePdaStacked.toNumber(), 0);
  });
});

// TODO: add failed tests
// TODO: add with different rewards
