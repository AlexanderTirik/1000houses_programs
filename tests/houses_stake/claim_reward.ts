import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { HousesStake } from '../../target/types/houses_stake';
import { requestAirdrop } from '../../helpers/requestAirdrop';
import { getKeypairFromFile } from '../../utils/getKeypairFromFile';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';
import { getLocalRewardMint } from '../../helpers/getLocalRewardMint';
import { assert } from 'chai';
import { callStake } from './stake';
import { getLocalMint } from '../../helpers/getLocalMint';
import { getStakeAccounts } from '../../helpers/houses_stake/getStakeAccounts';
import { callAddReward } from './add_reward';

export const callClaimReward = async (userAccount) => {
  const rewardMint = getLocalRewardMint();
  const {
    dataPda,
    program,
    stakePda,
    mint,
    rewardTokenAccount,
    userRewardTokenAccount,
  } = await getStakeAccounts(userAccount);

  await program.methods
    .claimReward()
    .accounts({
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rewardMint,
      tokenMint: mint,
      stakePda,
      dataPda,
      rewardTokenAccount,
      userRewardTokenAccount: userRewardTokenAccount.address,
      user: userAccount.publicKey,
    })
    .signers([userAccount])
    .rpc();
};

describe('claim reward', () => {
  const program = anchor.workspace.HousesStake as Program<HousesStake>;
  anchor.setProvider(anchor.AnchorProvider.env());
  const mintAuthority = getKeypairFromFile(
    '/tests/testAccountsLocal/mintAuthority.json'
  );
  const connection = program.provider.connection;
  const mint = getLocalMint();
  const randomWallet = anchor.web3.Keypair.generate();
  before(async () => {
    await requestAirdrop(connection, randomWallet.publicKey, 5 * 10e7);

    const randomWalletTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      randomWallet,
      mint,
      randomWallet.publicKey
    );
    await mintTo(
      connection,
      randomWallet,
      mint,
      randomWalletTokenAccount.address,
      mintAuthority,
      1500
    );
  });

  it('claim reward', async () => {
    const { dataPda, userRewardTokenAccount, stakePda } =
      await getStakeAccounts(randomWallet);
    const userRewardAmountBefore = (
      await getAccount(connection, userRewardTokenAccount.address)
    ).amount;
    await callAddReward(1);
    await callStake(1000, randomWallet);
    await callAddReward(500);

    const { stacked } = await program.account.stakePda.fetch(stakePda);
    await callClaimReward(randomWallet);

    const { reward, previousStacked: stackedAll } =
      await program.account.data.fetch(dataPda);

    const rewardCounted = Math.floor(
      (stacked.toNumber() / stackedAll.toNumber()) * reward.toNumber()
    );
    assert.equal(rewardCounted, 500);

    assert.equal(
      (await getAccount(connection, userRewardTokenAccount.address)).amount,
      userRewardAmountBefore + BigInt(500)
    );
    const { stacked: stackedAfter } = await program.account.stakePda.fetch(
      stakePda
    );
    assert.equal(stackedAfter.toNumber(), 0);
  });
});
// add test for two wallets
