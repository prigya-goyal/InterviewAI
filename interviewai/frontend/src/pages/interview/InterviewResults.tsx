import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, AlertTriangle, TrendingUp, RotateCcw } from 'lucide-react';
import { interviewService } from '@/services/interviewService';
import { Card, Button, Skeleton } from '@/components/ui';
import type { Interview } from '@/types';

const SCORE_ROWS: { key: keyof NonNullable<Interview['evaluation']>; label: string }[] = [
  { key: 'communicationScore', label: 'Communication' },
  { key: 'codingScore', label: 'Coding' },
  { key: 'problemSolvingScore', label: 'Problem Solving' },
  { key: 'timeManagementScore', label: 'Time Management' },
  { key: 'confidenceScore', label: 'Confidence' },
];

export default function InterviewResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    interviewService
      .get(id)
      .then(setInterview)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!interview?.evaluation) {
    return <p className="text-ink-muted">No evaluation available for this interview yet.</p>;
  }

  const evaluation = interview.evaluation;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="text-center !py-10">
        <p className="text-xs text-ink-muted uppercase tracking-wide mb-2">Overall Score</p>
        <p className="font-mono font-bold text-5xl text-mint">{evaluation.overallScore}</p>
        <p className="text-ink-faint text-sm mt-1">out of 100</p>
      </Card>

      <Card>
        <h2 className="font-display text-sm text-ink mb-4">Score Breakdown</h2>
        <div className="space-y-3">
          {SCORE_ROWS.map(({ key, label }) => {
            const value = evaluation[key] as number;
            return (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink-muted">{label}</span>
                  <span className="font-mono text-ink">{value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-raised overflow-hidden">
                  <div className="h-full bg-mint rounded-full" style={{ width: `${value}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-mint" />
            <h2 className="font-display text-sm text-ink">Strengths</h2>
          </div>
          <ul className="space-y-1.5 text-sm text-ink-muted list-disc list-inside">
            {evaluation.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber" />
            <h2 className="font-display text-sm text-ink">Weaknesses</h2>
          </div>
          <ul className="space-y-1.5 text-sm text-ink-muted list-disc list-inside">
            {evaluation.weaknesses.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-signal" />
          <h2 className="font-display text-sm text-ink">Improvement Suggestions</h2>
        </div>
        <ul className="space-y-1.5 text-sm text-ink-muted list-disc list-inside">
          {evaluation.improvementSuggestions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </Card>

      <div className="flex justify-center">
        <Button onClick={() => navigate('/interview')}>
          <RotateCcw className="h-4 w-4" /> Start Another Interview
        </Button>
      </div>
    </div>
  );
}
