import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { Map, Sparkles } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { Card, Button, Skeleton } from '@/components/ui';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const COMPANIES = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Adobe', 'Atlassian', 'Uber'];

export default function Roadmap() {
  const [year, setYear] = useState(YEARS[2]);
  const [targetCompany, setTargetCompany] = useState(COMPANIES[0]);
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(false);
  const [milestones, setMilestones] = useState<{ month: number; focus: string; topics: string[]; goals: string[] }[]>([]);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await aiService.getRoadmap(year, targetCompany, months);
      setMilestones(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate roadmap');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Map className="h-5 w-5 text-signal" />
        <h1 className="font-display text-2xl text-ink">AI Roadmap Generator</h1>
      </div>
      <p className="text-sm text-ink-muted -mt-4">
        Tell us where you are and where you're headed — we'll build a month-by-month prep plan.
      </p>

      <Card>
        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Current Year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} className="input">
              {YEARS.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Target Company</label>
            <select value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} className="input">
              {COMPANIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Months Remaining</label>
            <input
              type="number"
              min={1}
              max={24}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="input"
            />
          </div>
          <Button type="submit" loading={loading} className="sm:col-span-3">
            <Sparkles className="h-4 w-4" /> Generate Roadmap
          </Button>
        </form>
      </Card>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {!loading && milestones.length > 0 && (
        <div className="space-y-4">
          {milestones.map((m) => (
            <Card key={m.month} className="flex gap-4">
              <div className="h-10 w-10 rounded-full bg-mint/10 border border-mint/30 flex items-center justify-center font-mono text-sm text-mint shrink-0">
                M{m.month}
              </div>
              <div>
                <h3 className="font-display text-sm text-ink mb-1">{m.focus}</h3>
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {m.topics.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
                <ul className="text-xs text-ink-muted list-disc list-inside space-y-0.5">
                  {m.goals.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
