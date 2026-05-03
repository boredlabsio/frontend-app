export function shortAddress(value?: string | null) {
  if (!value) return '—';
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function shortHash(value?: string | null) {
  if (!value) return '—';
  return `${value.slice(0, 10)}…${value.slice(-6)}`;
}

export function timeAgo(iso?: string | null) {
  if (!iso) return 'just now';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
