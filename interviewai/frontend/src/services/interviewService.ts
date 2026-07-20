import api from './api';
import type { Interview } from '@/types';

export const interviewService = {
  async start(type: 'dsa' | 'hr' | 'system_design', companyId?: string) {
    const { data } = await api.post('/interviews/start', { type, companyId });
    return data.interview as Interview;
  },
  async sendMessage(interviewId: string, message: string, type: string = 'answer') {
    const { data } = await api.post(`/interviews/${interviewId}/message`, { message, type });
    return data as { message: string; interview: Interview };
  },
  async end(interviewId: string) {
    const { data } = await api.post(`/interviews/${interviewId}/end`);
    return data.interview as Interview;
  },
  async list() {
    const { data } = await api.get('/interviews');
    return data.interviews as Interview[];
  },
  async get(id: string) {
    const { data } = await api.get(`/interviews/${id}`);
    return data.interview as Interview;
  },
};
