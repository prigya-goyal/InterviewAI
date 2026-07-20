import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Trophy, Clock, Zap, Play, Users, CheckCircle2, Award, AlertCircle } from 'lucide-react';
import { contestService } from '@/services/contestService';
import { Card, Button, Skeleton, DifficultyBadge } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import type { Contest } from '@/types';

interface ParticipantRanked {
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  score: number;
  problemsSolved: number;
  penaltyMinutes: number;
}

export default function ContestDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [contest, setContest] = useState<Contest | null>(null);
  const [leaderboard, setLeaderboard] = useState<ParticipantRanked[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'leaderboard'>('overview');
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [statusText, setStatusText] = useState('');
  
  // Virtual mode state
  const [virtualStart, setVirtualStart] = useState<string | null>(null);

  const fetchContestData = async () => {
    if (!slug) return;
    try {
      const c = await contestService.get(slug);
      setContest(c);
      
      const lb = await contestService.leaderboard(slug);
      setLeaderboard(lb);

      // Check for local storage virtual start
      const storedStart = localStorage.getItem(`contest_virtual_start_${c._id}`);
      if (storedStart) {
        setVirtualStart(storedStart);
      }
    } catch (err: any) {
      toast.error('Failed to load contest details');
      navigate('/contests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContestData();
  }, [slug]);

  // Update timer every second
  useEffect(() => {
    if (!contest) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const start = new Date(contest.startTime).getTime();
      const end = new Date(contest.endTime).getTime();

      if (contest.isVirtual && virtualStart) {
        const vStart = new Date(virtualStart).getTime();
        const vEnd = vStart + contest.durationMinutes * 60 * 1000;
        const diff = vEnd - now;
        if (diff <= 0) {
          setTimeRemaining(0);
          setStatusText('Virtual Contest Ended');
        } else {
          setTimeRemaining(diff);
          setStatusText('Virtual Contest Active');
        }
        return;
      }

      if (now < start) {
        setTimeRemaining(start - now);
        setStatusText('Starts In');
      } else if (now >= start && now <= end) {
        setTimeRemaining(end - now);
        setStatusText('Ends In');
      } else {
        setTimeRemaining(0);
        setStatusText('Contest Ended');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [contest, virtualStart]);

  const handleRegister = async () => {
    if (!contest || !slug) return;
    try {
      await contestService.register(slug);
      toast.success('Registered for contest!');
      fetchContestData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register');
    }
  };

  const handleStartVirtual = () => {
    if (!contest) return;
    const nowStr = new Date().toISOString();
    localStorage.setItem(`contest_virtual_start_${contest._id}`, nowStr);
    setVirtualStart(nowStr);
    toast.success('Virtual contest started! Good luck.');
  };

  const formatTimer = (ms: number | null) => {
    if (ms === null || ms <= 0) return '00:00:00';
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    const parts = [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ];

    if (days > 0) {
      return `${days}d ${parts.join(':')}`;
    }
    return parts.join(':');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!contest) return null;

  const isRegistered = contest.participants.some((p) => String(p.user) === String(user?._id));
  const isUpcoming = new Date() < new Date(contest.startTime);
  const isLive = new Date() >= new Date(contest.startTime) && new Date() <= new Date(contest.endTime);
  const isEnded = new Date() > new Date(contest.endTime);

  const canViewProblems =
    isLive && isRegistered || 
    (contest.isVirtual && virtualStart && timeRemaining !== null && timeRemaining > 0) ||
    isEnded;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-background to-surface-raised border border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xxs font-semibold uppercase tracking-wider text-mint px-2 py-0.5 rounded bg-mint/10 border border-mint/20">
                {contest.isVirtual ? 'Virtual Contest' : 'Timed Contest'}
              </span>
              <span className="text-xxs text-ink-muted flex items-center gap-1">
                <Clock className="h-3 w-3" /> {contest.durationMinutes} minutes
              </span>
            </div>
            <h1 className="font-display text-2xl text-ink">{contest.title}</h1>
            <p className="text-xs text-ink-muted max-w-xl">{contest.description || 'Compete with peers in algorithmic challenges.'}</p>
          </div>

          {/* Timer Card */}
          <div className="bg-background/60 border border-border/80 rounded-xl p-4 min-w-[200px] text-center backdrop-blur-md">
            <p className="text-xxs uppercase tracking-wider text-ink-muted font-medium mb-1">{statusText}</p>
            <p className="font-mono text-2xl font-semibold text-mint tracking-wider">
              {formatTimer(timeRemaining)}
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab('overview')}
          className={`pb-2 text-xs font-semibold px-1.5 transition-colors border-b-2 ${
            tab === 'overview' ? 'border-mint text-mint' : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Overview & Problems
        </button>
        <button
          onClick={() => setTab('leaderboard')}
          className={`pb-2 text-xs font-semibold px-1.5 transition-colors border-b-2 ${
            tab === 'leaderboard' ? 'border-mint text-mint' : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Leaderboard
        </button>
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Action / Banner Box */}
          {!isRegistered && !isEnded && (
            <Card className="flex flex-col sm:flex-row items-center justify-between gap-4 border-mint/20 bg-mint/5">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-mint shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-ink">Register for this contest</p>
                  <p className="text-xxs text-ink-muted">Join other coders in solving these problems.</p>
                </div>
              </div>
              <Button onClick={handleRegister} className="text-xs py-1.5 px-4 shrink-0">
                Register Now
              </Button>
            </Card>
          )}

          {isRegistered && isUpcoming && (
            <Card className="flex items-center gap-3 border-signal/20 bg-signal/5">
              <Clock className="h-5 w-5 text-signal" />
              <div>
                <p className="text-xs font-semibold text-ink">You are registered!</p>
                <p className="text-xxs text-ink-muted">The contest starts soon. Please wait for the countdown to complete.</p>
              </div>
            </Card>
          )}

          {contest.isVirtual && isEnded && !virtualStart && (
            <Card className="flex flex-col sm:flex-row items-center justify-between gap-4 border-amber/20 bg-amber/5">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-amber shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-ink">Take Virtual Contest</p>
                  <p className="text-xxs text-ink-muted">Start a personal {contest.durationMinutes}-minute countdown and solve problems under simulated test pressure.</p>
                </div>
              </div>
              <Button onClick={handleStartVirtual} className="text-xs py-1.5 px-4 shrink-0 bg-amber hover:bg-amber/80 border-amber">
                <Play className="h-3 w-3 mr-1" /> Start Virtual
              </Button>
            </Card>
          )}

          {/* Problems List */}
          <div className="space-y-3">
            <h3 className="font-display text-sm text-ink">Problems</h3>
            
            {!canViewProblems ? (
              <Card className="flex flex-col items-center justify-center text-center py-12 px-6">
                <AlertCircle className="h-8 w-8 text-ink-muted mb-2" />
                <p className="text-xs font-medium text-ink">Problems are locked</p>
                <p className="text-xxs text-ink-muted max-w-sm mt-1">
                  {!isRegistered 
                    ? 'You must register for the contest to view the problems when it starts.' 
                    : contest.isVirtual 
                    ? 'Start the virtual contest to unlock the problems and begin your session.' 
                    : 'The problems will be revealed when the contest begins.'}
                </p>
              </Card>
            ) : contest.problems?.length === 0 ? (
              <p className="text-xs text-ink-muted">No problems assigned to this contest.</p>
            ) : (
              <div className="space-y-2">
                {contest.problems.map((p: any) => (
                  <Link
                    key={p._id}
                    to={`/problems/${p.slug}?contestId=${contest._id}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-raised hover:bg-surface-overlay transition-colors"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-ink hover:text-mint transition-colors">
                        {p.title}
                      </h4>
                      <p className="text-[10px] text-ink-muted mt-1 uppercase tracking-wider">
                        TAGS: {p.tags?.slice(0, 3).join(', ') || 'General'}
                      </p>
                    </div>
                    <DifficultyBadge difficulty={p.difficulty} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'leaderboard' && (
        <Card className="overflow-x-auto">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4.5 w-4.5 text-mint" />
            <h3 className="font-display text-sm text-ink">Contest Standings</h3>
          </div>
          {leaderboard.length === 0 ? (
            <p className="text-xs text-ink-muted text-center py-8">No participation logs recorded yet.</p>
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border text-ink-muted uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 font-medium">Rank</th>
                  <th className="py-2.5 font-medium">User</th>
                  <th className="py-2.5 font-medium text-center">Problems Solved</th>
                  <th className="py-2.5 font-medium text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, idx) => (
                  <tr key={row.user._id} className="border-b border-border/50 hover:bg-surface-raised/40">
                    <td className="py-3 font-mono font-medium">
                      {idx + 1 === 1 ? (
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber/15 text-amber">
                          🥇
                        </span>
                      ) : idx + 1 === 2 ? (
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-ink-muted/15 text-ink-muted">
                          🥈
                        </span>
                      ) : idx + 1 === 3 ? (
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-difficulty-hard/15 text-difficulty-hard">
                          🥉
                        </span>
                      ) : (
                        idx + 1
                      )}
                    </td>
                    <td className="py-3 flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-mint/10 border border-mint/20 flex items-center justify-center font-display text-[10px] text-mint shrink-0">
                        {row.user.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-ink">{row.user.name}</span>
                    </td>
                    <td className="py-3 text-center font-semibold text-ink">
                      {row.problemsSolved}
                    </td>
                    <td className="py-3 text-right font-mono font-semibold text-mint">
                      {row.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}
