import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { HousesStake } from '../../target/types/houses_stake';
import { requestAirdrop } from '../../helpers/requestAirdrop';
import { getKeypairFromFile } from '../../utils/getKeypairFromFile';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';
import { getLocalRewardMint } from '../../helpers/getLocalRewardMint';
import { assert } from 'chai';
import { callStake } from './stake';
import { getLocalMint } from '../../helpers/getLocalMint';
import { getStakeAccounts } from '../../helpers/houses_stake/getStakeAccounts';

export const callAddReward = async (amount) => {
  const rewardMint = getLocalRewardMint();
  const {
    adminAccount,
    dataPda,
    program,
    authorityTokenAccount,
    rewardTokenAccount,
    connection,
    mintAuthority,
  } = await getStakeAccounts();
  await requestAirdrop(connection, adminAccount.publicKey, 5 * 10e5);
  await mintTo(
    connection,
    adminAccount,
    rewardMint,
    authorityTokenAccount.address,
    mintAuthority,
    1500
  );

  await program.methods
    .addReward(new BN(amount))
    .accounts({
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      dataPda,
      rewardTokenAccount,
      authority: adminAccount.publicKey,
      authorityTokenAccount: authorityTokenAccount.address,
    })
    .signers([adminAccount])
    .rpc();
};

describe('add reward', () => {
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
  before(async () => {
    const randomWallet = anchor.web3.Keypair.generate();
    await requestAirdrop(connection, randomWallet.publicKey, 5 * 10e6);

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
  });

  it('add reward', async () => {
    const [dataPda] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode('data'),
        adminAccount.publicKey.toBuffer(),
      ],
      program.programId
    );

    let dataAccount = await program.account.data.fetch(dataPda);
    const currentRewardBeforeAdding = dataAccount.currentReward;
    assert.equal(
      new BN(
        dataAccount.rewardsHistory[currentRewardBeforeAdding + 1]
      ).toNumber(),
      0
    );
    assert.equal(
      new BN(
        dataAccount.stackedHistory[currentRewardBeforeAdding + 1]
      ).toNumber(),
      0
    );
    await callAddReward(1000);
    dataAccount = await program.account.data.fetch(dataPda);
    assert.equal(dataAccount.currentReward, currentRewardBeforeAdding + 1);
    assert.equal(
      new BN(
        dataAccount.rewardsHistory[currentRewardBeforeAdding + 1]
      ).toNumber(),
      1000
    );
    assert.equal(
      new BN(
        dataAccount.stackedHistory[currentRewardBeforeAdding + 1]
      ).toNumber(),
      new BN(dataAccount.stacked).toNumber()
    );
  });
});
// TODO: add test for full array
