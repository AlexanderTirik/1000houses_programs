export const requestAirdrop = async (connection, pk, amount) => {
  const airdropSignature = await connection.requestAirdrop(pk, amount);
  const latestBlock = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    ...latestBlock,
    signature: airdropSignature,
  });
};
