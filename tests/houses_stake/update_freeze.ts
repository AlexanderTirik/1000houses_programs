import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { HousesStake } from '../../target/types/houses_stake';
import { getKeypairFromFile } from '../../utils/getKeypairFromFile';
import { assert } from 'chai';
import { requestAirdrop } from '../../helpers/requestAirdrop';
import { getLocalMint } from '../../helpers/getLocalMint';
import { callStake } from './stake';
import { getData } from '../../helpers/houses_stake/getData';
import { getTokenAmount } from '../../helpers/getTokenAmount';
import { getStakeAccounts } from '../../helpers/houses_stake/getStakeAccounts';
import { getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';

describe('update_freeze', () => {
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
  const userAccount = anchor.web3.Keypair.generate();

  before(async () => {
    await requestAirdrop(connection, adminAccount.publicKey, 10e8);
    await requestAirdrop(connection, userAccount.publicKey, 10e8);
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

  it('Update freeze true', async () => {
    const [dataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('data', 'utf8'), adminAccount.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .updateFreeze(true)
      .accounts({
        dataPda,
        user: adminAccount.publicKey,
      })
      .signers([adminAccount])
      .rpc();
    assert.equal((await getData()).isStackingFreezed, true);
  });

  it('Update freeze false', async () => {
    const [dataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('data', 'utf8'), adminAccount.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .updateFreeze(false)
      .accounts({
        dataPda,
        user: adminAccount.publicKey,
      })
      .signers([adminAccount])
      .rpc();

    assert.equal((await getData()).isStackingFreezed, false);
  });

  it('Update freeze with stake', async () => {
    const seed = 'seed';
    const { userTokenAccount, stakePdaTokenAccount } = await getStakeAccounts(
      seed,
      userAccount
    );

    const [dataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('data', 'utf8'), adminAccount.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .updateFreeze(true)
      .accounts({
        dataPda,
        user: adminAccount.publicKey,
      })
      .signers([adminAccount])
      .rpc();

    assert.equal((await getData()).isStackingFreezed, true);

    let error;
    try {
      await callStake(seed, 100, userAccount);
    } catch (err) {
      error = err;
    }
    assert.equal(
      error.message,
      'AnchorError caused by account: data_pda. Error Code: ConstraintRaw. Error Number: 2003. Error Message: A raw constraint was violated.'
    );

    await program.methods
      .updateFreeze(false)
      .accounts({
        dataPda,
        user: adminAccount.publicKey,
      })
      .signers([adminAccount])
      .rpc();

    assert.equal((await getData()).isStackingFreezed, false);

    const dataBeforeStake = await getData();
    await callStake(seed, 100, userAccount);
    const dataAfterStake = await getData();

    assert.equal(dataAfterStake.stacked, dataBeforeStake.stacked + 100);
    assert.equal(await getTokenAmount(userTokenAccount), BigInt(900));
    assert.equal(await getTokenAmount(stakePdaTokenAccount), BigInt(100));
  });
});
// // TODO: add with unstake
