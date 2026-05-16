import { useEffect, useState } from 'react';
import { listAlerts, createAlert, deleteAlert } from '../services/api';
import type { Alert } from '../types';
import Layout from '../components/Layout';
import { Trash2, Plus, Bell } from 'lucide-react';

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', alert_type: 'price', ticker: '', threshold_value: 0, condition: 'above' });

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await listAlerts();
      setAlerts(data);
    } catch (e) {
      console.error('Failed to load alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      await createAlert(form);
      setForm({ name: '', alert_type: 'price', ticker: '', threshold_value: 0, condition: 'above' });
      setShowCreate(false);
      loadAlerts();
    } catch (e) {
      alert('Failed to create alert');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this alert?')) return;
    try {
      await deleteAlert(id);
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (e) {
      alert('Failed to delete alert');
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'price': return '₹';
      case 'drawdown': return '📉';
      case 'goal': return '🎯';
      case 'rebalance': return '⚖️';
      default: return '🔔';
    }
  };

  if (loading) {
    return (
      <Layout title="Alerts">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-quantis-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Alerts">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-quantis-text">Alerts</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Alert
        </button>
      </div>
        
        {showCreate && (
          <div className="card p-4 mb-6">
            <h3 className="text-lg font-semibold text-quantis-text mb-4">Create Alert</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-quantis-text-muted mb-1">Alert Name</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" placeholder="e.g. RELIANCE above 3000" />
              </div>
              <div>
                <label className="block text-sm text-quantis-text-muted mb-1">Alert Type</label>
                <select value={form.alert_type} onChange={e => setForm({...form, alert_type: e.target.value})} className="input-field">
                  <option value="price">Price Alert</option>
                  <option value="drawdown">Drawdown Alert</option>
                  <option value="goal">Goal Progress</option>
                  <option value="rebalance">Rebalancing</option>
                </select>
              </div>
              {form.alert_type === 'price' && (
                <>
                  <div>
                    <label className="block text-sm text-quantis-text-muted mb-1">Ticker</label>
                    <input type="text" value={form.ticker} onChange={e => setForm({...form, ticker: e.target.value.toUpperCase()})} className="input-field" placeholder="e.g. RELIANCE.NS" />
                  </div>
                  <div>
                    <label className="block text-sm text-quantis-text-muted mb-1">Price Threshold</label>
                    <input type="number" value={form.threshold_value} onChange={e => setForm({...form, threshold_value: Number(e.target.value)})} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm text-quantis-text-muted mb-1">Condition</label>
                    <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} className="input-field">
                      <option value="above">Above</option>
                      <option value="below">Below</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleCreate} className="btn-primary">Create</button>
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}
        
        {alerts.length === 0 && !showCreate ? (
          <div className="card p-8 text-center">
            <Bell className="w-12 h-12 text-quantis-accent mx-auto mb-4" />
            <p className="text-quantis-text-muted mb-4">No alerts configured.</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Create Your First Alert
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map(a => (
              <div key={a.id} className="card p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{getAlertTypeIcon(a.alert_type)}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-quantis-text">{a.name}</h3>
                    <p className="text-sm text-quantis-text-muted">
                      {a.alert_type.toUpperCase()}
                      {a.ticker && ` • ${a.ticker}`}
                      {a.threshold_value && ` • ₹${a.threshold_value}`}
                      {a.condition && ` ${a.condition}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-xs rounded ${a.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {a.status}
                  </span>
                  <button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </Layout>
  );
}