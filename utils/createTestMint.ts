import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createMint } from '@solana/spl-token';
import { getKeypairFromFile } from './getKeypairFromFile';
const asyncImpl = async () => {
  const mintAuthority = getKeypairFromFile(
    '/tests/testAccounts/mintAuthority.json'
  );
  const payer = getKeypairFromFile('/tests/testAccounts/payer.json');
  const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
  const airdropSignature = await connection.requestAirdrop(
    payer.publicKey,
    5 * LAMPORTS_PER_SOL
  );
  const latestBlock = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    ...latestBlock,
    signature: airdropSignature,
  });
  const mint = await createMint(
    connection,
    payer,
    mintAuthority.publicKey,
    null,
    9
  );
  console.log(mint.toBase58());
};
asyncImpl();
