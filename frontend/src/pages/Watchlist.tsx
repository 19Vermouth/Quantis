import { useEffect, useState } from 'react';
import { listWatchlists, createWatchlist, updateWatchlist, deleteWatchlist, getLiveMarket } from '../services/api';
import type { Watchlist, LiveQuote } from '../types';
import Layout from '../components/Layout';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';

export default function WatchlistPage() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [marketData, setMarketData] = useState<Record<string, LiveQuote>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTickers, setNewTickers] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editTickers, setEditTickers] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [lists, market] = await Promise.all([
        listWatchlists(),
        getLiveMarket().catch(() => ({ quotes: [] } as any))
      ]);
      setWatchlists(lists);
      const data: Record<string, LiveQuote> = {};
      market.quotes?.forEach((q: LiveQuote) => { data[q.symbol] = q; });
      setMarketData(data);
    } catch (e) {
      console.error('Failed to load:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const tickers = newTickers.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
    try {
      await createWatchlist({ name: newName, tickers });
      setNewName('');
      setNewTickers('');
      setShowCreate(false);
      loadData();
    } catch (e) {
      alert('Failed to create watchlist');
    }
  };

  const handleUpdate = async (id: number) => {
    const tickers = editTickers.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
    try {
      await updateWatchlist(id, { name: editName, tickers });
      setEditing(null);
      loadData();
    } catch (e) {
      alert('Failed to update watchlist');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this watchlist?')) return;
    try {
      await deleteWatchlist(id);
      setWatchlists(watchlists.filter(w => w.id !== id));
    } catch (e) {
      alert('Failed to delete watchlist');
    }
  };

  if (loading) {
    return (
      <Layout title="Watchlist">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-quantis-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Watchlist">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-quantis-text">Watchlist</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Watchlist
        </button>
      </div>
        
        {showCreate && (
          <div className="card p-4 mb-6">
            <h3 className="text-lg font-semibold text-quantis-text mb-4">Create Watchlist</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Watchlist Name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Tickers (comma separated, e.g. RELIANCE.NS, INFY.NS)"
                value={newTickers}
                onChange={e => setNewTickers(e.target.value)}
                className="input-field"
              />
              <div className="flex gap-2">
                <button onClick={handleCreate} className="btn-primary">Create</button>
                <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        )}
        
        {watchlists.length === 0 && !showCreate ? (
          <div className="card p-8 text-center">
            <p className="text-quantis-text-muted mb-4">No watchlists yet.</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Create Your First Watchlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {watchlists.map(w => (
              <div key={w.id} className="card p-4">
                {editing === w.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="input-field"
                    />
                    <input
                      type="text"
                      value={editTickers}
                      onChange={e => setEditTickers(e.target.value)}
                      className="input-field"
                      placeholder="Tickers"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(w.id)} className="btn-primary text-sm">Save</button>
                      <button onClick={() => setEditing(null)} className="btn-secondary text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-quantis-text">{w.name}</h3>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditing(w.id); setEditName(w.name); setEditTickers(w.tickers.join(', ')); }} className="text-quantis-text-muted hover:text-quantis-text text-sm">Edit</button>
                        <button onClick={() => handleDelete(w.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {w.tickers.map(t => {
                        const quote = marketData[t];
                        return (
                          <div key={t} className="flex justify-between items-center py-2 border-b border-quantis-border/30">
                            <span className="text-quantis-text">{t.replace('.NS', '')}</span>
                            {quote ? (
                              <div className={`flex items-center gap-1 ${quote.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {quote.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                <span className="text-sm">₹{quote.last_price.toFixed(2)} ({quote.change_percent.toFixed(2)}%)</span>
                              </div>
                            ) : (
                              <span className="text-quantis-text-muted text-sm">--</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
    </Layout>
  );
}