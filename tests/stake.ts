import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  mintTo,
  getOrCreateAssociatedTokenAccount,
  getAccount,
} from '@solana/spl-token';
import { Houses } from '../target/types/houses';
import { getKeypairFromFile } from '../utils/getKeypairFromFile';
import { assert } from 'chai';
import { requestAirdrop } from '../utils/requestAirdrop';

describe('houses', () => {
  const program = anchor.workspace.Houses as Program<Houses>;
  anchor.setProvider(anchor.AnchorProvider.env());
  let mint = new PublicKey('28wv75f7w4dAeTRbBYKYWuLZwnzXPhrVN7jeRAm19Q4J');
  const mintAuthority = getKeypairFromFile(
    '/tests/testAccounts/mintAuthority.json'
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
  const getStackedAmount = async (dataPda) => {
    let dataAccount = await program.account.data.fetch(dataPda);
    return new BN(dataAccount.stacked).toNumber();
  };

  const getTokenAmount = async (tokenAccount) => {
    const tokenAccountInfo = await getAccount(connection, tokenAccount.address);
    return tokenAccountInfo.amount;
  };

  it('Stake', async () => {
    const [dataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('data', 'utf8')],
      program.programId
    );

    assert.equal(await getStackedAmount(dataPda), 0);

    const seed = 'some.email@gmail.com';
    const [userProgramPDAAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from(seed, 'utf8'), userAccount.publicKey.toBuffer()],
      program.programId
    );

    const stakePdaTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      userAccount,
      mint,
      userProgramPDAAccount,
      true // allowOwnerOffCurve - allow pda keep tokens
    );
    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      userAccount,
      mint,
      userAccount.publicKey
    );
    assert.equal(await getTokenAmount(userTokenAccount), BigInt(1000));
    assert.equal(await getTokenAmount(stakePdaTokenAccount), BigInt(0));

    await program.methods
      .stake(seed, new BN(100))
      .accounts({
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        associatedTokenProgram: anchor.web3.SystemProgram.programId,

        tokenMint: mint,
        stakePda: userProgramPDAAccount,
        stakePdaTokenAccount: stakePdaTokenAccount.address,
        dataPda,
        userTokenAccount: userTokenAccount.address,
        user: userAccount.publicKey,
      })
      .signers([userAccount])
      .rpc();

    assert.equal(await getStackedAmount(dataPda), 100);
    assert.equal(await getTokenAmount(userTokenAccount), BigInt(900));
    assert.equal(await getTokenAmount(stakePdaTokenAccount), BigInt(100));

    await program.methods
      .stake(seed, new BN(200))
      .accounts({
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        associatedTokenProgram: anchor.web3.SystemProgram.programId,

        tokenMint: mint,
        stakePda: userProgramPDAAccount,
        stakePdaTokenAccount: stakePdaTokenAccount.address,
        dataPda,
        userTokenAccount: userTokenAccount.address,
        user: userAccount.publicKey,
      })
      .signers([userAccount])
      .rpc();

    assert.equal(await getStackedAmount(dataPda), 300);
    assert.equal(await getTokenAmount(userTokenAccount), BigInt(700));
    assert.equal(await getTokenAmount(stakePdaTokenAccount), BigInt(300));
  });
});
// TODO: add failed stake test
// TODO: utilize code repeat in stake test
// TODO: think new tests
// TODO: refactor file structure in program
