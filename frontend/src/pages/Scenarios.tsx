import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listScenarios, deleteScenario } from '../services/api';
import type { Scenario } from '../types';
import Layout from '../components/Layout';
import { Trash2, Play, Plus } from 'lucide-react';

export default function Scenarios() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      const data = await listScenarios();
      setScenarios(data);
    } catch (e) {
      console.error('Failed to load scenarios:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this scenario?')) return;
    try {
      await deleteScenario(id);
      setScenarios(scenarios.filter(s => s.id !== id));
    } catch (e) {
      alert('Failed to delete scenario');
    }
  };

  const handleRun = (scenario: Scenario) => {
    // Navigate to portfolio with pre-filled values
    navigate('/portfolio', { 
      state: { 
        age: scenario.age,
        risk_profile: scenario.risk_profile,
        investment_amount: scenario.investment_amount,
        horizon_years: scenario.horizon_years
      } 
    });
  };

  if (loading) {
    return (
      <Layout title="Scenarios">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-quantis-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Scenarios">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-quantis-text">Saved Scenarios</h1>
        <button onClick={() => navigate('/portfolio')} className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Scenario
        </button>
      </div>
        
        <div className="card p-4 mb-6">
          <p className="text-quantis-text-muted text-sm">
            Scenarios allow you to save "what-if" portfolio configurations. 
            Save a scenario while generating a portfolio, then come back later to compare different strategies.
          </p>
        </div>
        
        {scenarios.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-quantis-text-muted mb-4">No saved scenarios yet.</p>
            <button onClick={() => navigate('/portfolio')} className="btn-primary">
              Create Your First Scenario
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {scenarios.map(s => (
              <div key={s.id} className="card p-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-quantis-text">{s.name}</h3>
                  <p className="text-sm text-quantis-text-muted">
                    {s.risk_profile.toUpperCase()} • ₹{(s.investment_amount / 100000).toFixed(1)}L • {s.horizon_years} years
                  </p>
                  <p className="text-xs text-quantis-text-muted mt-1">
                    Created: {new Date(s.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleRun(s)}
                    className="btn-primary text-sm flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" /> Run
                  </button>
                  <button 
                    onClick={() => handleDelete(s.id)}
                    className="btn-secondary text-sm flex items-center gap-1 text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </Layout>
  );
}