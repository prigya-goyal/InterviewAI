import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import {
  Play,
  Send,
  Bookmark,
  Maximize2,
  Minimize2,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { problemService } from '@/services/problemService';
import { Button, DifficultyBadge, Skeleton } from '@/components/ui';
import type { ProblemDetail as ProblemDetailType, Language, RunResult } from '@/types';

const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'cpp', label: 'C++' },
  { id: 'java', label: 'Java' },
];

const MONACO_LANG: Record<Language, string> = {
  python: 'python',
  javascript: 'javascript',
  cpp: 'cpp',
  java: 'java',
};

type Tab = 'description' | 'editorial' | 'submissions';

export default function ProblemDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [problem, setProblem] = useState<ProblemDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('python');
  const [code, setCode] = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [fullscreen, setFullscreen] = useState(false);
  const [tab, setTab] = useState<Tab>('description');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    problemService
      .get(slug)
      .then((p) => {
        setProblem(p);
        setCode(p.starterCode[language] || '// Start coding here\n');
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    if (problem) setCode(problem.starterCode[lang] || `// Start coding in ${lang}\n`);
  };

  const handleRun = async () => {
    if (!slug) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await problemService.run(slug, language, code);
      setResult(res);
      toast.success(res.overallStatus === 'Accepted' ? 'All visible tests passed' : res.overallStatus);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Run failed');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!slug) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await problemService.submit(slug, language, code);
      setResult(res);
      toast[res.overallStatus === 'Accepted' ? 'success' : 'error'](res.overallStatus);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[600px] w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!problem) return <p className="text-ink-muted">Problem not found.</p>;

  return (
    <div className={fullscreen ? 'fixed inset-0 z-50 bg-base p-4' : ''}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Left: statement */}
        <div className="card !p-0 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 pt-4 border-b border-border">
            <div className="flex gap-4 text-sm">
              {(['description', 'editorial', 'submissions'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-3 border-b-2 capitalize transition-colors ${
                    tab === t ? 'border-mint text-ink' : 'border-transparent text-ink-muted hover:text-ink'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button onClick={() => problem && problemService.toggleBookmark(problem._id)} className="mb-2">
              <Bookmark className={`h-4.5 w-4.5 ${problem.isBookmarked ? 'fill-mint text-mint' : 'text-ink-faint'}`} />
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex-1 max-h-[70vh]">
            {tab === 'description' && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <h1 className="font-display text-lg text-ink">{problem.title}</h1>
                  <DifficultyBadge difficulty={problem.difficulty} />
                </div>
                <div className="flex gap-1.5 flex-wrap mb-5">
                  {problem.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-ink-muted leading-relaxed whitespace-pre-line mb-5">{problem.statement}</p>

                {problem.examples.map((ex, i) => (
                  <div key={i} className="mb-4 bg-surface-raised rounded-lg p-3.5 font-mono text-xs">
                    <p className="text-ink-faint mb-1">Example {i + 1}:</p>
                    <p className="text-ink">Input: {ex.input}</p>
                    <p className="text-ink">Output: {ex.output}</p>
                    {ex.explanation && <p className="text-ink-muted mt-1">{ex.explanation}</p>}
                  </div>
                ))}

                {problem.constraints.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-ink-muted mb-2">Constraints:</p>
                    <ul className="list-disc list-inside text-xs text-ink-muted space-y-1 font-mono">
                      {problem.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {problem.hints.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowHints((s) => !s)}
                      className="flex items-center gap-1.5 text-xs text-signal hover:underline"
                    >
                      <Lightbulb className="h-3.5 w-3.5" /> {showHints ? 'Hide hints' : `Show ${problem.hints.length} hint(s)`}
                    </button>
                    {showHints && (
                      <ul className="mt-2 space-y-1.5 text-xs text-ink-muted list-disc list-inside">
                        {problem.hints.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            )}

            {tab === 'editorial' && (
              <p className="text-sm text-ink-muted whitespace-pre-line">
                {problem.editorial || 'No editorial available for this problem yet.'}
              </p>
            )}

            {tab === 'submissions' && <p className="text-sm text-ink-muted">Your submission history loads here.</p>}
          </div>
        </div>

        {/* Right: editor */}
        <div className="card !p-0 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as Language)}
                className="bg-surface-raised border border-border rounded-md text-xs px-2.5 py-1.5 text-ink"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1 text-ink-faint text-xs">
                <button onClick={() => setFontSize((s) => Math.max(10, s - 1))} className="px-1.5 hover:text-ink">
                  A-
                </button>
                <span className="font-mono">{fontSize}</span>
                <button onClick={() => setFontSize((s) => Math.min(24, s + 1))} className="px-1.5 hover:text-ink">
                  A+
                </button>
              </div>
            </div>
            <button onClick={() => setFullscreen((f) => !f)} className="text-ink-faint hover:text-ink">
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex-1 min-h-[360px]">
            <Editor
              height="100%"
              language={MONACO_LANG[language]}
              value={code}
              onChange={(v) => setCode(v || '')}
              theme="vs-dark"
              options={{
                fontSize,
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 12 },
              }}
            />
          </div>

          <div className="border-t border-border p-3 flex items-center justify-between gap-3">
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleRun} loading={running}>
                <Play className="h-3.5 w-3.5" /> Run
              </Button>
              <Button onClick={handleSubmit} loading={submitting}>
                <Send className="h-3.5 w-3.5" /> Submit
              </Button>
            </div>
          </div>

          {result && (
            <div className="border-t border-border p-4 max-h-56 overflow-y-auto">
              <div className={`flex items-center gap-2 mb-3 font-medium text-sm ${
                result.overallStatus === 'Accepted' ? 'text-mint' : 'text-difficulty-hard'
              }`}>
                {running || submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : result.overallStatus === 'Accepted' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {result.overallStatus}
                <span className="text-ink-faint font-mono text-xs ml-auto">{result.runtimeMs} ms</span>
              </div>
              <div className="space-y-2">
                {result.results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-surface-raised rounded-md px-3 py-2">
                    <span className="text-ink-muted">Test case {i + 1}</span>
                    {r.passed ? (
                      <span className="text-mint flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                      </span>
                    ) : (
                      <span className="text-difficulty-hard flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5" /> Failed
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
