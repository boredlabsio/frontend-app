'use client';

import { useSound } from '@/lib/providers/SoundProvider';

export default function SoundToggle() {
  const sound = useSound();

  return (
    <button
      type="button"
      onClick={sound.toggle}
      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide transition ${
        sound.enabled ? 'border-emerald-300 text-emerald-200' : 'border-white/30 text-white/60'
      }`}
    >
      Sound {sound.enabled ? 'on' : 'off'}
    </button>
  );
}
