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

export const callStake = async (amount, userAccount) => {
  const {
    mint,
    program,
    stakePda,
    stakeTokenAccount,
    dataPda,
    userTokenAccount,
  } = await getStakeAccounts(userAccount);

  await program.methods
    .stake(new BN(amount))
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

describe('stake', () => {
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
  });

  it('Stake', async () => {
    const { stakeTokenAccount, userTokenAccount, stakePda } =
      await getStakeAccounts(userAccount);
    const stakedBefore = (await getData()).stacked;
    const stackeTokenAccountBefore = await getTokenAmount(stakeTokenAccount);
    assert.equal(await getTokenAmount(userTokenAccount), BigInt(1000));
    await callStake(100, userAccount);
    let { lastRewardIndex, stacked: stakePdaStaked } =
      await program.account.stakePda.fetch(stakePda);
    const { rewardIndex } = await getData();
    assert.equal(lastRewardIndex, rewardIndex);
    assert.equal((await getData()).stacked, stakedBefore + 100);
    assert.equal(await getTokenAmount(userTokenAccount), BigInt(900));
    assert.equal(stakePdaStaked.toNumber(), 100);
    assert.equal(
      await getTokenAmount(stakeTokenAccount),
      stackeTokenAccountBefore + BigInt(100)
    );

    await callStake(200, userAccount);
    ({ stacked: stakePdaStaked } = await program.account.stakePda.fetch(
      stakePda
    ));
    assert.equal((await getData()).stacked, stakedBefore + 300);
    assert.equal(await getTokenAmount(userTokenAccount), BigInt(700));
    assert.equal(stakePdaStaked.toNumber(), 300);
    assert.equal(
      await getTokenAmount(stakeTokenAccount),
      stackeTokenAccountBefore + BigInt(300)
    );
  });
});
// TODO: add failed stake test
// TODO: add test with add reward
