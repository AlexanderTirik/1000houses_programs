import * as anchor from '@coral-xyz/anchor';
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { Houses } from '../target/types/houses';
import { Program } from '@coral-xyz/anchor';
import { getKeypairFromFile } from '../utils/getKeypairFromFile';
import { getLocalMint } from './getLocalMint';

export const getStakeAccounts = async (seed, userAccount) => {
  const program = anchor.workspace.Houses as Program<Houses>;
  const adminAccount = getKeypairFromFile('/tests/testAccounts/payer.json');
  const mint = getLocalMint();
  const connection = program.provider.connection;

  const [dataPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('data', 'utf8'), adminAccount.publicKey.toBuffer()],
    program.programId
  );

  const [stakePda] = PublicKey.findProgramAddressSync(
    [Buffer.from(seed, 'utf8'), userAccount.publicKey.toBuffer()],
    program.programId
  );

  let utf8Encode = new TextEncoder();

  console.log(utf8Encode.encode(userAccount.publicKey.toString()));
  console.log(userAccount.publicKey.toString());
  const stakePdaTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    userAccount,
    mint,
    stakePda,
    true // allowOwnerOffCurve - allow pda keep tokens
  );
  const userTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    userAccount,
    mint,
    userAccount.publicKey
  );

  return {
    dataPda,
    stakePda,
    stakePdaTokenAccount,
    userTokenAccount,
    mint,
    adminAccount,
    program,
  };
};
