import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { HousesStake } from '../../target/types/houses_stake';
import { assert } from 'chai';
import { requestAirdrop } from '../../helpers/requestAirdrop';
import { getKeypairFromFile } from '../../utils/getKeypairFromFile';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { getLocalRewardMint } from '../../helpers/getLocalRewardMint';
import { getLocalMint } from '../../helpers/getLocalMint';

describe('initialize', () => {
  const program = anchor.workspace.HousesStake as Program<HousesStake>;
  anchor.setProvider(anchor.AnchorProvider.env());
  const adminAccount = getKeypairFromFile(
    '/tests/testAccountsLocal/payer.json'
  );
  const connection = program.provider.connection;
  const rewardMint = getLocalRewardMint();
  const tokenMint = getLocalMint();
  before(async () => {
    await requestAirdrop(connection, adminAccount.publicKey, 5 * 10e5);
  });

  it('Initialize', async () => {
    const [dataPda] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode('data'),
        adminAccount.publicKey.toBuffer(),
      ],
      program.programId
    );
    const stakeTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      dataPda,
      true
    );
    const rewardTokenAccount = await getAssociatedTokenAddress(
      rewardMint,
      dataPda,
      true
    );
    await program.methods
      .initialize()
      .accounts({
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMint,
        rewardMint,
        stakeTokenAccount,
        dataPda,
        rewardTokenAccount,
        user: adminAccount.publicKey,
      })
      .signers([adminAccount])
      .rpc();
    const dataAccount = await program.account.data.fetch(dataPda);
    assert.exists(dataAccount.bump);
    assert.equal(new BN(dataAccount.stacked).toNumber(), 0);
    assert.equal(new BN(dataAccount.reward).toNumber(), 0);
    assert.equal(new BN(dataAccount.rewardIndex).toNumber(), 0);
  });

  it('Second Initialize', async () => {
    const [dataPda] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode('data'),
        adminAccount.publicKey.toBuffer(),
      ],
      program.programId
    );
    const stakeTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      dataPda,
      true
    );
    const rewardTokenAccount = await getAssociatedTokenAddress(
      rewardMint,
      dataPda,
      true
    );
    let error;
    try {
      await program.methods
        .initialize()
        .accounts({
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMint,
          rewardMint,
          stakeTokenAccount,
          dataPda,
          rewardTokenAccount,
          user: adminAccount.publicKey,
        })
        .signers([adminAccount])
        .rpc();
    } catch (err) {
      error = err;
    }
    assert.equal(
      error.message,
      'failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x0'
    );
  });
});
