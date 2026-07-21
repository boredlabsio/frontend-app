import { z } from 'zod';
import { env } from '@/lib/config/env';

export const creationStatusSchema = z.object({
  schema: z.literal('CreationStatusV1'), status: z.enum(['pending','confirmed','indexed','visible','failed']),
  tx_hash: z.string(), config_id: z.string().nullable(), token_address: z.string().nullable(),
  market_address: z.string().nullable(), canonical_token_id: z.string().nullable(),
  block_number: z.string().nullable(), failure_reason: z.string().nullable()
});
export type CreationStatus = z.infer<typeof creationStatusSchema>;

export async function getCreationStatus(txHash: string, signal?: AbortSignal): Promise<CreationStatus> {
  if (!env.apiBaseValid) throw new Error('Live API is unavailable');
  const response = await fetch(`${env.apiBase}/creations/${encodeURIComponent(txHash)}`, { cache: 'no-store', signal });
  if (!response.ok) throw new Error(`Creation status request failed (${response.status})`);
  return creationStatusSchema.parse(await response.json());
}

export async function waitForCreationVisibility(txHash: string, attempts = 30, intervalMs = 2000) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const status = await getCreationStatus(txHash);
    if (status.status === 'failed') throw new Error(status.failure_reason || 'Creation failed');
    if (status.status === 'visible' && status.canonical_token_id) return status;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error('Creation confirmed but indexing is still pending');
}
