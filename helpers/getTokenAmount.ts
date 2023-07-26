import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { getAccount } from '@solana/spl-token';
import { HousesStake } from '../target/types/houses_stake';

export const getTokenAmount = async (tokenAccount) => {
  const program = anchor.workspace.HousesStake as Program<HousesStake>;
  const connection = program.provider.connection;
  const address = tokenAccount.address ? tokenAccount.address : tokenAccount;
  const tokenAccountInfo = await getAccount(connection, address);
  return tokenAccountInfo.amount;
};
