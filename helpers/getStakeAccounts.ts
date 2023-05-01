import * as anchor from '@coral-xyz/anchor';
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { HousesStake } from '../target/types/houses_stake';
import { Program } from '@coral-xyz/anchor';
import { getKeypairFromFile } from '../utils/getKeypairFromFile';
import { getLocalMint } from './getLocalMint';

export const getStakeAccounts = async (seed, userAccount) => {
  const program = anchor.workspace.HousesStake as Program<HousesStake>;
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
