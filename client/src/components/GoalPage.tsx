import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Lightbulb, Calendar, Pin, PinOff } from 'lucide-react';

interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline: string;
  isPinned: boolean;
  createdAt: string;
}

interface GoalPageProps {
  onSelectIdea: (idea: Idea) => void;
}

const GoalPage: React.FC<GoalPageProps> = ({ onSelectIdea }) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    deadline: ''
  });

  useEffect(() => {
    const savedIdeas = localStorage.getItem('mindvault-ideas');
    if (savedIdeas) {
      setIdeas(JSON.parse(savedIdeas));
    }
  }, []);

  const saveIdeas = (updatedIdeas: Idea[]) => {
    setIdeas(updatedIdeas);
    localStorage.setItem('mindvault-ideas', JSON.stringify(updatedIdeas));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingIdea) {
      const updatedIdeas = ideas.map(idea =>
        idea.id === editingIdea.id
          ? { ...idea, ...formData }
          : idea
      );
      saveIdeas(updatedIdeas);
      setEditingIdea(null);
    } else {
      const newIdea: Idea = {
        id: Date.now().toString(),
        ...formData,
        isPinned: false,
        createdAt: new Date().toISOString()
      };
      saveIdeas([...ideas, newIdea]);
    }

    setFormData({
      title: '',
      description: '',
      category: '',
      deadline: ''
    });
    setShowForm(false);
  };

  const handleEdit = (idea: Idea) => {
    setEditingIdea(idea);
    setFormData({
      title: idea.title,
      description: idea.description,
      category: idea.category,
      deadline: idea.deadline
    });
    setShowForm(true);
  };

  const handleDelete = (ideaId: string) => {
    if (confirm('Are you sure you want to delete this idea?')) {
      const updatedIdeas = ideas.filter(idea => idea.id !== ideaId);
      saveIdeas(updatedIdeas);
    }
  };

  const togglePin = (ideaId: string) => {
    const updatedIdeas = ideas.map(idea =>
      idea.id === ideaId
        ? { ...idea, isPinned: !idea.isPinned }
        : idea
    );
    saveIdeas(updatedIdeas);
  };

  // Sort ideas: pinned first, then by creation date
  const sortedIdeas = [...ideas].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="ideas-page p-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
            <Lightbulb className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Ideas</h1>
            <p className="text-gray-400 text-sm">Capture and organize your creative thoughts</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          New Idea
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-600 p-8 rounded-2xl w-full max-w-lg shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-purple-400" />
              {editingIdea ? 'Edit Idea' : 'Create New Idea'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20 transition-all"
                  placeholder="What's your idea?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 h-24 resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20 transition-all"
                  placeholder="Describe your idea in detail..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20 transition-all"
                  placeholder="e.g., Business, Creative, Personal"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Target Date (Optional)</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20 transition-all"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  {editingIdea ? 'Update Idea' : 'Create Idea'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingIdea(null);
                    setFormData({
                      title: '',
                      description: '',
                      category: '',
                      deadline: ''
                    });
                  }}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-lg font-semibold transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedIdeas.map((idea) => (
          <div
            key={idea.id}
            className={`group relative bg-slate-800 border-2 rounded-2xl p-6 hover:border-purple-500 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-2xl ${
              idea.isPinned 
                ? 'border-yellow-500 bg-gradient-to-br from-slate-800 to-yellow-900/20' 
                : 'border-slate-700'
            }`}
            onClick={() => onSelectIdea(idea)}
          >
            {/* Pin indicator */}
            {idea.isPinned && (
              <div className="absolute -top-2 -right-2 bg-yellow-500 text-slate-900 p-2 rounded-full shadow-lg">
                <Pin className="w-4 h-4" />
              </div>
            )}

            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2">
                {idea.title}
              </h3>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(idea.id);
                  }}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    idea.isPinned 
                      ? 'bg-yellow-500 text-slate-900 hover:bg-yellow-400' 
                      : 'bg-slate-700 text-gray-300 hover:bg-yellow-500 hover:text-slate-900'
                  }`}
                  title={idea.isPinned ? 'Unpin idea' : 'Pin idea'}
                >
                  {idea.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(idea);
                  }}
                  className="p-2 bg-slate-700 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-200"
                  title="Edit idea"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(idea.id);
                  }}
                  className="p-2 bg-slate-700 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200"
                  title="Delete idea"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-gray-300 text-sm mb-4 line-clamp-3 leading-relaxed">
              {idea.description}
            </p>
            
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                {idea.category && (
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full font-medium">
                    {idea.category}
                  </span>
                )}
              </div>
              {idea.deadline && (
                <div className="flex items-center gap-1 text-gray-400 bg-slate-700 px-2 py-1 rounded-lg">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(idea.deadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              Created {new Date(idea.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {ideas.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lightbulb className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-300 mb-3">No Ideas Yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Start capturing your creative thoughts and brilliant ideas. Every great project begins with a single idea!
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Create Your First Idea
          </button>
        </div>
      )}
    </div>
  );
};

export default GoalPage;