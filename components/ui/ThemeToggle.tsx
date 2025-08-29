'use client';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'theme'; // 'dark' | 'light'

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) as
      | 'dark'
      | 'light'
      | null;
    const prefersDark =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const initial = stored ?? (prefersDark ? 'dark' : 'light');
    setTheme(initial);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', initial === 'dark');
    }
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', next === 'dark');
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next);
    }
  };

  if (!mounted) return null;

  return (
    <button
      aria-label="Toggle theme"
      onClick={toggle}
      className="ml-2 rounded-full border border-border bg-surface/60 p-2 text-heading hover:bg-card hover-glow-yellow transition"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <span role="img" aria-label="sun">🌞</span> : <span role="img" aria-label="moon">🌙</span>}
    </button>
  );
}
