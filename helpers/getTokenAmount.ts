import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { getAccount } from '@solana/spl-token';
import { HousesStake } from '../target/types/houses_stake';

export const getTokenAmount = async (tokenAccount) => {
  const program = anchor.workspace.HousesStake as Program<HousesStake>;
  const connection = program.provider.connection;

  const tokenAccountInfo = await getAccount(connection, tokenAccount.address);
  return tokenAccountInfo.amount;
};
