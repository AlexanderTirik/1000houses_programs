import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { Houses } from '../target/types/houses';
import { assert } from 'chai';
import { requestAirdrop } from '../utils/requestAirdrop';

describe('houses', () => {
  const program = anchor.workspace.Houses as Program<Houses>;
  anchor.setProvider(anchor.AnchorProvider.env());
  const userAccount = anchor.web3.Keypair.generate();
  const connection = program.provider.connection;

  before(async () => {
    await requestAirdrop(connection, userAccount.publicKey, 5 * 10e5);
  });

  it('Initialize', async () => {
    const [dataPda] = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode('data')],
      program.programId
    );
    await program.methods
      .initialize()
      .accounts({
        systemProgram: anchor.web3.SystemProgram.programId,
        dataPda,
        user: userAccount.publicKey,
      })
      .signers([userAccount])
      .rpc();
    const dataAccount = await program.account.data.fetch(dataPda);
    assert.exists(dataAccount.bump);
    assert.equal(new BN(dataAccount.stacked).toNumber(), 0);
  });
});
