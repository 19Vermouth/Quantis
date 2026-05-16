import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, FolderOpen, GitBranch, Eye, Target, Bell, FileText, ClipboardCheck, Home, LogOut } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/my-portfolios', label: 'My Portfolios', icon: FolderOpen },
  { path: '/scenarios', label: 'Scenarios', icon: GitBranch },
  { path: '/watchlist', label: 'Watchlist', icon: Eye },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/notifications', label: 'Notifications', icon: FileText },
  { path: '/risk-questionnaire', label: 'Risk Assessment', icon: ClipboardCheck },
];

export default function Layout({ children, title }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-quantis-bg">
      <nav className="border-b border-quantis-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-quantis-accent rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-quantis-text">Quantis</span>
              </Link>
              {title && (
                <span className="text-quantis-text-muted">/ {title}</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Link to="/portfolio" className="btn-secondary text-sm">
                New Portfolio
              </Link>
              <span className="text-quantis-text-muted text-sm">{user?.email}</span>
              <button 
                onClick={logout} 
                className="text-quantis-text-muted hover:text-quantis-text text-sm flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-56 border-r border-quantis-border p-4 hidden lg:block">
          <div className="space-y-1">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  location.pathname === item.path
                    ? 'bg-quantis-accent/10 text-quantis-accent'
                    : 'text-quantis-text-muted hover:bg-quantis-border hover:text-quantis-text'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </aside>

        <main className="flex-1 max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}