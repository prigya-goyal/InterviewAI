import api from './api';
import type { DashboardData } from '@/types';

export const dashboardService = {
  async get() {
    const { data } = await api.get('/users/me/dashboard');
    return data.dashboard as DashboardData;
  },
};
