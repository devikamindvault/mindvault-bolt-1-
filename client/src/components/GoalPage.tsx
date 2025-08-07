import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Target, Calendar, CheckCircle } from 'lucide-react';

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

interface GoalPageProps {
  onSelectGoal: (goal: Goal) => void;
}

const GoalPage: React.FC<GoalPageProps> = ({ onSelectGoal }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    deadline: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  useEffect(() => {
    const savedGoals = localStorage.getItem('mindvault-goals');
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }
  }, []);

  const saveGoals = (updatedGoals: Goal[]) => {
    setGoals(updatedGoals);
    localStorage.setItem('mindvault-goals', JSON.stringify(updatedGoals));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingGoal) {
      const updatedGoals = goals.map(goal =>
        goal.id === editingGoal.id
          ? { ...goal, ...formData }
          : goal
      );
      saveGoals(updatedGoals);
      setEditingGoal(null);
    } else {
      const newGoal: Goal = {
        id: Date.now().toString(),
        ...formData,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      saveGoals([...goals, newGoal]);
    }

    setFormData({
      title: '',
      description: '',
      category: '',
      deadline: '',
      priority: 'medium'
    });
    setShowForm(false);
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      deadline: goal.deadline,
      priority: goal.priority
    });
    setShowForm(true);
  };

  const handleDelete = (goalId: string) => {
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    saveGoals(updatedGoals);
  };

  const toggleStatus = (goalId: string) => {
    const updatedGoals = goals.map(goal =>
      goal.id === goalId
        ? { ...goal, status: goal.status === 'completed' ? 'active' : 'completed' as 'active' | 'completed' }
        : goal
    );
    saveGoals(updatedGoals);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="goal-page p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Target className="w-8 h-8" />
          My Goals
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingGoal ? 'Edit Goal' : 'Create New Goal'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white h-20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                  placeholder="e.g., Health, Career, Personal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded transition-colors"
                >
                  {editingGoal ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingGoal(null);
                    setFormData({
                      title: '',
                      description: '',
                      category: '',
                      deadline: '',
                      priority: 'medium'
                    });
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-indigo-500 transition-colors cursor-pointer"
            onClick={() => onSelectGoal(goal)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-white truncate">{goal.title}</h3>
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStatus(goal.id);
                  }}
                  className={`p-1 rounded ${goal.status === 'completed' ? 'text-green-400' : 'text-gray-400'} hover:text-green-300`}
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(goal);
                  }}
                  className="p-1 text-gray-400 hover:text-indigo-400"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(goal.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-gray-300 text-sm mb-3 line-clamp-2">{goal.description}</p>
            
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${getPriorityColor(goal.priority)}`}></span>
                <span className="text-gray-400 capitalize">{goal.priority}</span>
              </div>
              {goal.deadline && (
                <div className="flex items-center gap-1 text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(goal.deadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            {goal.category && (
              <div className="mt-2">
                <span className="bg-slate-700 text-gray-300 px-2 py-1 rounded text-xs">
                  {goal.category}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {goals.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Goals Yet</h3>
          <p className="text-gray-500 mb-4">Create your first goal to get started on your journey!</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Create Your First Goal
          </button>
        </div>
      )}
    </div>
  );
};

export default GoalPage;