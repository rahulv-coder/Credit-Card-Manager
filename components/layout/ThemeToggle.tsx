'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch – only render after mount
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-14 h-7" />;

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border border-border bg-secondary transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Track fill */}
      <span
        className={`absolute inset-0 rounded-full transition-colors duration-300 ${
          isDark ? 'bg-primary' : 'bg-muted'
        }`}
      />
      {/* Thumb */}
      <span
        className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 ${
          isDark ? 'translate-x-8' : 'translate-x-1'
        }`}
      >
        {isDark ? (
          <Moon size={11} className="text-primary" />
        ) : (
          <Sun size={11} className="text-amber-500" />
        )}
      </span>
    </button>
  );
}
