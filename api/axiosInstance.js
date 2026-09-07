import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { MOCK_ENABLED, MOCK_HANDLERS } from './mockData';

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const LOGIN_TIME_KEY = 'qryio_login_time';

// ─── Session Helpers ──────────────────────────────────────────────────────

export const setLoginTime = async () => {
  await AsyncStorage.setItem(LOGIN_TIME_KEY, Date.now().toString());
};

const isSessionExpired = async () => {
  const loginTime = await AsyncStorage.getItem(LOGIN_TIME_KEY);
  if (!loginTime) return true;
  return Date.now() - parseInt(loginTime, 10) > SESSION_DURATION_MS;
};

export const clearSession = async () => {
  await AsyncStorage.multiRemove(['token', 'qryio_user', LOGIN_TIME_KEY]);
};

// ─── Axios Instance ───────────────────────────────────────────────────────

const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BASE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Mock Adapter (no backend needed) ──────────────────────────────────
// Short-circuits requests that match MOCK_HANDLERS and resolves them
// locally with canned data, instead of hitting the network.
if (MOCK_ENABLED) {
  axiosInstance.defaults.adapter = async config => {
    const path = (config.url || '').replace(/^\/+|\/+$/g, '');
    const handler = MOCK_HANDLERS[path];

    let payload = {};
    try {
      payload =
        typeof config.data === 'string'
          ? JSON.parse(config.data)
          : (config.data ?? {});
    } catch {
      payload = {};
    }

    await new Promise(resolve => setTimeout(resolve, 300)); // fake latency

    if (!handler) {
      console.warn(`[mock] No mock handler for "${path}" — returning empty success.`);
    }

    return {
      data: handler
        ? handler(payload)
        : { status: 'success', message: 'OK (unmocked)', data: {} },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      request: {},
    };
  };
}

// ─── Request Interceptor ──────────────────────────────────────────────────

axiosInstance.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('token');
    const isAuthRoute =
      config.url?.includes('/auth/') || config.url?.includes('/user/profile');

    if (token && !isAuthRoute) {
      const expired = await isSessionExpired();
      if (expired) {
        await clearSession();
        router.replace('/'); // back to login
        return Promise.reject(new Error('Session expired'));
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => Promise.reject(error),
);

// ─── Response Interceptor ─────────────────────────────────────────────────

axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const isAuthRoute =
      requestUrl.includes('/auth/') || requestUrl.includes('/user/profile');

    if (status === 401 && !isAuthRoute) {
      await clearSession();
      router.replace('/');
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
