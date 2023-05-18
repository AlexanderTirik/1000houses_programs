import fs from 'fs';
import { PublicKey } from '@solana/web3.js';

export const getLocalMint = () =>
  new PublicKey(
    JSON.parse(
      fs
        .readFileSync(__dirname + '/../tests/testAccountsLocal/mint.json')
        .toString()
    )
  );
