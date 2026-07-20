import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Every request in the app goes through this instance so auth headers,
// error normalization, and base URL live in exactly one place.
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send the httpOnly auth cookie
});

// Attach the bearer token too, for environments where cookies aren't ideal
// (e.g. some mobile webviews) — backend accepts either.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('interviewai_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error shape so components can just read `err.message`.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;
