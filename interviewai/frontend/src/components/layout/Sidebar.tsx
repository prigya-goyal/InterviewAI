import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Code2,
  Mic,
  Building2,
  Trophy,
  BarChart3,
  Map,
  Users,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/problems', label: 'Practice', icon: Code2 },
  { to: '/interview', label: 'AI Interview', icon: Mic, highlight: true },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/contests', label: 'Contests', icon: Trophy },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/roadmap', label: 'Roadmap', icon: Map },
  { to: '/leaderboard', label: 'Leaderboard', icon: Users },
];

export function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border bg-base h-screen sticky top-0">
      <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
        <div className="h-7 w-7 rounded-md bg-mint flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-base" />
        </div>
        <span className="font-display font-semibold text-ink tracking-tight">InterviewAI</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, highlight }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-mint/10 text-mint border border-mint/20'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-raised border border-transparent',
                highlight && !isActive && 'text-signal'
              )
            }
          >
            <Icon className="h-4.5 w-4.5" />
            {label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-4 border-t border-border pt-4',
                isActive ? 'text-mint' : 'text-ink-muted hover:text-ink'
              )
            }
          >
            <ShieldCheck className="h-4.5 w-4.5" />
            Admin Panel
          </NavLink>
        )}
      </nav>

      {user && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-ink-muted mb-1.5">
            <span>Level {user.level}</span>
            <span className="font-mono">{user.xp} XP</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-raised overflow-hidden">
            <div
              className="h-full bg-mint rounded-full transition-all"
              style={{ width: `${(user.xp % 100)}%` }}
            />
          </div>
        </div>
      )}
    </aside>
  );
}
