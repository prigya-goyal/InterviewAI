import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Target, CheckCircle2, Mic, ArrowUpRight, Sparkles } from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import { useAuth } from '@/hooks/useAuth';
import { Card, Skeleton, DifficultyBadge } from '@/components/ui';
import { WeeklyProgressChart } from '@/components/charts/WeeklyProgressChart';
import type { DashboardData } from '@/types';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardService
      .get()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}</h1>
          <p className="text-sm text-ink-muted mt-1">Here's where your prep stands today.</p>
        </div>
        <Link to="/interview" className="btn-primary">
          <Mic className="h-4 w-4" /> Start AI Interview
        </Link>
      </div>

      {error && (
        <Card className="border-difficulty-hard/30 text-difficulty-hard text-sm">
          Couldn't load dashboard data: {error}. Make sure the backend is running and seeded.
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle2} label="Problems Solved" value={data?.problemsSolved} loading={loading} accent="mint" />
        <StatCard icon={Mic} label="Interviews Completed" value={data?.totalInterviews} loading={loading} accent="signal" />
        <StatCard icon={Target} label="Accuracy" value={data ? `${data.accuracy}%` : undefined} loading={loading} accent="amber" />
        <StatCard icon={Flame} label="Current Streak" value={data ? `${data.streak.current}d` : undefined} loading={loading} accent="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly progress */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display text-sm text-ink">Weekly Progress</h2>
            <span className="text-xs text-ink-faint">Last 7 days</span>
          </div>
          {loading ? <Skeleton className="h-[220px] w-full mt-4" /> : <WeeklyProgressChart data={data?.weeklyActivity || []} />}
        </Card>

        {/* Recommended */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-signal" />
            <h2 className="font-display text-sm text-ink">Recommended for You</h2>
          </div>
          <div className="space-y-3">
            {['Binary Search', 'Dynamic Programming', 'Graph Traversal'].map((topic) => (
              <div key={topic} className="flex items-center justify-between p-3 rounded-lg bg-surface-raised">
                <div>
                  <p className="text-sm text-ink">{topic}</p>
                  <p className="text-xs text-ink-faint mt-0.5">Based on recent submissions</p>
                </div>
                <DifficultyBadge difficulty="Medium" />
              </div>
            ))}
          </div>
          <Link to="/roadmap" className="flex items-center gap-1 text-xs text-mint mt-4 hover:underline">
            See full roadmap <ArrowUpRight className="h-3 w-3" />
          </Link>
        </Card>
      </div>

      {/* Recent interviews */}
      <Card>
        <h2 className="font-display text-sm text-ink mb-4">Recent Interviews</h2>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : data?.recentInterviews?.length ? (
          <div className="space-y-2">
            {data.recentInterviews.map((iv) => (
              <Link
                key={iv._id}
                to={`/interview/${iv._id}/results`}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-raised hover:bg-surface-overlay transition-colors"
              >
                <div>
                  <p className="text-sm text-ink capitalize">{iv.type} Interview</p>
                  <p className="text-xs text-ink-faint mt-0.5">{new Date(iv.startedAt).toLocaleDateString()}</p>
                </div>
                {iv.evaluation ? (
                  <span className="font-mono text-sm text-mint">{iv.evaluation.overallScore}/100</span>
                ) : (
                  <span className="text-xs text-amber">In progress</span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">No interviews yet — start your first one above.</p>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  accent,
}: {
  icon: typeof Flame;
  label: string;
  value?: string | number;
  loading: boolean;
  accent: 'mint' | 'signal' | 'amber';
}) {
  const accentClass = { mint: 'text-mint bg-mint/10', signal: 'text-signal bg-signal/10', amber: 'text-amber bg-amber/10' }[accent];
  return (
    <Card>
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${accentClass}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="text-xs text-ink-muted mb-1">{label}</p>
      {loading ? <Skeleton className="h-7 w-16" /> : <p className="stat-number">{value ?? '—'}</p>}
    </Card>
  );
}
