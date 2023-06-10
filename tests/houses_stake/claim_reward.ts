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
import { assert, use } from 'chai';
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
    stakePdaTokenAccount,
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
      stakePdaTokenAccount: stakePdaTokenAccount.address,
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
  const adminAccount = getKeypairFromFile(
    '/tests/testAccountsLocal/payer.json'
  );
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
    const {
      rewardTokenAccount,
      dataPda,
      userRewardTokenAccount,
      stakePda,
      stakePdaTokenAccount,
    } = await getStakeAccounts(randomWallet);
    const userRewardAmountBefore = (
      await getAccount(connection, userRewardTokenAccount.address)
    ).amount;
    await callStake(1000, randomWallet);
    const { lastReward } = await program.account.stakePda.fetch(stakePda);
    await callAddReward(500);
    const { currentReward, stacked, rewardsHistory, stackedHistory } =
      await program.account.data.fetch(dataPda);
    const userStacked = +(
      await getAccount(connection, stakePdaTokenAccount.address)
    ).amount.toString();
    let sum = 0;
    for (let i = lastReward + 1; i <= currentReward; i++) {
      const stackHistory = new BN(stackedHistory[i]).toNumber();
      const rewardHistory = new BN(rewardsHistory[i]).toNumber();
      const percent = userStacked / stackHistory;
      sum += percent * rewardHistory;
    }
    await callClaimReward(randomWallet);
    assert.equal(
      (await getAccount(connection, userRewardTokenAccount.address)).amount,
      BigInt(Math.floor(sum))
    );
    const { lastReward: lastRewardAfter } =
      await program.account.stakePda.fetch(stakePda);
    assert.equal(lastRewardAfter, currentReward);
  });
});
