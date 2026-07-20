import api from './api';
import type { ProblemDetail, ProblemSummary, RunResult, Language } from '@/types';

export const problemService = {
  async list(params: { difficulty?: string; tags?: string; search?: string; page?: number } = {}) {
    const { data } = await api.get('/problems', { params });
    return data as { problems: ProblemSummary[]; total: number; page: number; pages: number };
  },
  async get(slug: string) {
    const { data } = await api.get(`/problems/${slug}`);
    return data.problem as ProblemDetail;
  },
  async run(slug: string, language: Language, code: string) {
    const { data } = await api.post(`/problems/${slug}/run`, { language, code });
    return data as RunResult;
  },
  async submit(slug: string, language: Language, code: string) {
    const { data } = await api.post(`/problems/${slug}/submit`, { language, code });
    return data as RunResult & { submission: unknown };
  },
  async explain(slug: string, submissionId: string) {
    const { data } = await api.post(`/problems/${slug}/explain/${submissionId}`);
    return data.explanation as string;
  },
  async toggleBookmark(problemId: string) {
    const { data } = await api.post(`/users/me/bookmarks/${problemId}`);
    return data as { bookmarked: boolean };
  },
  async saveNote(problemId: string, content: string) {
    const { data } = await api.put(`/users/me/notes/${problemId}`, { content });
    return data;
  },
};
