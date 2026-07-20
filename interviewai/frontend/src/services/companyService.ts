import api from './api';
import type { Company } from '@/types';

export const companyService = {
  async list() {
    const { data } = await api.get('/companies');
    return data.companies as Company[];
  },
  async get(slug: string) {
    const { data } = await api.get(`/companies/${slug}`);
    return data.company as Company;
  },
};
