import * as anchor from '@coral-xyz/anchor';
import {
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { HousesStake } from '../../target/types/houses_stake';
import { Program } from '@coral-xyz/anchor';
import { getKeypairFromFile } from '../../utils/getKeypairFromFile';
import { getLocalMint } from '../getLocalMint';
import { getLocalRewardMint } from '../getLocalRewardMint';

export const getStakeAccounts = async (userAccount?: anchor.web3.Keypair) => {
  const program = anchor.workspace.HousesStake as Program<HousesStake>;
  const adminAccount = getKeypairFromFile(
    '/tests/testAccountsLocal/payer.json'
  );
  const mintAuthority = getKeypairFromFile(
    '/tests/testAccountsLocal/mintAuthority.json'
  );
  const mint = getLocalMint();
  const rewardMint = getLocalRewardMint();
  const connection = program.provider.connection;

  const [dataPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('data', 'utf8'), adminAccount.publicKey.toBuffer()],
    program.programId
  );
  const rewardTokenAccount = await getAssociatedTokenAddress(
    rewardMint,
    dataPda,
    true
  );

  let stakePda;
  let stakePdaTokenAccount;
  let userTokenAccount;
  let userRewardTokenAccount;
  if (userAccount) {
    stakePda = PublicKey.findProgramAddressSync(
      [Buffer.from('stake', 'utf8'), userAccount.publicKey.toBuffer()],
      program.programId
    )[0];
    stakePdaTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      userAccount,
      mint,
      stakePda,
      true // allowOwnerOffCurve - allow pda keep tokens
    );

    userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      userAccount,
      mint,
      userAccount.publicKey
    );
    userRewardTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      userAccount,
      rewardMint,
      userAccount.publicKey
    );
  }

  const authorityTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    adminAccount,
    rewardMint,
    adminAccount.publicKey
  );

  return {
    dataPda,
    stakePda,
    stakePdaTokenAccount,
    userTokenAccount,
    authorityTokenAccount,
    rewardMint,
    mintAuthority,
    rewardTokenAccount,
    userRewardTokenAccount,
    mint,
    connection,
    adminAccount,
    program,
  };
};
