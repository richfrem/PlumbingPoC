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
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ API Client: Session retrieval error:', error);
        return config;
      }

      if (session?.access_token) {
        console.log('✅ API Client: Adding JWT token to request');
        config.headers.Authorization = `Bearer ${session.access_token}`;
      } else {
        console.warn('⚠️ API Client: No session or access token found');
      }
    } catch (error) {
      console.error('❌ API Client: Exception getting session:', error);
    }

    return config;
  },
  (error) => {
    console.error('❌ API Client: Request interceptor error:', error);
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
    formData.append('attachment', file);
  });

  return apiClient.post('/requests/attachments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export default apiClient;