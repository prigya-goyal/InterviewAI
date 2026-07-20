import api from './api';

export const aiService = {
  async getRoadmap(year: string, targetCompany: string, monthsRemaining: number) {
    const { data } = await api.post('/ai/roadmap', { year, targetCompany, monthsRemaining });
    return data.milestones as { month: number; focus: string; topics: string[]; goals: string[] }[];
  },
  async getRecommendations(targetCompany?: string) {
    const { data } = await api.get('/ai/recommendations', { params: { targetCompany } });
    return data as { weakTopics: string[]; recommendations: { topic: string; difficulty: string; reason: string }[] };
  },
};
