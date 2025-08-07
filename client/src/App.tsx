import React, { useState } from 'react';
import { useEffect } from 'react';
import RichTextEditor from './components/RichTextEditor';
import GoalPage from './components/GoalPage';
import { Lightbulb, Home, Sparkles } from 'lucide-react';
import './App.css';

interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline: string;
  isPinned: boolean;
  createdAt: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'ideas'>('home');
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);

  // Load ideas from localStorage on component mount
  useEffect(() => {
    const savedIdeas = localStorage.getItem('mindvault-ideas');
    if (savedIdeas) {
      try {
        setIdeas(JSON.parse(savedIdeas));
      } catch (error) {
        console.error('Error parsing saved ideas:', error);
        localStorage.removeItem('mindvault-ideas');
      }
    }
  }, []);

  // Listen for changes in localStorage to sync ideas
  useEffect(() => {
    const handleStorageChange = () => {
      const savedIdeas = localStorage.getItem('mindvault-ideas');
      if (savedIdeas) {
        setIdeas(JSON.parse(savedIdeas));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when ideas are updated
    const handleIdeasUpdate = (event: CustomEvent) => {
      setIdeas(event.detail);
    };

    window.addEventListener('ideasUpdated', handleIdeasUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ideasUpdated', handleIdeasUpdate as EventListener);
    };
  }, []);

  const handleSelectIdea = (idea: Idea) => {
    setSelectedIdea(idea);
    setCurrentPage('home');
  };

  return (
    <div className="app-container min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
      <header className="app-header bg-slate-800/50 backdrop-blur-md border-b border-slate-700 sticky top-0 z-40">
        <div className="flex items-center justify-between w-full p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="app-title text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Mind Vault
              </h1>
              <p className="text-sm text-gray-400">Your creative idea development space</p>
            </div>
          </div>
          <nav className="flex gap-3">
            <button
              onClick={() => setCurrentPage('home')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 font-medium min-w-[120px] ${
                currentPage === 'home' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105 border border-indigo-500' 
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white border border-slate-600'
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </button>
            <button
              onClick={() => setCurrentPage('ideas')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 font-medium min-w-[120px] ${
                currentPage === 'ideas' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105 border border-purple-500' 
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white border border-slate-600'
              }`}
            >
              <Lightbulb className="w-5 h-5" />
              <span>Ideas</span>
            </button>
          </nav>
        </div>
        {selectedIdea && currentPage === 'home' && (
          <div className="mx-6 mb-4 p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl border border-purple-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-purple-200 font-medium">Currently developing:</span>
                </div>
                <span className="font-bold text-white text-lg">{selectedIdea.title}</span>
                {selectedIdea.isPinned && (
                  <div className="bg-yellow-500 text-slate-900 px-2 py-1 rounded-full text-xs font-bold">
                    📌 PINNED
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedIdea(null)}
                className="text-purple-300 hover:text-white text-sm underline transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </header>
      <main className="app-content flex-1 p-6">
        {currentPage === 'home' ? (
          <div className="max-w-6xl mx-auto">
            <RichTextEditor 
              selectedIdea={selectedIdea} 
              ideas={ideas}
              onSelectIdea={handleSelectIdea}
            />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <GoalPage onSelectIdea={handleSelectIdea} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;