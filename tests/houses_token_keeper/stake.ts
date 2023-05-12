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
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import { getLocalMint } from '../../helpers/getLocalMint';
import { getTokenKeeperAccounts } from '../../helpers/houses_token_keeper/getTokenKeeperAccounts';
import { getStakeAccounts } from '../../helpers/houses_stake/getStakeAccounts';
import { HousesStake } from '../../target/types/houses_stake';
import { getRandomEmail } from '../../utils/getRandomEmail';
import { assert } from 'chai';
import { getTokenAmount } from '../../helpers/getTokenAmount';

export const cpiStake = async (email, amount) => {
  const program = anchor.workspace
    .HousesTokenKeeper as Program<HousesTokenKeeper>;
  const stakeProgram = anchor.workspace.HousesStake as Program<HousesStake>;
  const connection = program.provider.connection;

  const { userPda, userPdaTokenAccount } = await getTokenKeeperAccounts(email);
  const [stakePda] = PublicKey.findProgramAddressSync(
    [Buffer.from(email, 'utf8'), userPda.toBuffer()],
    anchor.workspace.HousesStake.programId
  );
  const adminAccount = getKeypairFromFile('/tests/testAccounts/payer.json');

  const { dataPda, mint: tokenMint } = await getStakeAccounts(
    email,
    adminAccount
  );
  const stakePdaTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    adminAccount,
    tokenMint,
    stakePda,
    true // allowOwnerOffCurve - allow pda keep tokens
  );
  try {
    await stakeProgram.account.stakePda.fetch(stakePda);
  } catch (e) {
    await stakeProgram.methods
      .signup(email)
      .accounts({
        systemProgram: anchor.web3.SystemProgram.programId,
        stakePda,
        userPda,
        authority: adminAccount.publicKey,
      })
      .signers([adminAccount])
      .rpc();
  }

  await program.methods
    .stake(email, new BN(amount))
    .accounts({
      stakeProgram: anchor.workspace.HousesStake.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenMint,
      userPda,
      userPdaTokenAccount: userPdaTokenAccount.address,
      stakePda,
      stakePdaTokenAccount: stakePdaTokenAccount.address,
      dataPda,
      authority: adminAccount.publicKey,
    })
    .signers([adminAccount])
    .rpc();
};

describe('cpi stake', () => {
  const program = anchor.workspace
    .HousesTokenKeeper as Program<HousesTokenKeeper>;

  const stakeProgram = anchor.workspace.HousesStake as Program<HousesStake>;
  anchor.setProvider(anchor.AnchorProvider.env());
  const adminAccount = getKeypairFromFile('/tests/testAccounts/payer.json');
  const connection = program.provider.connection;
  const tokenMint = getLocalMint();
  const mintAuthority = getKeypairFromFile(
    '/tests/testAccounts/mintAuthority.json'
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
  });

  it('stake', async () => {
    const { userPda, userPdaTokenAccount } = await getTokenKeeperAccounts(
      email
    );
    const [stakePda] = PublicKey.findProgramAddressSync(
      [Buffer.from(email, 'utf8'), userPda.toBuffer()],
      anchor.workspace.HousesStake.programId
    );

    const stakePdaTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      adminAccount,
      tokenMint,
      stakePda,
      true // allowOwnerOffCurve - allow pda keep tokens
    );

    assert.equal(await getTokenAmount(userPdaTokenAccount), BigInt(1000));
    await cpiStake(email, 300);

    assert.equal(await getTokenAmount(stakePdaTokenAccount), BigInt(300));
    assert.equal(await getTokenAmount(userPdaTokenAccount), BigInt(700));
  });
});
