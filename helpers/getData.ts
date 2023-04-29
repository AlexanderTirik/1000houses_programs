import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { Houses } from '../target/types/houses';
import { getKeypairFromFile } from '../utils/getKeypairFromFile';
import { PublicKey } from '@solana/web3.js';

export const getData = async () => {
  const program = anchor.workspace.Houses as Program<Houses>;
  const adminAccount = getKeypairFromFile('/tests/testAccounts/payer.json');

  const [dataPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('data', 'utf8'), adminAccount.publicKey.toBuffer()],
    program.programId
  );
  let { stacked, isStackingFreezed } = await program.account.data.fetch(
    dataPda
  );
  return { stacked: new BN(stacked).toNumber(), isStackingFreezed };
};
