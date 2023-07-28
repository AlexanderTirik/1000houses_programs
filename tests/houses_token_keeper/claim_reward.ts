import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { HousesTokenKeeper } from '../../target/types/houses_token_keeper';
import { getKeypairFromFile } from '../../utils/getKeypairFromFile';
import { requestAirdrop } from '../../helpers/requestAirdrop';
import { PublicKey } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  mintTo,
} from '@solana/spl-token';
import { getLocalMint } from '../../helpers/getLocalMint';
import { getTokenKeeperAccounts } from '../../helpers/houses_token_keeper/getTokenKeeperAccounts';
import { getStakeAccounts } from '../../helpers/houses_stake/getStakeAccounts';
import { HousesStake } from '../../target/types/houses_stake';
import { getRandomEmail } from '../../utils/getRandomEmail';
import { assert } from 'chai';
import { getTokenAmount } from '../../helpers/getTokenAmount';
import { callAddReward } from '../houses_stake/add_reward';
import { cpiStake } from './stake';

export const cpiClaimReward = async (email) => {
  const program = anchor.workspace
    .HousesTokenKeeper as Program<HousesTokenKeeper>;
  const { userPda, userRewardTokenAccount } = await getTokenKeeperAccounts(
    email
  );
  const [stakePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('stake', 'utf8'), userPda.toBuffer()],
    anchor.workspace.HousesStake.programId
  );
  const adminAccount = getKeypairFromFile(
    '/tests/testAccountsLocal/payer.json'
  );

  const {
    dataPda,
    rewardTokenAccount,
    mint: tokenMint,
    rewardMint,
  } = await getStakeAccounts(adminAccount);

  await program.methods
    .claimReward(email)
    .accounts({
      stakeProgram: anchor.workspace.HousesStake.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rewardMint,
      tokenMint,
      stakePda,
      dataPda,
      userPda,
      rewardTokenAccount,
      userRewardTokenAccount: userRewardTokenAccount.address,
      authority: adminAccount.publicKey,
    })
    .signers([adminAccount])
    .rpc();
};

describe('cpi claim reward', () => {
  const program = anchor.workspace
    .HousesTokenKeeper as Program<HousesTokenKeeper>;

  const stakeProgram = anchor.workspace.HousesStake as Program<HousesStake>;

  anchor.setProvider(anchor.AnchorProvider.env());
  const adminAccount = getKeypairFromFile(
    '/tests/testAccountsLocal/payer.json'
  );
  const connection = program.provider.connection;
  const tokenMint = getLocalMint();
  const mintAuthority = getKeypairFromFile(
    '/tests/testAccountsLocal/mintAuthority.json'
  );
  const email = getRandomEmail();

  before(async () => {
    await requestAirdrop(connection, adminAccount.publicKey, 5 * 10e5);
    const { userPdaTokenAccount } = await getTokenKeeperAccounts(email);
    await mintTo(
      connection,
      adminAccount,
      tokenMint,
      userPdaTokenAccount.address,
      mintAuthority,
      1000
    );
    await callAddReward(1);
    await cpiStake(email, 500);
    await callAddReward(1000);
  });

  it('claim reward', async () => {
    const { userPda, userRewardTokenAccount } = await getTokenKeeperAccounts(
      email
    );
    const [stakePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('stake', 'utf8'), userPda.toBuffer()],
      anchor.workspace.HousesStake.programId
    );

    let { stacked } = await stakeProgram.account.stakePda.fetch(stakePda);
    assert.equal(stacked.toNumber(), 500);
    assert.equal(await getTokenAmount(userRewardTokenAccount), BigInt(0));
    await cpiClaimReward(email);
    assert.equal(await getTokenAmount(userRewardTokenAccount), BigInt(1000));

    ({ stacked } = await stakeProgram.account.stakePda.fetch(stakePda));
    assert.equal(stacked.toNumber(), 0);
  });
});
