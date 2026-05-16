import { useEffect, useState } from 'react';
import { listNotifications, markNotificationRead } from '../services/api';
import type { AppNotification } from '../types';
import Layout from '../components/Layout';
import { Check, Bell, AlertCircle, Target, RefreshCw } from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await listNotifications();
      setNotifications(data);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error('Failed to mark as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'goal': return <Target className="w-5 h-5 text-blue-400" />;
      case 'rebalance': return <RefreshCw className="w-5 h-5 text-purple-400" />;
      case 'report': return <Bell className="w-5 h-5 text-green-400" />;
      default: return <Bell className="w-5 h-5 text-quantis-accent" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <Layout title="Notifications">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-quantis-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Notifications">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-quantis-text">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-quantis-accent text-white text-sm rounded-full">{unreadCount}</span>
            )}
          </h1>
        </div>
        
        {notifications.length === 0 ? (
          <div className="card p-8 text-center">
            <Bell className="w-12 h-12 text-quantis-text-muted mx-auto mb-4" />
            <p className="text-quantis-text-muted">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div 
                key={n.id} 
                className={`card p-4 flex gap-4 ${n.is_read ? 'opacity-60' : 'border-l-4 border-l-quantis-accent'}`}
              >
                <div className="mt-1">
                  {getNotificationIcon(n.notification_type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-quantis-text">{n.title}</h3>
                  <p className="text-sm text-quantis-text-muted mt-1">{n.message}</p>
                  <p className="text-xs text-quantis-text-muted mt-2">
                    {new Date(n.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
                {!n.is_read && (
                  <button 
                    onClick={() => handleMarkRead(n.id)}
                    className="self-start p-2 text-quantis-text-muted hover:text-quantis-accent"
                    title="Mark as read"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
)}
      </div>
    </Layout>
  );
}