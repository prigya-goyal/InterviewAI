import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { companyService } from '@/services/companyService';
import { Card, DifficultyBadge, Skeleton } from '@/components/ui';
import type { Company } from '@/types';

export default function CompanyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    companyService
      .get(slug)
      .then(setCompany)
      .catch(() => setCompany(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!company) return <p className="text-ink-muted">Company not found.</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink">{company.name} Interview Prep</h1>
        <p className="text-sm text-ink-muted mt-1">{company.description}</p>
      </div>

      <Card>
        <h2 className="font-display text-sm text-ink mb-4">Frequently Asked Problems</h2>
        {company.frequentProblems?.length ? (
          <div className="space-y-2">
            {company.frequentProblems.map((p) => (
              <Link
                key={p._id}
                to={`/problems/${p.slug}`}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-raised hover:bg-surface-overlay transition-colors"
              >
                <span className="text-sm text-ink">{p.title}</span>
                <DifficultyBadge difficulty={p.difficulty} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">No problems tagged for this company yet — add them from the Admin Panel.</p>
        )}
      </Card>

      <Card>
        <h2 className="font-display text-sm text-ink mb-4">HR Questions</h2>
        {company.hrQuestions?.length ? (
          <ul className="space-y-2 text-sm text-ink-muted list-disc list-inside">
            {company.hrQuestions.map((q, i) => (
              <li key={i}>{q.question}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">No HR questions added yet.</p>
        )}
      </Card>

      <Card>
        <h2 className="font-display text-sm text-ink mb-4">System Design Questions</h2>
        {company.systemDesignQuestions?.length ? (
          <div className="space-y-2">
            {company.systemDesignQuestions.map((q, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface-raised">
                <span className="text-sm text-ink">{q.question}</span>
                <DifficultyBadge difficulty={q.difficulty} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">No system design questions added yet.</p>
        )}
      </Card>
    </div>
  );
}
