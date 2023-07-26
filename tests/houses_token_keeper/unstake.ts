import * as anchor from '@coral-xyz/anchor';
import { BN, Program } from '@coral-xyz/anchor';
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
import { cpiStake } from './stake';

export const cpiUnstake = async (email, amount) => {
  const program = anchor.workspace
    .HousesTokenKeeper as Program<HousesTokenKeeper>;
  const connection = program.provider.connection;

  const { userPda, userPdaTokenAccount } = await getTokenKeeperAccounts(email);
  const [stakePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('stake', 'utf8'), userPda.toBuffer()],
    anchor.workspace.HousesStake.programId
  );
  const adminAccount = getKeypairFromFile(
    '/tests/testAccountsLocal/payer.json'
  );

  const {
    dataPda,
    mint: tokenMint,
    stakeTokenAccount,
  } = await getStakeAccounts(adminAccount);

  await program.methods
    .unstake(email, new BN(amount))
    .accounts({
      stakeProgram: anchor.workspace.HousesStake.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenMint,
      userPda,
      userPdaTokenAccount: userPdaTokenAccount.address,
      stakePda,
      stakeTokenAccount,
      dataPda,
      authority: adminAccount.publicKey,
    })
    .signers([adminAccount])
    .rpc();
};

describe('cpi unstake', () => {
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
    await cpiStake(email, 500);
  });

  it('unstake', async () => {
    const { userPda, userPdaTokenAccount } = await getTokenKeeperAccounts(
      email
    );
    const [stakePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('stake', 'utf8'), userPda.toBuffer()],
      anchor.workspace.HousesStake.programId
    );
    let { stacked } = await stakeProgram.account.stakePda.fetch(stakePda);

    assert.equal(await getTokenAmount(userPdaTokenAccount), BigInt(500));
    assert.equal(stacked.toNumber(), 500);
    await cpiUnstake(email, 300);
    ({ stacked } = await stakeProgram.account.stakePda.fetch(stakePda));
    assert.equal(stacked.toNumber(), 200);
    assert.equal(await getTokenAmount(userPdaTokenAccount), BigInt(800));
  });
});
