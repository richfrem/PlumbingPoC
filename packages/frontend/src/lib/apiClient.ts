// /lib/apiClient.ts
import axios from 'axios';
import { supabase } from './supabaseClient';

const apiClient = axios.create({
  // For development, use direct backend URL
  // In production, Vite proxy handles '/api' routing
  baseURL: import.meta.env.DEV ? 'http://localhost:3000/api' : '/api',
});

// Axios interceptor to automatically add the auth token to every request
apiClient.interceptors.request.use(
  async (config) => {
    console.log('🚀 API Client: Interceptor triggered for:', config.url);

    try {
      console.log('🔍 API Client: Getting session...');
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ API Client: Session retrieval error:', error);
        return config;
      }

      console.log('📋 API Client: Session result:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        userId: session?.user?.id,
        expiresAt: session?.expires_at,
        currentTime: Math.floor(Date.now() / 1000)
      });

      if (session?.access_token) {
        console.log('✅ API Client: Adding JWT token to request');
        config.headers.Authorization = `Bearer ${session.access_token}`;
        console.log('📤 API Client: Headers now include:', !!config.headers.Authorization);
      } else {
        console.warn('⚠️ API Client: No session or access token found - request may fail with 401');
        // Don't try to refresh here as it can cause issues
        // Let the request proceed and handle 401 errors in the response interceptor if needed
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

// Response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('⚠️ API Client: Received 401 Unauthorized - session may be expired');
      // Don't automatically retry or redirect, just log and pass the error through
      // The component can handle this appropriately
    }
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
