import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = saved ? saved === 'dark' : true;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="fixed right-6 top-6 z-50 rounded-full border border-stone-300 bg-white/80 p-3 text-stone-700 shadow-lg shadow-stone-400/25 backdrop-blur transition-all duration-300 hover:scale-110 hover:shadow-xl dark:border-stone-700 dark:bg-stone-900/80 dark:text-stone-100 dark:shadow-stone-900/30"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-stone-600" />}
    </button>
  );
};

export default ThemeToggle;
