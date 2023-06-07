import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
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
    await callStake(1000, randomWallet);
    // await callAddReward(500);
  });

  it('claim reward', async () => {
    const { rewardTokenAccount, dataPda, userRewardTokenAccount, stakePda } =
      await getStakeAccounts(randomWallet);
    // console.log(await getAccount(connection, userRewardTokenAccount.address));
    await callClaimReward(randomWallet);
    // console.log(await getAccount(connection, userRewardTokenAccount.address));
  });
});
