import IntakeForm from './components/IntakeForm';
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-stone-200 to-stone-300 dark:from-stone-900 dark:via-stone-800 dark:to-stone-950 p-4 flex items-center justify-center transition-colors duration-300">
      <ThemeToggle />
      <IntakeForm />
    </div>
  );
}

export default App;
