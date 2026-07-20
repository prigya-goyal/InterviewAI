import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { Card, DifficultyBadge, Skeleton } from '@/components/ui';

export default function Analytics() {
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<{ topic: string; difficulty: string; reason: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiService
      .getRecommendations()
      .then((res) => {
        setWeakTopics(res.weakTopics);
        setRecommendations(res.recommendations);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Simple 12-week GitHub-style contribution heatmap using mock intensity data
  // until wired to a real /analytics/heatmap endpoint.
  const weeks = 12;
  const days = 7;
  const heat = Array.from({ length: weeks * days }, () => Math.floor(Math.random() * 4));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-signal" />
        <h1 className="font-display text-2xl text-ink">Analytics</h1>
      </div>

      <Card>
        <h2 className="font-display text-sm text-ink mb-4">Coding Activity</h2>
        <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-2">
          {heat.map((v, i) => (
            <div
              key={i}
              className="h-3 w-3 rounded-sm"
              style={{
                backgroundColor: v === 0 ? '#161C27' : v === 1 ? '#0A8F63' : v === 2 ? '#0FF0B4' : '#00E6A0',
              }}
            />
          ))}
        </div>
        <p className="text-xs text-ink-faint mt-2">Last {weeks} weeks · less → more active</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-display text-sm text-ink mb-4">Weakest Topics</h2>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : weakTopics.length ? (
            <div className="flex gap-2 flex-wrap">
              {weakTopics.map((t) => (
                <span key={t} className="tag !text-difficulty-hard !border-difficulty-hard/30">
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Not enough submission history yet to detect weak spots.</p>
          )}
        </Card>

        <Card>
          <h2 className="font-display text-sm text-ink mb-4">Difficulty-wise Performance</h2>
          <div className="space-y-3">
            {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
              <div key={d} className="flex items-center gap-3">
                <DifficultyBadge difficulty={d} />
                <div className="flex-1 h-1.5 rounded-full bg-surface-raised overflow-hidden">
                  <div
                    className="h-full bg-mint rounded-full"
                    style={{ width: `${d === 'Easy' ? 80 : d === 'Medium' ? 45 : 20}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="font-display text-sm text-ink mb-4">AI-Recommended Next Problems</h2>
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : recommendations.length ? (
          <div className="space-y-2">
            {recommendations.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface-raised">
                <div>
                  <p className="text-sm text-ink">{r.topic}</p>
                  <p className="text-xs text-ink-faint mt-0.5">{r.reason}</p>
                </div>
                <DifficultyBadge difficulty={r.difficulty as 'Easy' | 'Medium' | 'Hard'} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">Solve a few more problems to unlock personalized recommendations.</p>
        )}
      </Card>
    </div>
  );
}
