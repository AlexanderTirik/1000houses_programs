import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { HousesStake } from '../../target/types/houses_stake';
import { getKeypairFromFile } from '../../utils/getKeypairFromFile';
import { PublicKey } from '@solana/web3.js';

export const getData = async () => {
  const program = anchor.workspace.HousesStake as Program<HousesStake>;
  const adminAccount = getKeypairFromFile(
    '/tests/testAccountsLocal/payer.json'
  );

  const [dataPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('data', 'utf8'), adminAccount.publicKey.toBuffer()],
    program.programId
  );
  let { stacked, isStackingFreezed, currentReward, currentRewardIndex } =
    await program.account.data.fetch(dataPda);
  return {
    stacked: new BN(stacked).toNumber(),
    isStackingFreezed,
    currentReward,
    currentRewardIndex,
  };
};
