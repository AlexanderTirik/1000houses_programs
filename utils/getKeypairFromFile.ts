import fs from 'fs';
import { Keypair } from '@solana/web3.js';

export const getKeypairFromFile = (path) => {
  const unformatedSecret = JSON.parse(
    fs.readFileSync(__dirname + '/..' + path).toString()
  )._keypair.secretKey;
  const secretArr = Object.entries(unformatedSecret).reduce((acc, [k, v]) => {
    acc[+k] = v;
    return acc;
  }, []);
  const secretKey = Uint8Array.from(secretArr);
  return Keypair.fromSecretKey(secretKey);
};
