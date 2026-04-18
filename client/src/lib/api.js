import axios from 'axios';

// Vite dev proxy sends /api and /auth to the Express server on :3001.
export const api = axios.create({ baseURL: '/' });

export async function getStatus() {
  const { data } = await api.get('/api/status');
  return data;
}
export async function getActivities() {
  const { data } = await api.get('/api/activities');
  return data;
}
export async function getActivity(id) {
  const { data } = await api.get(`/api/activities/${id}`);
  return data;
}
export async function getRecords() {
  const { data } = await api.get('/api/records');
  return data;
}
