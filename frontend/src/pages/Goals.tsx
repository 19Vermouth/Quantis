import { useEffect, useState } from 'react';
import { listGoals, createGoal, updateGoal, deleteGoal } from '../services/api';
import type { Goal } from '../types';
import Layout from '../components/Layout';
import { Plus, Target, TrendingUp } from 'lucide-react';

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', target_amount: 1000000, current_amount: 0, target_date: '' });
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(form);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const data = await listGoals();
      setGoals(data);
    } catch (e) {
      console.error('Failed to load goals:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.target_date) return;
    try {
      await createGoal({ ...form, target_date: new Date(form.target_date).toISOString() });
      setForm({ name: '', target_amount: 1000000, current_amount: 0, target_date: '' });
      setShowCreate(false);
      loadGoals();
    } catch (e) {
      alert('Failed to create goal');
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      await updateGoal(id, { ...editForm, target_date: new Date(editForm.target_date).toISOString() });
      setEditing(null);
      loadGoals();
    } catch (e) {
      alert('Failed to update goal');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await deleteGoal(id);
      setGoals(goals.filter(g => g.id !== id));
    } catch (e) {
      alert('Failed to delete goal');
    }
  };

  const calculateProgress = (goal: Goal) => {
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const calculateMonthsRemaining = (goal: Goal) => {
    const target = new Date(goal.target_date);
    const now = new Date();
    return Math.max(Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)), 0);
  };

  if (loading) {
    return (
      <Layout title="Goals">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-quantis-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Goals">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-quantis-text">Financial Goals</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>
        
        {showCreate && (
          <div className="card p-4 mb-6">
            <h3 className="text-lg font-semibold text-quantis-text mb-4">Create Goal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-quantis-text-muted mb-1">Goal Name</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" placeholder="e.g. Retirement, Home, Education" />
              </div>
              <div>
                <label className="block text-sm text-quantis-text-muted mb-1">Target Amount (₹)</label>
                <input type="number" value={form.target_amount} onChange={e => setForm({...form, target_amount: Number(e.target.value)})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-quantis-text-muted mb-1">Current Amount (₹)</label>
                <input type="number" value={form.current_amount} onChange={e => setForm({...form, current_amount: Number(e.target.value)})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-quantis-text-muted mb-1">Target Date</label>
                <input type="date" value={form.target_date} onChange={e => setForm({...form, target_date: e.target.value})} className="input-field" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleCreate} className="btn-primary">Create</button>
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}
        
        {goals.length === 0 && !showCreate ? (
          <div className="card p-8 text-center">
            <Target className="w-12 h-12 text-quantis-accent mx-auto mb-4" />
            <p className="text-quantis-text-muted mb-4">No financial goals set yet.</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Set Your First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map(g => {
              const progress = calculateProgress(g);
              const monthsLeft = calculateMonthsRemaining(g);
              
              return (
                <div key={g.id} className="card p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-quantis-text">{g.name}</h3>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(g.id); setEditForm(g); }} className="text-quantis-text-muted hover:text-quantis-text text-sm">Edit</button>
                      <button onClick={() => handleDelete(g.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                    </div>
                  </div>
                  
                  {editing === g.id ? (
                    <div className="space-y-3">
                      <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="input-field" />
                      <input type="number" value={editForm.target_amount} onChange={e => setEditForm({...editForm, target_amount: Number(e.target.value)})} className="input-field" />
                      <input type="number" value={editForm.current_amount} onChange={e => setEditForm({...editForm, current_amount: Number(e.target.value)})} className="input-field" />
                      <input type="date" value={editForm.target_date?.split('T')[0]} onChange={e => setEditForm({...editForm, target_date: e.target.value})} className="input-field" />
                      <button onClick={() => handleUpdate(g.id)} className="btn-primary w-full">Save</button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-quantis-text-muted">Progress</span>
                          <span className="text-quantis-text font-medium">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-quantis-border rounded-full overflow-hidden">
                          <div className="h-full bg-quantis-accent" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-quantis-text-muted">Current</span>
                          <span className="text-quantis-text">₹{g.current_amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-quantis-text-muted">Target</span>
                          <span className="text-quantis-text">₹{g.target_amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-quantis-text-muted">Target Date</span>
                          <span className="text-quantis-text">{new Date(g.target_date).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-quantis-text-muted">Time Remaining</span>
                          <span className="text-quantis-text">{monthsLeft} months</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-quantis-border">
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-quantis-accent" />
                          <span className="text-quantis-text-muted">
                            Need ₹{Math.max(0, g.target_amount - g.current_amount).toLocaleString('en-IN')} more
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </Layout>
  );
}