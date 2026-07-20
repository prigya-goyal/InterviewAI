import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowUpRight } from 'lucide-react';
import { companyService } from '@/services/companyService';
import { Card, Skeleton, EmptyState } from '@/components/ui';
import type { Company } from '@/types';

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    companyService
      .list()
      .then(setCompanies)
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Company Interview Prep</h1>
        <p className="text-sm text-ink-muted mt-1">Frequently asked problems, HR questions, and system design rounds by company.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <EmptyState
          title="No companies seeded yet"
          description="Run `npm run seed` in /backend to populate Google, Amazon, Meta, and more."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c) => (
            <Link key={c._id} to={`/companies/${c.slug}`}>
              <Card className="hover:border-mint/40 transition-colors h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-surface-raised flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-ink-muted" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-ink-faint" />
                </div>
                <h3 className="font-display text-sm text-ink mb-1">{c.name}</h3>
                <p className="text-xs text-ink-muted line-clamp-2">{c.description}</p>
                <div className="flex gap-3 mt-3 text-xs font-mono text-ink-faint">
                  <span className="text-difficulty-easy">{c.difficultyProfile?.easyPct ?? 30}% Easy</span>
                  <span className="text-difficulty-medium">{c.difficultyProfile?.mediumPct ?? 50}% Med</span>
                  <span className="text-difficulty-hard">{c.difficultyProfile?.hardPct ?? 20}% Hard</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
