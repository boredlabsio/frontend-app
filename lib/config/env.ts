const rawDebug = String(process.env.NEXT_PUBLIC_DEBUG_LOGS || '').toLowerCase();

export const env = {
  apiBase: process.env.NEXT_PUBLIC_API_BASE || '',
  discoverySnapshotUrl: process.env.NEXT_PUBLIC_SUMMARY_SNAPSHOT_URL || '/api_summary_latest.json',
  debugLogs: rawDebug === '1' || rawDebug === 'true'
};
