import * as anchor from '@coral-xyz/anchor';
import { BN, Program } from '@coral-xyz/anchor';
import { HousesTokenKeeper } from '../../target/types/houses_token_keeper';
import { getKeypairFromFile } from '../../utils/getKeypairFromFile';
import { requestAirdrop } from '../../helpers/requestAirdrop';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  mintTo,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import { getLocalMint } from '../../helpers/getLocalMint';
import { getTokenKeeperAccounts } from '../../helpers/houses_token_keeper/getTokenKeeperAccounts';
import { assert } from 'chai';
import { getTokenAmount } from '../../helpers/getTokenAmount';

describe('output', () => {
  const program = anchor.workspace
    .HousesTokenKeeper as Program<HousesTokenKeeper>;
  anchor.setProvider(anchor.AnchorProvider.env());
  const adminAccount = getKeypairFromFile('/tests/testAccounts/payer.json');
  const connection = program.provider.connection;
  const tokenMint = getLocalMint();
  const mintAuthority = getKeypairFromFile(
    '/tests/testAccounts/mintAuthority.json'
  );
  const email = 'some.email@gmail.com';

  before(async () => {
    await requestAirdrop(connection, adminAccount.publicKey, 5 * 10e5);
    const email = 'some.email@gmail.com';
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

  it('output tokens', async () => {
    const { userPda, userPdaTokenAccount } = await getTokenKeeperAccounts(
      email
    );
    const recipient = anchor.web3.Keypair.generate();
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      adminAccount,
      tokenMint,
      recipient.publicKey
    );
    let recipientTokenAccountBefore = await getTokenAmount(
      recipientTokenAccount
    );
    let userPdaTokenAccountBefore = await getTokenAmount(userPdaTokenAccount);
    await program.methods
      .output(email, new BN(300))
      .accounts({
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMint,
        userPda,
        userPdaTokenAccount: userPdaTokenAccount.address,
        recipient: recipient.publicKey,
        recipientTokenAccount: recipientTokenAccount.address,
        authority: adminAccount.publicKey,
      })
      .signers([adminAccount])
      .rpc();
    assert.equal(
      await getTokenAmount(recipientTokenAccount),
      recipientTokenAccountBefore + BigInt(300)
    );
    assert.equal(
      await getTokenAmount(userPdaTokenAccount),
      userPdaTokenAccountBefore - BigInt(300)
    );
    recipientTokenAccountBefore = await getTokenAmount(recipientTokenAccount);
    userPdaTokenAccountBefore = await getTokenAmount(userPdaTokenAccount);
    await program.methods
      .output(email, new BN(250))
      .accounts({
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMint,
        userPda,
        userPdaTokenAccount: userPdaTokenAccount.address,
        recipient: recipient.publicKey,
        recipientTokenAccount: recipientTokenAccount.address,
        authority: adminAccount.publicKey,
      })
      .signers([adminAccount])
      .rpc();
    assert.equal(
      await getTokenAmount(recipientTokenAccount),
      recipientTokenAccountBefore + BigInt(250)
    );
    assert.equal(
      await getTokenAmount(userPdaTokenAccount),
      userPdaTokenAccountBefore - BigInt(250)
    );
  });
});
