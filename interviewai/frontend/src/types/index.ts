export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Language = 'cpp' | 'java' | 'python' | 'javascript';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  college: string;
  skills: string[];
  role: 'user' | 'admin';
  xp: number;
  level: number;
  streak: { current: number; longest: number; lastActiveDate: string | null };
  problemsSolved: number;
  bookmarkedProblems: string[];
  badges: Badge[];
  achievements: Achievement[];
}

export interface Badge {
  _id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface Achievement {
  _id: string;
  key: string;
  title: string;
  description: string;
  xpReward: number;
}

export interface ProblemSummary {
  _id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  tags: string[];
  stats: { totalSubmissions: number; acceptedSubmissions: number; acceptanceRate: number };
  isDailyChallenge?: boolean;
  isWeeklyChallenge?: boolean;
}

export interface ProblemDetail extends ProblemSummary {
  statement: string;
  constraints: string[];
  examples: { input: string; output: string; explanation: string }[];
  hints: string[];
  editorial?: string;
  starterCode: Record<Language, string>;
  testCases: { input: string; expectedOutput: string; isHidden: boolean }[];
  isBookmarked?: boolean;
  myNote?: string;
}

export interface TestResult {
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  stderr: string;
  runtimeMs: number | null;
}

export interface RunResult {
  overallStatus: string;
  runtimeMs: number;
  results: TestResult[];
}

export interface Interview {
  _id: string;
  type: 'dsa' | 'hr' | 'system_design';
  status: 'in_progress' | 'completed' | 'abandoned';
  transcript: { speaker: 'ai' | 'user'; message: string; type: string; timestamp: string }[];
  evaluation?: {
    overallScore: number;
    communicationScore: number;
    codingScore: number;
    problemSolvingScore: number;
    timeManagementScore: number;
    confidenceScore: number;
    strengths: string[];
    weaknesses: string[];
    improvementSuggestions: string[];
  };
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
}

export interface Company {
  _id: string;
  name: string;
  slug: string;
  logoUrl: string;
  description: string;
  frequentProblems?: ProblemSummary[];
  hrQuestions?: { question: string; category: string }[];
  systemDesignQuestions?: { question: string; difficulty: Difficulty }[];
  difficultyProfile: { easyPct: number; mediumPct: number; hardPct: number };
}

export interface Contest {
  _id: string;
  title: string;
  slug: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isVirtual: boolean;
  status?: 'upcoming' | 'live' | 'ended';
  problems: ProblemSummary[];
}

export interface DashboardData {
  totalInterviews: number;
  problemsSolved: number;
  accuracy: number;
  streak: { current: number; longest: number };
  weeklyActivity: { _id: string; submissions: number }[];
  recentInterviews: Interview[];
  xp: number;
  level: number;
}
