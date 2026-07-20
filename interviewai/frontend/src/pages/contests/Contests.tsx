import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Trophy, Clock, Zap } from 'lucide-react';
import { contestService } from '@/services/contestService';
import { Card, Button, Skeleton, EmptyState } from '@/components/ui';
import type { Contest } from '@/types';

const statusStyles: Record<string, string> = {
  live: 'text-mint bg-mint/10 border-mint/30',
  upcoming: 'text-signal bg-signal/10 border-signal/30',
  ended: 'text-ink-faint bg-surface-raised border-border',
};

export default function Contests() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contestService
      .list()
      .then(setContests)
      .catch(() => setContests([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRegister = async (slug: string) => {
    try {
      await contestService.register(slug);
      toast.success('Registered for contest.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">Contests</h1>
          <p className="text-sm text-ink-muted mt-1">Compete live, or take a virtual contest anytime.</p>
        </div>
        <Trophy className="h-6 w-6 text-amber" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : contests.length === 0 ? (
        <EmptyState title="No contests scheduled" description="Check back soon, or create one from the Admin Panel." />
      ) : (
        <div className="space-y-3">
          {contests.map((c) => (
            <Card key={c._id} className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Link to={`/contests/${c.slug}`} className="font-display text-sm text-ink hover:text-mint">
                    {c.title}
                  </Link>
                  <span className={`text-xs px-2 py-0.5 rounded-md border capitalize ${statusStyles[c.status || 'upcoming']}`}>
                    {c.status || 'upcoming'}
                  </span>
                  {c.isVirtual && (
                    <span className="text-xs px-2 py-0.5 rounded-md border border-border text-ink-faint flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Virtual
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-muted flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> {c.durationMinutes} min · {new Date(c.startTime).toLocaleString()}
                </p>
              </div>
              <Button variant="secondary" onClick={() => handleRegister(c.slug)}>
                Register
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
