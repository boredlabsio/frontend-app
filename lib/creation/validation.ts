export type CreationInput = { name: string; symbol: string; metadataURI: string };

export function validateCreationInput(input: CreationInput): CreationInput {
  const name = input.name.trim().normalize('NFKC');
  const symbol = input.symbol.trim().toUpperCase();
  const metadataURI = input.metadataURI.trim();
  if (name.length < 1 || name.length > 64) throw new Error('Name must be 1–64 characters');
  if (!/^[A-Z][A-Z0-9]{1,7}$/.test(symbol)) throw new Error('Symbol must be 2–8 uppercase letters or digits and start with a letter');
  if (metadataURI.length < 1 || metadataURI.length > 512) throw new Error('Metadata URI must be 1–512 characters');
  if (!/^(https:\/\/|ipfs:\/\/|ar:\/\/)/i.test(metadataURI)) throw new Error('Metadata URI must use HTTPS, IPFS, or Arweave');
  return { name, symbol, metadataURI };
}
