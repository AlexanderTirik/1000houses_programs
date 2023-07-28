import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { HousesTokenKeeper } from '../../target/types/houses_token_keeper';
import { PublicKey } from '@solana/web3.js';
import { getKeypairFromFile } from '../../utils/getKeypairFromFile';
import { getLocalMint } from '../getLocalMint';
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { getLocalRewardMint } from '../getLocalRewardMint';

export const getTokenKeeperAccounts = async (email) => {
  const program = anchor.workspace
    .HousesTokenKeeper as Program<HousesTokenKeeper>;
  const adminAccount = getKeypairFromFile(
    '/tests/testAccountsLocal/payer.json'
  );
  const mint = getLocalMint();
  const rewardMint = getLocalRewardMint();

  const connection = program.provider.connection;
  const [userPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(email, 'utf8'), adminAccount.publicKey.toBuffer()],
    program.programId
  );

  const userPdaTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    adminAccount,
    mint,
    userPda,
    true // allowOwnerOffCurve - allow pda keep tokens
  );

  const userRewardTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    adminAccount,
    rewardMint,
    userPda,
    true // allowOwnerOffCurve - allow pda keep tokens
  );
  return { userPdaTokenAccount, userPda, userRewardTokenAccount };
};
