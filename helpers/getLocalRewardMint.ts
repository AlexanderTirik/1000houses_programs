import fs from 'fs';
import { PublicKey } from '@solana/web3.js';

export const getLocalRewardMint = () =>
  new PublicKey(
    JSON.parse(
      fs
        .readFileSync(
          __dirname + '/../tests/testAccountsLocal/reward_mint.json'
        )
        .toString()
    )
  );
