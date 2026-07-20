import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Flame, Bookmark } from 'lucide-react';
import { problemService } from '@/services/problemService';
import { Card, DifficultyBadge, Skeleton, EmptyState } from '@/components/ui';
import type { ProblemSummary } from '@/types';

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'] as const;

export default function ProblemList() {
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    problemService
      .list({ difficulty: difficulty === 'All' ? undefined : difficulty, search: search || undefined })
      .then((res) => setProblems(res.problems))
      .catch(() => setProblems([]))
      .finally(() => setLoading(false));
  }, [difficulty, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Coding Practice</h1>
        <p className="text-sm text-ink-muted mt-1">Sharpen your DSA skills, one problem at a time.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems…"
            className="input pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-surface-raised border border-border rounded-lg p-1">
          <Filter className="h-3.5 w-3.5 text-ink-faint ml-2" />
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                difficulty === d ? 'bg-mint text-base' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-ink-faint text-xs uppercase tracking-wide">
              <th className="text-left font-medium px-5 py-3 w-10"></th>
              <th className="text-left font-medium px-2 py-3">Title</th>
              <th className="text-left font-medium px-5 py-3">Difficulty</th>
              <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Tags</th>
              <th className="text-right font-medium px-5 py-3">Acceptance</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border-subtle">
                  <td className="px-5 py-4" colSpan={5}>
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))}

            {!loading &&
              problems.map((p) => (
                <tr key={p._id} className="border-b border-border-subtle hover:bg-surface-raised transition-colors">
                  <td className="px-5 py-3.5">
                    {p.isDailyChallenge && <Flame className="h-4 w-4 text-amber" />}
                  </td>
                  <td className="px-2 py-3.5">
                    <Link to={`/problems/${p.slug}`} className="text-ink hover:text-mint font-medium">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <DifficultyBadge difficulty={p.difficulty} />
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="flex gap-1.5 flex-wrap">
                      {p.tags.slice(0, 3).map((t) => (
                        <span key={t} className="tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-ink-muted">{p.stats.acceptanceRate}%</td>
                </tr>
              ))}
          </tbody>
        </table>

        {!loading && problems.length === 0 && (
          <div className="p-4">
            <EmptyState
              title="No problems found"
              description="Try a different search term or difficulty filter — or seed the database with `npm run seed` in /backend."
            />
          </div>
        )}
      </Card>
    </div>
  );
}

// Small helper re-exported for the Dashboard bookmark affordance elsewhere, if needed.
export function BookmarkIcon({ active }: { active: boolean }) {
  return <Bookmark className={`h-4 w-4 ${active ? 'fill-mint text-mint' : 'text-ink-faint'}`} />;
}
