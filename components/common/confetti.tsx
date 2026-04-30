'use client';

import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const colors = ['#f472b6', '#a855f7', '#34d399', '#60a5fa', '#fde047'];

type Particle = { left: string; delay: string; color: string };

export default function ConfettiBurst() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const spawn = () =>
      setParticles(
        Array.from({ length: 20 }).map((_, idx) => ({
          left: `${((idx + 1) / 21) * 100}%`,
          delay: `${(idx % 5) * 0.1}s`,
          color: colors[idx % colors.length]
        }))
      );
    const handle = typeof queueMicrotask === 'function' ? queueMicrotask(spawn) : setTimeout(spawn, 0);
    return () => {
      if (typeof handle === 'number') clearTimeout(handle);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion || particles.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle, idx) => (
        <span
          key={idx}
          className="absolute h-2 w-2 rounded-full bg-white/70 animate-confetti"
          style={{ left: particle.left, animationDelay: particle.delay, backgroundColor: particle.color }}
        />
      ))}
    </div>
  );
}
