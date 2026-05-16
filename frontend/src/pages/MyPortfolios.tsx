import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listPortfolios, deletePortfolio, exportPortfolioToPDF } from '../services/api';
import type { SavedPortfolio } from '../types';
import Layout from '../components/Layout';
import { Trash2, Download, Plus } from 'lucide-react';

export default function MyPortfolios() {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState<SavedPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    try {
      const data = await listPortfolios();
      setPortfolios(data);
    } catch (e) {
      console.error('Failed to load portfolios:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this portfolio?')) return;
    setDeleting(id);
    try {
      await deletePortfolio(id);
      setPortfolios(portfolios.filter(p => p.id !== id));
    } catch (e) {
      alert('Failed to delete portfolio');
    } finally {
      setDeleting(null);
    }
  };

  const handleExport = async (id: number) => {
    try {
      await exportPortfolioToPDF(id);
    } catch (e) {
      alert('Failed to export PDF');
    }
  };

  if (loading) {
    return (
      <Layout title="My Portfolios">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-quantis-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Portfolios">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-quantis-text">My Portfolios</h1>
        <button onClick={() => navigate('/portfolio')} className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Portfolio
        </button>
      </div>
        
        {portfolios.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-quantis-text-muted mb-4">No saved portfolios yet.</p>
            <button onClick={() => navigate('/portfolio')} className="btn-primary">
              Create Your First Portfolio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map(p => (
              <div key={p.id} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-quantis-text">
                      {p.name || `Portfolio #${p.id}`}
                    </h3>
                    <p className="text-sm text-quantis-text-muted">
                      {p.risk_profile.toUpperCase()} • {p.horizon_years} years
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-quantis-accent/20 text-quantis-accent text-xs rounded">
                    ₹{(p.investment_amount / 100000).toFixed(1)}L
                  </span>
                </div>
                
                <div className="text-xs text-quantis-text-muted mb-4">
                  Created: {new Date(p.created_at).toLocaleDateString('en-IN')}
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleExport(p.id)}
                    className="btn-secondary text-sm flex items-center gap-1 flex-1 justify-center"
                  >
                    <Download className="w-4 h-4" /> PDF
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id)}
                    disabled={deleting === p.id}
                    className="btn-secondary text-sm flex items-center gap-1 text-red-400 hover:text-red-300"
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