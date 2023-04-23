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

describe('houses', () => {
  const LAMPORTS_PER_SOL = 1000000000;
  const program = anchor.workspace.Houses as Program<Houses>;
  anchor.setProvider(anchor.AnchorProvider.env());
  let mint = new PublicKey('B4PHSEqQ9bvs2UFeEZfZPjZFL3GQdF2e8oPisCL3ZC6T');
  const mintAuthority = getKeypairFromFile(
    '/tests/testAccounts/mintAuthority.json'
  );
  const userAccount = anchor.web3.Keypair.generate();
  const connection = program.provider.connection;

  before(async () => {
    const airdropSignature = await connection.requestAirdrop(
      userAccount.publicKey,
      5 * LAMPORTS_PER_SOL
    );
    const latestBlock = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      ...latestBlock,
      signature: airdropSignature,
    });
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
  it('Stake', async () => {
    const [dataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('data', 'utf8')],
      program.programId
    );

    let dataAccount = await program.account.data.fetch(dataPda);
    assert.equal(new BN(dataAccount.stacked).toNumber(), 0);

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
    let userTokenAccountInfo = await getAccount(
      connection,
      userTokenAccount.address
    );
    assert.equal(userTokenAccountInfo.amount, BigInt(1000));
    let stakePdaTokenAccountInfo = await getAccount(
      connection,
      stakePdaTokenAccount.address
    );
    assert.equal(stakePdaTokenAccountInfo.amount, BigInt(0));

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

    dataAccount = await program.account.data.fetch(dataPda);
    assert.equal(new BN(dataAccount.stacked).toNumber(), 100);
    userTokenAccountInfo = await getAccount(
      connection,
      userTokenAccount.address
    );
    assert.equal(userTokenAccountInfo.amount, BigInt(900));
    stakePdaTokenAccountInfo = await getAccount(
      connection,
      stakePdaTokenAccount.address
    );
    assert.equal(stakePdaTokenAccountInfo.amount, BigInt(100));

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
    dataAccount = await program.account.data.fetch(dataPda);
    assert.equal(new BN(dataAccount.stacked).toNumber(), 300);
    userTokenAccountInfo = await getAccount(
      connection,
      userTokenAccount.address
    );
    assert.equal(userTokenAccountInfo.amount, BigInt(700));
    stakePdaTokenAccountInfo = await getAccount(
      connection,
      stakePdaTokenAccount.address
    );
    assert.equal(stakePdaTokenAccountInfo.amount, BigInt(300));
  });
});
// TODO: add failed stake test
// TODO: utilize code repeat in stake test
// TODO: think new tests
// TODO: refactor file structure in program
