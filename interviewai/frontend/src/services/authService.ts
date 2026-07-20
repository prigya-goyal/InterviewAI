import api from './api';
import type { User } from '@/types';

export const authService = {
  async signup(name: string, email: string, password: string) {
    const { data } = await api.post('/auth/signup', { name, email, password });
    return data as { user: User; token: string };
  },
  async login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    return data as { user: User; token: string };
  },
  async googleLogin(idToken: string) {
    const { data } = await api.post('/auth/google', { idToken });
    return data as { user: User; token: string };
  },
  async forgotPassword(email: string) {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data as { message: string };
  },
  async resetPassword(token: string, password: string) {
    const { data } = await api.post(`/auth/reset-password/${token}`, { password });
    return data as { user: User; token: string };
  },
  async me() {
    const { data } = await api.get('/auth/me');
    return data.user as User;
  },
  async logout() {
    await api.post('/auth/logout');
  },
};
