import { useEffect, useState } from 'react';
import { Trophy, Medal } from 'lucide-react';
import api from '@/services/api';
import { Card, Skeleton } from '@/components/ui';

type Scope = 'global' | 'college' | 'friends';

interface Entry {
  rank: number;
  _id: string;
  name: string;
  avatar: string;
  college: string;
  xp: number;
  problemsSolved: number;
}

const medalColors = ['text-amber', 'text-ink-muted', 'text-amber-dim'];

export default function Leaderboard() {
  const [scope, setScope] = useState<Scope>('global');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/leaderboard', { params: { scope } })
      .then((res) => setEntries(res.data.leaderboard))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [scope]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber" />
        <h1 className="font-display text-2xl text-ink">Leaderboard</h1>
      </div>

      <div className="flex gap-1.5 bg-surface-raised border border-border rounded-lg p-1 w-fit">
        {(['global', 'college', 'friends'] as Scope[]).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
              scope === s ? 'bg-mint text-base' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-muted">No ranked users in this scope yet.</p>
        ) : (
          <div className="divide-y divide-border-subtle">
            {entries.map((e) => (
              <div key={e._id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-6 flex justify-center">
                  {e.rank <= 3 ? (
                    <Medal className={`h-4.5 w-4.5 ${medalColors[e.rank - 1]}`} />
                  ) : (
                    <span className="text-xs font-mono text-ink-faint">{e.rank}</span>
                  )}
                </div>
                <div className="h-8 w-8 rounded-full bg-mint/15 border border-mint/30 flex items-center justify-center text-xs font-display text-mint">
                  {e.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-ink">{e.name}</p>
                  <p className="text-xs text-ink-faint">{e.problemsSolved} solved</p>
                </div>
                <span className="font-mono text-sm text-mint">{e.xp} XP</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
