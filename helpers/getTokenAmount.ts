import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { getAccount } from '@solana/spl-token';
import { Houses } from '../target/types/houses';

export const getTokenAmount = async (tokenAccount) => {
  const program = anchor.workspace.Houses as Program<Houses>;
  const connection = program.provider.connection;

  const tokenAccountInfo = await getAccount(connection, tokenAccount.address);
  return tokenAccountInfo.amount;
};
