import React, { useState } from 'react';
import RichTextEditor from './components/RichTextEditor';
import GoalPage from './components/GoalPage';
import { Target, Home } from 'lucide-react';
import './App.css';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'goals'>('home');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const handleSelectGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setCurrentPage('home');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="flex items-center justify-between w-full">
          <h1 className="app-title">Mind Vault</h1>
          <nav className="flex gap-4">
            <button
              onClick={() => setCurrentPage('home')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentPage === 'home' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </button>
            <button
              onClick={() => setCurrentPage('goals')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentPage === 'goals' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              <Target className="w-4 h-4" />
              Goals
            </button>
          </nav>
        </div>
        {selectedGoal && currentPage === 'home' && (
          <div className="mt-4 p-3 bg-indigo-900 bg-opacity-50 rounded-lg border border-indigo-500">
            <p className="text-sm text-indigo-200">
              Working on: <span className="font-semibold text-white">{selectedGoal.title}</span>
              <button
                onClick={() => setSelectedGoal(null)}
                className="ml-2 text-indigo-300 hover:text-white text-xs underline"
              >
                Clear
              </button>
            </p>
          </div>
        )}
      </header>
      <main className="app-content">
        {currentPage === 'home' ? (
          <RichTextEditor selectedGoal={selectedGoal} />
        ) : (
          <GoalPage onSelectGoal={handleSelectGoal} />
        )}
      </main>
    </div>
  );
}

export default App;