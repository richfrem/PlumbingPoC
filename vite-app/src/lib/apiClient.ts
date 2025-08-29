// /lib/apiClient.ts
import axios from 'axios';
import { supabase } from './supabaseClient';

const apiClient = axios.create({
  // The base URL is already handled by Vite's proxy,
  // so we just need to start with the '/api' prefix.
  baseURL: '/api',
});

// Axios interceptor to automatically add the auth token to every request
apiClient.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const uploadAttachments = async (requestId: string, files: File[], quoteId?: string) => {
  const formData = new FormData();
  formData.append('request_id', requestId);
  if (quoteId) {
    formData.append('quote_id', quoteId);
  }
  files.forEach(file => {
    formData.append('attachments', file);
  });

  return apiClient.post('/requests/attachments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export default apiClient;