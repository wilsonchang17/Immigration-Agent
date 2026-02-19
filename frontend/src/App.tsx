import IntakeForm from './components/IntakeForm';
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-stone-100 via-stone-200 to-stone-300 px-4 py-10 transition-colors duration-300 dark:from-stone-950 dark:via-stone-900 dark:to-stone-800">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-stone-300/50 blur-3xl dark:bg-stone-700/20" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-stone-400/35 blur-3xl dark:bg-stone-600/20" />
      </div>
      <ThemeToggle />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl justify-center">
        <IntakeForm />
      </div>
    </div>
  );
}

export default App;
