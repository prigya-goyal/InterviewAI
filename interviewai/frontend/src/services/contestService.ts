import api from './api';
import type { Contest } from '@/types';

export const contestService = {
  async list() {
    const { data } = await api.get('/contests');
    return data.contests as Contest[];
  },
  async get(slug: string) {
    const { data } = await api.get(`/contests/${slug}`);
    return data.contest as Contest;
  },
  async register(slug: string) {
    await api.post(`/contests/${slug}/register`);
  },
  async leaderboard(slug: string) {
    const { data } = await api.get(`/contests/${slug}/leaderboard`);
    return data.leaderboard;
  },
};
