import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, Flame, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-base/80 backdrop-blur-md">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <input
              placeholder="Search problems, companies, topics…"
              className="input pl-9 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 tag !py-1">
              <Flame className="h-3.5 w-3.5 text-amber" />
              <span className="font-mono text-xs">{user.streak?.current ?? 0} day streak</span>
            </div>
          )}

          <button onClick={toggleTheme} className="btn-ghost !p-2" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          <button className="btn-ghost !p-2 relative" aria-label="Notifications">
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-mint" />
          </button>

          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 hover:bg-surface-raised transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-mint/15 border border-mint/30 flex items-center justify-center text-sm font-display text-mint">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 card-raised !p-1.5 shadow-glow">
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-surface text-ink-muted hover:text-ink"
                  >
                    <UserIcon className="h-4 w-4" /> Profile
                  </Link>
                  <button
                    onClick={async () => {
                      setMenuOpen(false);
                      await logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-surface text-ink-muted hover:text-ink"
                  >
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
