import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { HousesStake } from '../../target/types/houses_stake';
import { requestAirdrop } from '../../helpers/requestAirdrop';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  mintTo,
} from '@solana/spl-token';
import { getLocalRewardMint } from '../../helpers/getLocalRewardMint';
import { assert } from 'chai';
import { getStakeAccounts } from '../../helpers/houses_stake/getStakeAccounts';

export const callAddReward = async (amount) => {
  const rewardMint = getLocalRewardMint();
  const {
    adminAccount,
    dataPda,
    program,
    authorityTokenAccount,
    rewardTokenAccount,
    connection,
    mintAuthority,
  } = await getStakeAccounts();
  await requestAirdrop(connection, adminAccount.publicKey, 5 * 10e5);
  await mintTo(
    connection,
    adminAccount,
    rewardMint,
    authorityTokenAccount.address,
    mintAuthority,
    1500
  );

  await program.methods
    .addReward(new BN(amount))
    .accounts({
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      dataPda,
      rewardTokenAccount,
      authorityTokenAccount: authorityTokenAccount.address,
      authority: adminAccount.publicKey,
    })
    .signers([adminAccount])
    .rpc();
};

describe('add reward', () => {
  const program = anchor.workspace.HousesStake as Program<HousesStake>;
  anchor.setProvider(anchor.AnchorProvider.env());
  const connection = program.provider.connection;

  it('add reward', async () => {
    const { dataPda, rewardTokenAccount } = await getStakeAccounts();

    let dataAccount = await program.account.data.fetch(dataPda);
    const rewardIndexBefore = dataAccount.rewardIndex;
    const rewardAmountBalanceBefore = (
      await getAccount(connection, rewardTokenAccount)
    ).amount;
    let { stacked: stackedBefore } = dataAccount;
    await callAddReward(1000);
    const rewardAmountBalance = (
      await getAccount(connection, rewardTokenAccount)
    ).amount;
    assert.equal(rewardAmountBalance, rewardAmountBalanceBefore + BigInt(1000));
    const { rewardIndex, stacked, previousStacked } =
      await program.account.data.fetch(dataPda);
    assert.equal(rewardIndexBefore + 1, rewardIndex);
    assert.equal(0, stacked.toNumber());
    assert.equal(stackedBefore.toNumber(), previousStacked.toNumber());
  });
});
