'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';

export type SoundContextValue = {
  enabled: boolean;
  toggle: () => void;
  play: (type?: 'ping' | 'badge') => void;
};

const SoundContext = createContext<SoundContextValue | undefined>(undefined);

const SOUND_SRC =
  'data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=\n';

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof Audio !== 'undefined') {
      audioRef.current = new Audio(SOUND_SRC);
      audioRef.current.volume = 0.25;
    }
  }, []);

  const value = useMemo<SoundContextValue>(
    () => ({
      enabled,
      toggle: () => setEnabled((prev) => !prev),
      play: () => {
        if (!enabled || !audioRef.current) return;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => undefined);
      }
    }),
    [enabled]
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useSound must be used within SoundProvider');
  return ctx;
}
