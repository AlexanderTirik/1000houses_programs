import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { getKeypairFromFile } from '../../utils/getKeypairFromFile';
import { requestAirdrop } from '../../helpers/requestAirdrop';
import { PublicKey } from '@solana/web3.js';
import { getTokenKeeperAccounts } from '../../helpers/houses_token_keeper/getTokenKeeperAccounts';
import { HousesStake } from '../../target/types/houses_stake';
import { getRandomEmail } from '../../utils/getRandomEmail';
import { assert } from 'chai';
import { expectThrowsAsync } from '../../utils/expectThrowsAsync';

describe('signup', () => {
  const program = anchor.workspace.HousesStake as Program<HousesStake>;
  anchor.setProvider(anchor.AnchorProvider.env());
  const adminAccount = getKeypairFromFile(
    '/tests/testAccountsLocal/payer.json'
  );
  const connection = program.provider.connection;
  const email = getRandomEmail();

  before(async () => {
    await requestAirdrop(connection, adminAccount.publicKey, 5 * 10e5);
  });

  it('signup', async () => {
    const { userPda } = await getTokenKeeperAccounts(email);
    const [stakePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('stake', 'utf8'), userPda.toBuffer()],
      anchor.workspace.HousesStake.programId
    );
    expectThrowsAsync(
      async () => await program.account.stakePda.fetch(stakePda),
      'AssertionError: expected [Function] to throw an error'
    );
    await program.methods
      .signup()
      .accounts({
        systemProgram: anchor.web3.SystemProgram.programId,
        stakePda,
        userPda,
        authority: adminAccount.publicKey,
      })
      .signers([adminAccount])
      .rpc();

    const { bump } = await program.account.stakePda.fetch(stakePda);
    assert.exists(bump);
  });
});
