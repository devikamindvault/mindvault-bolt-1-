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

    const handleSwitchToIdeas = () => {
      setCurrentPage('ideas');
    };

    window.addEventListener('ideasUpdated', handleIdeasUpdate as EventListener);
    window.addEventListener('switchToIdeas', handleSwitchToIdeas as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ideasUpdated', handleIdeasUpdate as EventListener);
      window.removeEventListener('switchToIdeas', handleSwitchToIdeas as EventListener);
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
            <div className="p-3 bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 rounded-2xl shadow-2xl animate-pulse">
              <Sparkles className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            <div>
              <h1 className="app-title text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-2xl">
                Mind Vault
              </h1>
              <p className="text-base text-gray-300 font-medium">✨ Your creative idea development space</p>
            </div>
          </div>
          <nav className="flex gap-3">
            <button
              onClick={() => setCurrentPage('home')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 font-semibold text-base min-w-[120px] shadow-lg transform hover:scale-105 ${
                currentPage === 'home' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl border border-indigo-400' 
                  : 'bg-gradient-to-r from-slate-700 to-slate-600 text-gray-300 hover:from-slate-600 hover:to-slate-500 hover:text-white border border-slate-500'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Home</span>
            </button>
            <button
              onClick={() => setCurrentPage('ideas')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 font-semibold text-base min-w-[120px] shadow-lg transform hover:scale-105 ${
                currentPage === 'ideas' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl border border-purple-400' 
                  : 'bg-gradient-to-r from-slate-700 to-slate-600 text-gray-300 hover:from-slate-600 hover:to-slate-500 hover:text-white border border-slate-500'
              }`}
            >
              <Lightbulb className="w-5 h-5" />
              <span className="hidden sm:inline">Ideas</span>
            </button>
          </nav>
        </div>
        {selectedIdea && currentPage === 'home' && (
          <div className="mx-6 mb-6 p-6 bg-gradient-to-r from-purple-900/60 via-pink-900/60 to-indigo-900/60 rounded-2xl border-2 border-purple-400/40 backdrop-blur-md shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 animate-pulse"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 relative z-10">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-purple-300 animate-bounce" />
                  <span className="text-lg text-purple-200 font-bold">Currently developing:</span>
                </div>
                <span className="font-black text-white text-2xl drop-shadow-lg">{selectedIdea.title}</span>
                {selectedIdea.isPinned && (
                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 px-4 py-2 rounded-full text-sm font-black shadow-lg animate-pulse">
                    📌 PINNED
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedIdea(null)}
                className="text-purple-300 hover:text-white text-lg underline transition-all duration-200 font-bold relative z-10 hover:scale-110"
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